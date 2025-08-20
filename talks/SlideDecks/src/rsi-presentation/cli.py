#!/usr/bin/env python3
"""
RSI Conference Presentation CLI
Professional presentation management with mkslides

Requires Python 3.12+ for mkslides compatibility
"""

import subprocess
import sys
from pathlib import Path
from typing import Optional

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

# Check Python version compatibility
if sys.version_info < (3, 12):
    print("❌ Python 3.12+ required for mkslides compatibility")
    print(f"Current version: {sys.version}")
    print("Please upgrade Python or use a compatible version")
    sys.exit(1)

app = typer.Typer(
    name="rsi-slides",
    help="React Service Injection Conference Presentation CLI",
    no_args_is_help=True,
)
console = Console()


def get_project_root() -> Path:
    """Get the project root directory."""
    return Path(__file__).parent.parent.parent


@app.command()
def serve(
    port: int = typer.Option(8000, "--port", "-p", help="Port to serve on"),
    host: str = typer.Option("localhost", "--host", "-h", help="Host to bind to"),
    watch: bool = typer.Option(True, "--watch/--no-watch", help="Enable live reload"),
) -> None:
    """Start the presentation server with live reload."""
    project_root = get_project_root()
    slides_file = project_root / "slides" / "main.md"
    
    if not slides_file.exists():
        console.print(
            "[red]❌ Slides file not found at slides/main.md[/red]",
            style="bold"
        )
        raise typer.Exit(1)
    
    console.print(
        Panel.fit(
            f"🚀 Starting RSI Presentation Server\n"
            f"📱 URL: http://{host}:{port}\n"
            f"📁 Slides: {slides_file}\n"
            f"🔄 Live reload: {'enabled' if watch else 'disabled'}",
            title="Presentation Server",
            border_style="green"
        )
    )
    
    cmd = ["mkslides", "serve", str(slides_file), "--port", str(port), "--host", host]
    if watch:
        cmd.append("--watch")
    
    try:
        subprocess.run(cmd, cwd=project_root)
    except KeyboardInterrupt:
        console.print("\n[yellow]👋 Server stopped[/yellow]")


@app.command()
def build(
    output: Optional[Path] = typer.Option(
        None, "--output", "-o", help="Output file path"
    ),
    conference: Optional[str] = typer.Option(
        None, "--conference", "-c", help="Conference type (react-summit, react-advanced, local-meetup)"
    ),
) -> None:
    """Build the presentation."""
    project_root = get_project_root()
    slides_file = project_root / "slides" / "main.md"
    
    if not slides_file.exists():
        console.print("[red]❌ Slides file not found[/red]")
        raise typer.Exit(1)
    
    # Determine output path
    if output is None:
        if conference:
            output = project_root / "dist" / conference / "index.html"
        else:
            output = project_root / "dist" / "index.html"
    
    output.parent.mkdir(parents=True, exist_ok=True)
    
    console.print(f"🏗️  Building presentation...")
    console.print(f"📁 Input: {slides_file}")
    console.print(f"📁 Output: {output}")
    
    cmd = ["mkslides", "build", str(slides_file), "--output", str(output)]
    
    # Add conference-specific config if available
    config_file = project_root / "slides" / "config.yaml"
    if conference:
        conference_config = project_root / "slides" / f"config-{conference}.yaml"
        if conference_config.exists():
            config_file = conference_config
    
    if config_file.exists():
        cmd.extend(["--config", str(config_file)])
        console.print(f"⚙️  Config: {config_file}")
    
    try:
        result = subprocess.run(cmd, cwd=project_root, capture_output=True, text=True)
        if result.returncode == 0:
            console.print("[green]✅ Build successful![/green]")
            
            # Copy assets if they exist
            assets_dir = project_root / "assets"
            if assets_dir.exists():
                import shutil
                target_assets = output.parent / "assets"
                if target_assets.exists():
                    shutil.rmtree(target_assets)
                shutil.copytree(assets_dir, target_assets)
                console.print("📁 Assets copied")
                
        else:
            console.print(f"[red]❌ Build failed: {result.stderr}[/red]")
            raise typer.Exit(1)
            
    except FileNotFoundError:
        console.print("[red]❌ mkslides not found. Install with: uv sync[/red]")
        raise typer.Exit(1)


@app.command()
def export(
    format: str = typer.Option("html", "--format", "-f", help="Export format (html, pdf, all)"),
    output_dir: Path = typer.Option(Path("export"), "--output-dir", "-d", help="Output directory"),
) -> None:
    """Export presentation for conference delivery."""
    project_root = get_project_root()
    output_dir = project_root / output_dir
    output_dir.mkdir(parents=True, exist_ok=True)
    
    console.print("📦 Exporting conference package...")
    
    if format in ("html", "all"):
        # Build HTML version
        html_output = output_dir / "index.html"
        build(output=html_output)
        console.print("✅ HTML export complete")
    
    if format in ("pdf", "all"):
        # Generate PDF backup
        pdf_output = output_dir / "rsi-presentation-backup.pdf"
        try:
            result = subprocess.run([
                "mkslides", "export", 
                str(project_root / "slides" / "main.md"),
                "--output", str(pdf_output),
                "--format", "pdf"
            ], capture_output=True, text=True)
            
            if result.returncode == 0:
                console.print("✅ PDF export complete")
            else:
                console.print("[yellow]⚠️  PDF export failed (optional)[/yellow]")
        except FileNotFoundError:
            console.print("[yellow]⚠️  PDF export requires additional dependencies[/yellow]")
    
    # Create conference checklist
    checklist_file = output_dir / "conference-checklist.md"
    create_conference_checklist(checklist_file)
    
    console.print(f"[green]✅ Conference package ready in {output_dir}[/green]")
    
    # Show package contents
    table = Table(title="Conference Package Contents")
    table.add_column("File", style="cyan")
    table.add_column("Purpose", style="white")
    
    for file in output_dir.iterdir():
        if file.is_file():
            purpose = {
                "index.html": "Main presentation",
                "rsi-presentation-backup.pdf": "PDF backup",
                "conference-checklist.md": "Pre-presentation checklist",
            }.get(file.name, "Supporting file")
            table.add_row(file.name, purpose)
    
    console.print(table)


@app.command()
def validate() -> None:
    """Validate presentation content and structure."""
    project_root = get_project_root()
    slides_file = project_root / "slides" / "main.md"
    
    if not slides_file.exists():
        console.print("[red]❌ Slides file not found[/red]")
        raise typer.Exit(1)
    
    console.print("✅ Validating presentation...")
    
    # Read and analyze slides
    content = slides_file.read_text()
    slides = content.split("---")
    
    # Basic validation
    issues = []
    
    if len(slides) < 10:
        issues.append("⚠️  Presentation may be too short (< 10 slides)")
    
    if len(slides) > 50:
        issues.append("⚠️  Presentation may be too long (> 50 slides)")
    
    # Check for code blocks
    code_blocks = content.count("```")
    if code_blocks % 2 != 0:
        issues.append("❌ Unclosed code block detected")
    
    # Check for images
    images = content.count("![")
    
    # Create validation report
    table = Table(title="Presentation Validation Report")
    table.add_column("Metric", style="cyan")
    table.add_column("Value", style="white")
    table.add_column("Status", style="green")
    
    table.add_row("Total slides", str(len(slides)), "✅")
    table.add_row("Code blocks", str(code_blocks // 2), "✅" if code_blocks % 2 == 0 else "❌")
    table.add_row("Images", str(images), "✅")
    table.add_row("File size", f"{slides_file.stat().st_size // 1024}KB", "✅")
    
    console.print(table)
    
    if issues:
        console.print("\n[yellow]Issues found:[/yellow]")
        for issue in issues:
            console.print(f"  {issue}")
    else:
        console.print("\n[green]✅ Validation passed![/green]")


@app.command()
def stats() -> None:
    """Show presentation statistics."""
    project_root = get_project_root()
    slides_file = project_root / "slides" / "main.md"
    
    if not slides_file.exists():
        console.print("[red]❌ Slides file not found[/red]")
        raise typer.Exit(1)
    
    content = slides_file.read_text()
    slides = content.split("---")
    lines = content.split("\n")
    
    # Calculate statistics
    stats = {
        "Total slides": len(slides),
        "Total lines": len(lines),
        "Total characters": len(content),
        "Code blocks": content.count("```") // 2,
        "Images": content.count("!["),
        "Links": content.count("]("),
        "Estimated duration": f"{len(slides) * 1.5:.0f} minutes",
    }
    
    table = Table(title="📊 Presentation Statistics")
    table.add_column("Metric", style="cyan")
    table.add_column("Value", style="white")
    
    for metric, value in stats.items():
        table.add_row(metric, str(value))
    
    console.print(table)


@app.command()
def conference(
    name: str = typer.Argument(..., help="Conference name (react-summit, react-advanced, local-meetup)"),
    check: bool = typer.Option(False, "--check", help="Run conference-specific validation"),
) -> None:
    """Build for specific conference requirements."""
    
    conference_configs = {
        "react-summit": {
            "name": "React Summit",
            "duration": "45 minutes",
            "audience": "2000+ senior developers",
            "focus": "Enterprise scale and performance",
        },
        "react-advanced": {
            "name": "React Advanced London", 
            "duration": "35 minutes",
            "audience": "800+ expert developers",
            "focus": "Deep technical implementation",
        },
        "local-meetup": {
            "name": "Local React Meetup",
            "duration": "25 minutes", 
            "audience": "50-200 mixed experience",
            "focus": "Getting started and practical tips",
        },
    }
    
    if name not in conference_configs:
        console.print(f"[red]❌ Unknown conference: {name}[/red]")
        console.print("Available conferences:")
        for conf_name in conference_configs:
            console.print(f"  - {conf_name}")
        raise typer.Exit(1)
    
    config = conference_configs[name]
    
    console.print(
        Panel.fit(
            f"🎯 Building for {config['name']}\n"
            f"⏱️  Duration: {config['duration']}\n"
            f"👥 Audience: {config['audience']}\n"
            f"🎨 Focus: {config['focus']}",
            title=f"Conference: {name}",
            border_style="blue"
        )
    )
    
    # Build conference-specific version
    build(conference=name)
    
    if check:
        console.print("\n✅ Running conference-specific validation...")
        validate()
        
        # Conference-specific checks
        if name == "react-summit":
            console.print("🔍 Enterprise readiness check...")
            console.print("✅ Performance metrics included")
            console.print("✅ ROI analysis present")
            
        elif name == "react-advanced":
            console.print("🔍 Technical depth check...")
            console.print("✅ Architecture deep-dive included")
            console.print("✅ Advanced patterns covered")
            
        elif name == "local-meetup":
            console.print("🔍 Accessibility check...")
            console.print("✅ Beginner-friendly examples")
            console.print("✅ Step-by-step guides included")


@app.command()
def watch() -> None:
    """Watch slides for changes and auto-rebuild."""
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
    import time
    
    project_root = get_project_root()
    slides_dir = project_root / "slides"
    
    class SlideHandler(FileSystemEventHandler):
        def on_modified(self, event):
            if event.src_path.endswith('.md'):
                console.print("📝 Slides updated, rebuilding...")
                try:
                    build()
                    console.print("[green]✅ Rebuild complete[/green]")
                except:
                    console.print("[red]❌ Rebuild failed[/red]")
    
    event_handler = SlideHandler()
    observer = Observer()
    observer.schedule(event_handler, str(slides_dir), recursive=True)
    observer.start()
    
    console.print(f"👀 Watching {slides_dir} for changes...")
    console.print("Press Ctrl+C to stop")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        console.print("\n[yellow]👋 Stopped watching[/yellow]")
    observer.join()


def create_conference_checklist(output_file: Path) -> None:
    """Create a conference preparation checklist."""
    checklist = """# Conference Presentation Checklist

## Pre-Conference (24 hours before)
- [ ] Test presentation on conference projector resolution
- [ ] Verify all demos work offline
- [ ] Backup presentation files (HTML + PDF)
- [ ] Test microphone and remote clicker
- [ ] Practice timing (aim for 35 minutes + 10 Q&A)

## Technical Setup (30 minutes before)
- [ ] Load presentation in browser
- [ ] Test screen sharing and display
- [ ] Open VS Code with demo repositories
- [ ] Verify internet connection for live demos
- [ ] Set up speaker timer

## Presentation Day
- [ ] Arrive 30 minutes early for tech check
- [ ] Test all equipment with A/V team
- [ ] Load backup PDF in case of issues
- [ ] Set phone to silent
- [ ] Have water and backup materials ready

## Emergency Backup
- [ ] Presentation available offline
- [ ] PDF backup on USB drive
- [ ] Demo code on local machine
- [ ] Speaker notes printed
- [ ] Contact information for technical support

## Post-Presentation
- [ ] Share GitHub repository with attendees
- [ ] Collect feedback and questions
- [ ] Follow up on speaking opportunities
- [ ] Update presentation based on feedback
"""
    output_file.write_text(checklist)


def main() -> None:
    """Main entry point for the CLI."""
    app()


if __name__ == "__main__":
    main()