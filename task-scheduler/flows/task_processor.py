"""
Main Prefect Task Processor Flow

Orchestrates the execution of Claude Code tasks with intelligent scheduling,
token monitoring, and error recovery.
"""
from prefect import flow, task, get_run_logger
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Tuple
from pathlib import Path
import time

# Import our services
import sys
sys.path.append('.')

from services.yaml_manager import YamlTaskManager, TaskConfig
from services.token_monitor import TokenMonitor
from services.workspace_manager import WorkspaceManager
from flows.claude_executor import ClaudeCodeExecutor, ClaudeExecutionResult


@flow(name="claude-task-processor", retries=1)
def process_tasks_flow(max_tasks: int = 5, check_tokens: bool = True,
                      task_timeout: int = 300) -> Dict:
    """
    Main flow to process pending Claude Code tasks
    
    Args:
        max_tasks: Maximum number of tasks to process in this run
        check_tokens: Whether to check token limits before processing
        task_timeout: Timeout for individual task execution in seconds
        
    Returns:
        Dictionary with processing results
    """
    logger = get_run_logger()
    
    # Initialize managers
    task_manager = YamlTaskManager()
    token_monitor = TokenMonitor()
    workspace_manager = WorkspaceManager()
    
    logger.info(f"Starting task processing flow - max tasks: {max_tasks}")
    
    # Check Claude Code availability
    availability_check = check_claude_availability()
    if not availability_check["available"]:
        logger.error(f"Claude Code not available: {availability_check['message']}")
        return {
            "success": False,
            "error": "Claude Code not available",
            "processed": 0,
            "results": []
        }
    
    # Check token limits if requested
    if check_tokens:
        token_check = check_token_limits(token_monitor)
        if not token_check["can_proceed"]:
            logger.warning(f"Token limit check failed: {token_check['reason']}")
            
            # If tokens are critically low, wait for reset
            if token_check.get("wait_for_reset", False):
                wait_result = wait_for_token_reset(token_monitor)
                if not wait_result["success"]:
                    return {
                        "success": False,
                        "error": "Token limits reached and reset wait failed",
                        "processed": 0,
                        "results": []
                    }
    
    # Get pending tasks
    pending_tasks = get_pending_tasks(task_manager, max_tasks)
    if not pending_tasks:
        logger.info("No pending tasks found")
        return {
            "success": True,
            "processed": 0,
            "results": [],
            "message": "No pending tasks"
        }
    
    logger.info(f"Found {len(pending_tasks)} pending tasks")
    
    # Process tasks
    results = []
    processed_count = 0
    
    for task_config in pending_tasks:
        logger.info(f"Processing task: {task_config.id} - {task_config.title}")
        
        try:
            # Process single task
            result = process_single_task(
                task_config, 
                task_manager, 
                token_monitor, 
                workspace_manager,
                task_timeout
            )
            
            results.append(result)
            processed_count += 1
            
            # Check if we should continue based on result
            if not result.get("continue_processing", True):
                logger.info("Stopping processing due to task result")
                break
                
            # Brief pause between tasks
            time.sleep(2)
            
        except Exception as e:
            logger.error(f"Unexpected error processing task {task_config.id}: {str(e)}")
            
            # Mark task as failed
            task_manager.mark_task_failed(task_config.id, f"Unexpected error: {str(e)}")
            
            results.append({
                "task_id": task_config.id,
                "success": False,
                "error": str(e),
                "continue_processing": True
            })
    
    # Cleanup temporary workspaces
    cleanup_count = cleanup_temporary_workspaces(workspace_manager)
    logger.info(f"Cleaned up {cleanup_count} temporary workspaces")
    
    return {
        "success": True,
        "processed": processed_count,
        "results": results,
        "cleanup_count": cleanup_count,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@task(retries=2, retry_delay_seconds=60)
def process_single_task(task_config: TaskConfig, task_manager: YamlTaskManager,
                       token_monitor: TokenMonitor, workspace_manager: WorkspaceManager,
                       timeout: int) -> Dict:
    """
    Process a single task with error handling and recovery
    
    Args:
        task_config: Task configuration
        task_manager: YAML task manager
        token_monitor: Token monitoring service
        workspace_manager: Workspace manager
        timeout: Task timeout in seconds
        
    Returns:
        Task processing result
    """
    logger = get_run_logger()
    
    try:
        # Mark task as running
        task_manager.mark_task_running(task_config.id)
        logger.info(f"Marked task {task_config.id} as running")
        
        # Check if we have enough tokens before proceeding
        can_run, reason = token_monitor.can_run_tasks()
        if not can_run:
            logger.warning(f"Cannot run task {task_config.id}: {reason}")
            task_manager.mark_task_paused(task_config.id, reason)
            
            return {
                "task_id": task_config.id,
                "success": False,
                "error": reason,
                "status": "paused",
                "continue_processing": False  # Stop processing more tasks
            }
        
        # Create workspace
        workspace_path = workspace_manager.create_workspace(
            task_config.id, 
            template_name=None,  # Could be extended to support templates
            temporary=True
        )
        
        # Update task with workspace path
        task_manager.update_task(task_config.id, workspace_path=str(workspace_path))
        
        # Generate prompt from template
        executor = ClaudeCodeExecutor()
        prompt = executor.generate_prompt_from_template(
            task_config.prompt_template,
            title=task_config.title,
            description=task_config.description
        )
        
        # Execute Claude Code
        logger.info(f"Executing Claude Code for task {task_config.id}")
        execution_result = executor.execute_task(
            workspace_path=workspace_path,
            prompt=prompt,
            auto_accept=True,
            session_id=task_config.session_id,
            timeout=timeout
        )
        
        # Process execution result
        if execution_result.success:
            # Task completed successfully
            task_manager.mark_task_completed(task_config.id)
            logger.info(f"Task {task_config.id} completed successfully")
            
            return {
                "task_id": task_config.id,
                "success": True,
                "execution_time": execution_result.execution_time,
                "changed_files": execution_result.changed_files,
                "workspace_path": execution_result.workspace_path,
                "status": "completed",
                "continue_processing": True
            }
            
        elif execution_result.token_limit_hit:
            # Token limit reached during execution
            logger.warning(f"Token limit hit during task {task_config.id}")
            
            # Save session ID for resumption
            if execution_result.session_id:
                task_manager.update_task(task_config.id, session_id=execution_result.session_id)
            
            task_manager.mark_task_paused(task_config.id, "Token limit reached during execution")
            
            return {
                "task_id": task_config.id,
                "success": False,
                "error": "Token limit reached",
                "status": "paused",
                "session_id": execution_result.session_id,
                "continue_processing": False  # Stop processing more tasks
            }
            
        else:
            # Task failed
            error_msg = execution_result.error_message or "Claude Code execution failed"
            
            # Check if we should retry or fail permanently
            if task_config.attempts >= task_config.max_attempts:
                task_manager.mark_task_failed(task_config.id, error_msg)
                status = "failed"
            else:
                # Reset to pending for retry
                task_manager.reset_task(task_config.id)
                status = "pending"
            
            logger.error(f"Task {task_config.id} execution failed: {error_msg}")
            
            return {
                "task_id": task_config.id,
                "success": False,
                "error": error_msg,
                "status": status,
                "execution_time": execution_result.execution_time,
                "continue_processing": True
            }
    
    except Exception as e:
        logger.error(f"Unexpected error in task {task_config.id}: {str(e)}")
        task_manager.mark_task_failed(task_config.id, f"Unexpected error: {str(e)}")
        
        return {
            "task_id": task_config.id,
            "success": False,
            "error": str(e),
            "status": "failed",
            "continue_processing": True
        }


@task
def check_claude_availability() -> Dict:
    """Check if Claude Code is available and working"""
    executor = ClaudeCodeExecutor()
    is_available, message = executor.check_claude_availability()
    
    return {
        "available": is_available,
        "message": message
    }


@task
def check_token_limits(token_monitor: TokenMonitor) -> Dict:
    """Check Claude Code token limits"""
    logger = get_run_logger()
    
    can_run, reason = token_monitor.can_run_tasks()
    usage_summary = token_monitor.get_usage_summary()
    
    logger.info(f"Token status: {usage_summary}")
    
    return {
        "can_proceed": can_run,
        "reason": reason,
        "usage_summary": usage_summary,
        "wait_for_reset": not can_run and usage_summary.get("status") == "critical"
    }


@task
def wait_for_token_reset(token_monitor: TokenMonitor) -> Dict:
    """Wait for token limits to reset"""
    logger = get_run_logger()
    
    logger.info("Waiting for token limits to reset...")
    success = token_monitor.wait_for_token_reset()
    
    return {
        "success": success,
        "message": "Token reset successful" if success else "Token reset wait failed/timed out"
    }


@task
def get_pending_tasks(task_manager: YamlTaskManager, max_tasks: int) -> List[TaskConfig]:
    """Get pending tasks up to the specified limit"""
    pending_tasks = task_manager.get_pending_tasks()
    
    # Also include paused tasks that can be resumed
    paused_tasks = task_manager.get_tasks_by_status("paused")
    resumable_tasks = [task for task in paused_tasks if task.session_id]
    
    # Combine and limit
    all_tasks = pending_tasks + resumable_tasks
    return all_tasks[:max_tasks]


@task
def cleanup_temporary_workspaces(workspace_manager: WorkspaceManager) -> int:
    """Clean up temporary workspaces"""
    return workspace_manager.cleanup_all_temporary_workspaces()


# Monitoring and status flows
@flow(name="task-status-check")
def get_task_status_flow() -> Dict:
    """Get current task status and statistics"""
    task_manager = YamlTaskManager()
    token_monitor = TokenMonitor()
    workspace_manager = WorkspaceManager()
    
    stats = task_manager.get_task_statistics()
    usage_summary = token_monitor.get_usage_summary()
    workspaces = workspace_manager.list_workspaces()
    
    return {
        "task_statistics": stats,
        "token_usage": usage_summary,
        "active_workspaces": len(workspaces),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@flow(name="task-cleanup")
def cleanup_flow(cleanup_failed: bool = False, cleanup_completed: bool = False) -> Dict:
    """Clean up tasks and workspaces"""
    task_manager = YamlTaskManager()
    workspace_manager = WorkspaceManager()
    
    cleaned_workspaces = workspace_manager.cleanup_all_temporary_workspaces()
    
    # Optionally reset failed/completed tasks
    reset_count = 0
    if cleanup_failed:
        failed_tasks = task_manager.get_failed_tasks()
        for task in failed_tasks:
            task_manager.reset_task(task.id)
            reset_count += 1
    
    if cleanup_completed:
        completed_tasks = task_manager.get_tasks_by_status("completed")
        for task in completed_tasks:
            task_manager.delete_task(task.id)
    
    return {
        "cleaned_workspaces": cleaned_workspaces,
        "reset_tasks": reset_count,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }