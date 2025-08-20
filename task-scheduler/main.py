"""
Task Scheduler CLI

Command-line interface for the Claude Code Task Scheduler using Typer.
"""
import typer
from typing import Optional
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich import print as rprint
from datetime import datetime
import sys
from pathlib import Path

# Add current directory to path for imports
sys.path.append('.')

from services.yaml_manager import YamlTaskManager
from services.token_monitor import TokenMonitor
from services.workspace_manager import WorkspaceManager
from flows.task_processor import process_tasks_flow, get_task_status_flow, cleanup_flow

app = typer.Typer(help="Claude Code Task Scheduler - Automate tasks with intelligent scheduling")
console = Console()


@app.command()
def run_tasks(
    max_tasks: int = typer.Option(5, "--max-tasks", "-m", help="Maximum number of tasks to process"),
    no_token_check: bool = typer.Option(False, "--no-token-check", help="Skip token limit checking"),
    timeout: int = typer.Option(300, "--timeout", "-t", help="Task timeout in seconds"),
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Verbose output")
):
    """Run pending tasks with Claude Code"""
    console.print("[bold green]Starting task processing...[/bold green]")
    
    try:
        # Run the Prefect flow
        result = process_tasks_flow(
            max_tasks=max_tasks, 
            check_tokens=not no_token_check,
            task_timeout=timeout
        )
        
        if result.get("success", False):
            processed = result.get("processed", 0)
            console.print(f"[green]✓[/green] Successfully processed {processed} tasks")
            
            if verbose and result.get("results"):
                _display_task_results(result["results"])
                
        else:
            error = result.get("error", "Unknown error")
            console.print(f"[red]✗[/red] Task processing failed: {error}")
            raise typer.Exit(1)
            
    except Exception as e:
        console.print(f"[red]✗[/red] Error running tasks: {str(e)}")
        raise typer.Exit(1)


@app.command()
def list_tasks(
    status: Optional[str] = typer.Option(None, "--status", "-s", help="Filter by status (pending, running, completed, failed, paused)"),
    detailed: bool = typer.Option(False, "--detailed", "-d", help="Show detailed information")
):
    """List all tasks with their status"""
    task_manager = YamlTaskManager()
    
    if status:
        tasks = task_manager.get_tasks_by_status(status)
        console.print(f"[bold]Tasks with status: {status}[/bold]")
    else:
        tasks = task_manager.load_tasks()
        console.print("[bold]All Tasks[/bold]")
    
    if not tasks:
        console.print("[yellow]No tasks found[/yellow]")
        return
    
    if detailed:
        _display_detailed_tasks(tasks)
    else:
        _display_task_table(tasks)


@app.command()
def add_task(
    title: str = typer.Argument(..., help="Task title"),
    description: str = typer.Argument(..., help="Task description"),
    template: str = typer.Option("default", "--template", "-t", help="Prompt template to use")
):
    """Add a new task"""
    task_manager = YamlTaskManager()
    
    try:
        new_task = task_manager.add_task(title, description, template)
        console.print(f"[green]✓[/green] Added task: {new_task.id} - {new_task.title}")
        
    except Exception as e:
        console.print(f"[red]✗[/red] Error adding task: {str(e)}")
        raise typer.Exit(1)


@app.command()
def reset_task(
    task_id: str = typer.Argument(..., help="Task ID to reset"),
    confirm: bool = typer.Option(False, "--yes", "-y", help="Skip confirmation")
):
    """Reset a failed or completed task back to pending"""
    task_manager = YamlTaskManager()
    
    # Get task info
    task = task_manager.get_task(task_id)
    if not task:
        console.print(f"[red]✗[/red] Task {task_id} not found")
        raise typer.Exit(1)
    
    if not confirm:
        confirm = typer.confirm(f"Reset task '{task.title}' ({task.status}) to pending?")
    
    if confirm:
        if task_manager.reset_task(task_id):
            console.print(f"[green]✓[/green] Reset task: {task_id}")
        else:
            console.print(f"[red]✗[/red] Failed to reset task: {task_id}")
            raise typer.Exit(1)
    else:
        console.print("Operation cancelled")


@app.command()
def delete_task(
    task_id: str = typer.Argument(..., help="Task ID to delete"),
    confirm: bool = typer.Option(False, "--yes", "-y", help="Skip confirmation")
):
    """Delete a task"""
    task_manager = YamlTaskManager()
    
    # Get task info
    task = task_manager.get_task(task_id)
    if not task:
        console.print(f"[red]✗[/red] Task {task_id} not found")
        raise typer.Exit(1)
    
    if not confirm:
        confirm = typer.confirm(f"Delete task '{task.title}'? This cannot be undone.")
    
    if confirm:
        if task_manager.delete_task(task_id):
            console.print(f"[green]✓[/green] Deleted task: {task_id}")
        else:
            console.print(f"[red]✗[/red] Failed to delete task: {task_id}")
            raise typer.Exit(1)
    else:
        console.print("Operation cancelled")


@app.command()
def status():
    """Show system status and statistics"""
    try:
        status_info = get_task_status_flow()
        
        _display_system_status(status_info)
        
    except Exception as e:
        console.print(f"[red]✗[/red] Error getting status: {str(e)}")
        raise typer.Exit(1)


@app.command()
def monitor_tokens():
    """Check Claude Code token usage and limits"""
    token_monitor = TokenMonitor()
    
    try:
        usage_summary = token_monitor.get_usage_summary()
        
        _display_token_status(usage_summary)
        
    except Exception as e:
        console.print(f"[red]✗[/red] Error checking token status: {str(e)}")
        raise typer.Exit(1)


@app.command()
def cleanup(
    workspaces: bool = typer.Option(True, "--workspaces/--no-workspaces", help="Clean up temporary workspaces"),
    failed_tasks: bool = typer.Option(False, "--failed-tasks", help="Reset failed tasks to pending"),
    completed_tasks: bool = typer.Option(False, "--completed-tasks", help="Delete completed tasks"),
    confirm: bool = typer.Option(False, "--yes", "-y", help="Skip confirmation")
):
    """Clean up workspaces and optionally reset/delete tasks"""
    
    actions = []
    if workspaces:
        actions.append("clean up temporary workspaces")
    if failed_tasks:
        actions.append("reset failed tasks to pending")
    if completed_tasks:
        actions.append("delete completed tasks")
    
    if not actions:
        console.print("[yellow]No cleanup actions specified[/yellow]")
        return
    
    if not confirm:
        action_list = "\n".join(f"  • {action}" for action in actions)
        confirm = typer.confirm(f"This will:\n{action_list}\n\nContinue?")
    
    if confirm:
        try:
            result = cleanup_flow(
                cleanup_failed=failed_tasks,
                cleanup_completed=completed_tasks
            )
            
            console.print(f"[green]✓[/green] Cleanup completed:")
            console.print(f"  • Cleaned {result['cleaned_workspaces']} workspaces")
            if failed_tasks:
                console.print(f"  • Reset {result['reset_tasks']} failed tasks")
            
        except Exception as e:
            console.print(f"[red]✗[/red] Cleanup failed: {str(e)}")
            raise typer.Exit(1)
    else:
        console.print("Operation cancelled")


@app.command()
def serve():
    """Start Prefect server for monitoring (development mode)"""
    console.print("[bold blue]Starting Prefect server for monitoring...[/bold blue]")
    console.print("Access the UI at: [link]http://localhost:4200[/link]")
    
    try:
        import subprocess
        subprocess.run(["prefect", "server", "start"], check=True)
    except subprocess.CalledProcessError as e:
        console.print(f"[red]✗[/red] Failed to start Prefect server: {e}")
        raise typer.Exit(1)
    except KeyboardInterrupt:
        console.print("\n[yellow]Prefect server stopped[/yellow]")


def _display_task_table(tasks):
    """Display tasks in a table format"""
    table = Table(title="Tasks")
    
    table.add_column("ID", style="cyan")
    table.add_column("Title", style="white")
    table.add_column("Status", style="bold")
    table.add_column("Created", style="dim")
    table.add_column("Attempts", style="dim")
    
    for task in tasks:
        status_color = {
            'pending': 'yellow',
            'running': 'blue',
            'completed': 'green',
            'failed': 'red',
            'paused': 'magenta'
        }.get(task.status, 'white')
        
        created_date = datetime.fromisoformat(task.created_at.replace('Z', '+00:00')).strftime('%m/%d %H:%M')
        
        table.add_row(
            task.id,
            task.title[:50] + "..." if len(task.title) > 50 else task.title,
            f"[{status_color}]{task.status}[/{status_color}]",
            created_date,
            str(task.attempts)
        )
    
    console.print(table)


def _display_detailed_tasks(tasks):
    """Display detailed task information"""
    for task in tasks:
        status_color = {
            'pending': 'yellow',
            'running': 'blue', 
            'completed': 'green',
            'failed': 'red',
            'paused': 'magenta'
        }.get(task.status, 'white')
        
        panel_content = f"""[bold]Title:[/bold] {task.title}
[bold]Status:[/bold] [{status_color}]{task.status}[/{status_color}]
[bold]Created:[/bold] {task.created_at}
[bold]Attempts:[/bold] {task.attempts}/{task.max_attempts}
[bold]Template:[/bold] {task.prompt_template}

[bold]Description:[/bold]
{task.description}"""
        
        if task.last_error:
            panel_content += f"\n\n[bold red]Last Error:[/bold red]\n{task.last_error}"
        
        if task.session_id:
            panel_content += f"\n\n[bold]Session ID:[/bold] {task.session_id}"
            
        console.print(Panel(panel_content, title=f"Task {task.id}"))


def _display_task_results(results):
    """Display task processing results"""
    table = Table(title="Task Results")
    
    table.add_column("Task ID", style="cyan")
    table.add_column("Status", style="bold")
    table.add_column("Duration", style="dim")
    table.add_column("Files", style="dim")
    table.add_column("Error", style="red")
    
    for result in results:
        status = "✓ Success" if result.get("success", False) else "✗ Failed"
        status_color = "green" if result.get("success", False) else "red"
        
        duration = f"{result.get('execution_time', 0):.1f}s" if result.get('execution_time') else "N/A"
        files_count = str(len(result.get('changed_files', [])))
        error = result.get('error', '')[:50] + "..." if len(result.get('error', '')) > 50 else result.get('error', '')
        
        table.add_row(
            result.get('task_id', 'Unknown'),
            f"[{status_color}]{status}[/{status_color}]",
            duration,
            files_count,
            error
        )
    
    console.print(table)


def _display_system_status(status_info):
    """Display system status information"""
    stats = status_info.get("task_statistics", {})
    token_usage = status_info.get("token_usage", {})
    workspaces = status_info.get("active_workspaces", 0)
    
    # Task statistics panel
    task_content = f"""[bold green]Total:[/bold green] {stats.get('total', 0)}
[bold yellow]Pending:[/bold yellow] {stats.get('pending', 0)}
[bold blue]Running:[/bold blue] {stats.get('running', 0)}  
[bold green]Completed:[/bold green] {stats.get('completed', 0)}
[bold red]Failed:[/bold red] {stats.get('failed', 0)}
[bold magenta]Paused:[/bold magenta] {stats.get('paused', 0)}"""
    
    console.print(Panel(task_content, title="Task Statistics"))
    
    # Token usage panel
    if token_usage.get("status") != "unknown":
        _display_token_status(token_usage)
    
    # System info
    system_content = f"""[bold]Active Workspaces:[/bold] {workspaces}
[bold]Last Updated:[/bold] {status_info.get('timestamp', 'Unknown')}"""
    
    console.print(Panel(system_content, title="System Info"))


def _display_token_status(usage_summary):
    """Display token usage status"""
    status = usage_summary.get("status", "unknown")
    status_color = {
        "ok": "green",
        "critical": "red", 
        "unknown": "yellow"
    }.get(status, "white")
    
    can_run = "✓ Yes" if usage_summary.get("can_run_tasks", False) else "✗ No"
    can_run_color = "green" if usage_summary.get("can_run_tasks", False) else "red"
    
    warning = "⚠️ Active" if usage_summary.get("warning_active", False) else "✓ Normal"
    warning_color = "yellow" if usage_summary.get("warning_active", False) else "green"
    
    token_content = f"""[bold]Status:[/bold] [{status_color}]{status.title()}[/{status_color}]
[bold]Usage:[/bold] {usage_summary.get('messages_used', 0)}/{usage_summary.get('messages_limit', 0)} ({usage_summary.get('percentage_used', '0%')})
[bold]Plan:[/bold] {usage_summary.get('plan', 'unknown').title()}
[bold]Reset In:[/bold] {usage_summary.get('time_until_reset', 'unknown')}
[bold]Can Run Tasks:[/bold] [{can_run_color}]{can_run}[/{can_run_color}]
[bold]Warning Level:[/bold] [{warning_color}]{warning}[/{warning_color}]
[bold]Last Check:[/bold] {usage_summary.get('last_check', 'Never')}"""
    
    console.print(Panel(token_content, title="Claude Code Token Usage"))


def main():
    """Main entry point"""
    app()


if __name__ == "__main__":
    main()
