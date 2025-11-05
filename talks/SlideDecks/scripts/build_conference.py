#!/usr/bin/env python3
"""
Conference-specific build script for RSI presentation
"""

import argparse
import shutil
import subprocess
import sys
from pathlib import Path


def run_command(cmd: list[str], check: bool = True) -> subprocess.CompletedProcess:
    """Run a command and return the result."""
    print(f"🔧 Running: {' '.join(cmd)}")
    return subprocess.run(cmd, check=check, capture_output=True, text=True)


def build_presentation(conference: str) -> None:
    """Build presentation for specific conference."""
    
    project_root = Path(__file__).parent.parent
    slides_file = project_root / "slides" / "main.md"
    
    if not slides_file.exists():
        print("❌ Slides file not found at slides/main.md")
        sys.exit(1)
    
    # Conference configurations
    conferences = {
        "react-summit": {
            "name": "React Summit",
            "config": "slides/config-react-summit.yaml",
            "output_dir": "dist/react-summit",
            "description": "Premium international conference - enterprise focus"
        },
        "react-advanced": {
            "name": "React Advanced London",
            "config": "slides/config-react-advanced.yaml", 
            "output_dir": "dist/react-advanced",
            "description": "Technical deep-dive conference"
        },
        "local-meetup": {
            "name": "Local React Meetup",
            "config": "slides/config-local-meetup.yaml",
            "output_dir": "dist/local-meetup", 
            "description": "Accessible local presentation"
        }
    }
    
    if conference not in conferences:
        print(f"❌ Unknown conference: {conference}")
        print("Available conferences:")
        for conf_name, conf_info in conferences.items():
            print(f"  - {conf_name}: {conf_info['description']}")
        sys.exit(1)
    
    conf = conferences[conference]
    print(f"🎯 Building for {conf['name']}")
    print(f"📝 Description: {conf['description']}")
    
    # Create output directory
    output_dir = project_root / conf["output_dir"]
    output_dir.mkdir(parents=True, exist_ok=True)
    output_file = output_dir / "index.html"
    
    # Build command
    cmd = ["mkslides", "build", str(slides_file), "--output", str(output_file)]
    
    # Add config if it exists
    config_file = project_root / conf["config"]
    if config_file.exists():
        cmd.extend(["--config", str(config_file)])
        print(f"⚙️  Using config: {config_file}")
    else:
        print(f"⚠️  Config not found: {config_file}, using default")
    
    try:
        result = run_command(cmd)
        print("✅ Build successful!")
        
        # Copy assets if they exist
        assets_dir = project_root / "assets"
        if assets_dir.exists():
            target_assets = output_dir / "assets"
            if target_assets.exists():
                shutil.rmtree(target_assets)
            shutil.copytree(assets_dir, target_assets)
            print("📁 Assets copied")
        
        print(f"📦 Conference build ready: {output_dir}")
        print(f"🌐 Open: {output_file}")
        
        # Show build summary
        print("\n📋 Build Summary:")
        print(f"  Conference: {conf['name']}")
        print(f"  Output: {output_file}")
        print(f"  Size: {output_file.stat().st_size // 1024}KB")
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Build failed: {e}")
        if e.stdout:
            print(f"stdout: {e.stdout}")
        if e.stderr:
            print(f"stderr: {e.stderr}")
        sys.exit(1)


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="Build conference-specific presentation")
    parser.add_argument(
        "--conference", 
        required=True,
        choices=["react-summit", "react-advanced", "local-meetup"],
        help="Conference type to build for"
    )
    
    args = parser.parse_args()
    build_presentation(args.conference)


if __name__ == "__main__":
    main()