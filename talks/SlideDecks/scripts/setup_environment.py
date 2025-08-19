#!/usr/bin/env python3
"""
Environment setup script for RSI Conference Presentation
Handles Poetry conflicts and ensures clean virtual environment
"""

import os
import shutil
import subprocess
import sys
from pathlib import Path


def run_command(cmd: list[str], check: bool = True) -> subprocess.CompletedProcess:
    """Run a command and return the result."""
    print(f"🔧 Running: {' '.join(cmd)}")
    return subprocess.run(cmd, check=check, capture_output=True, text=True)


def check_python_version() -> None:
    """Check if Python 3.12+ is available."""
    print("🐍 Checking Python version...")
    if sys.version_info < (3, 12):
        print(f"❌ Python 3.12+ required, found {sys.version}")
        print("Please install Python 3.12+ using:")
        print("  - pyenv: pyenv install 3.12.7 && pyenv local 3.12.7")
        print("  - conda: conda create -n rsi python=3.12")
        print("  - System package manager or python.org")
        sys.exit(1)
    print(f"✅ Python {sys.version.split()[0]} is compatible")


def deactivate_poetry() -> None:
    """Deactivate Poetry environment if active."""
    poetry_env = os.environ.get("VIRTUAL_ENV")
    if poetry_env and "poetry" in poetry_env.lower():
        print("🎭 Detected Poetry environment, deactivating...")
        
        # Remove Poetry environment variables
        for var in ["VIRTUAL_ENV", "POETRY_ACTIVE", "_OLD_VIRTUAL_PATH"]:
            if var in os.environ:
                del os.environ[var]
                print(f"   Removed {var}")
        
        # Try to run poetry deactivate
        try:
            run_command(["poetry", "deactivate"], check=False)
            print("✅ Poetry environment deactivated")
        except FileNotFoundError:
            print("ℹ️  Poetry not found, continuing...")


def clean_existing_venv() -> None:
    """Remove existing virtual environment."""
    venv_path = Path(".venv")
    if venv_path.exists():
        print("🧹 Removing existing virtual environment...")
        shutil.rmtree(venv_path)
        print("✅ Existing .venv removed")


def check_uv_installation() -> None:
    """Check if uv is installed and install if needed."""
    try:
        result = run_command(["uv", "--version"])
        print(f"✅ uv is installed: {result.stdout.strip()}")
    except FileNotFoundError:
        print("❌ uv not found, installing...")
        try:
            # Try to install uv using pip
            run_command([sys.executable, "-m", "pip", "install", "uv"])
            print("✅ uv installed via pip")
        except subprocess.CalledProcessError:
            print("❌ Failed to install uv via pip")
            print("Please install uv manually:")
            print("  curl -LsSf https://astral.sh/uv/install.sh | sh")
            sys.exit(1)


def create_virtual_environment() -> None:
    """Create a fresh virtual environment with uv."""
    print("🏗️  Creating new virtual environment...")
    
    # Create venv with specific Python version
    run_command(["uv", "venv", "--python", "3.12"])
    print("✅ Virtual environment created")


def install_dependencies() -> None:
    """Install project dependencies."""
    print("📦 Installing dependencies...")
    run_command(["uv", "sync"])
    print("✅ Dependencies installed")


def verify_installation() -> None:
    """Verify that everything is installed correctly."""
    print("✅ Verifying installation...")
    
    try:
        # Check if mkslides is available
        result = run_command(["uv", "run", "mkslides", "--version"])
        print(f"✅ mkslides: {result.stdout.strip()}")
        
        # Check if our CLI is available
        result = run_command(["uv", "run", "rsi-slides", "--help"], check=False)
        if result.returncode == 0:
            print("✅ rsi-slides CLI available")
        else:
            print("⚠️  rsi-slides CLI may need development install")
            
    except subprocess.CalledProcessError as e:
        print(f"❌ Verification failed: {e}")
        print("Try running 'make install' manually")


def main() -> None:
    """Main setup function."""
    print("🚀 Setting up RSI Conference Presentation environment...")
    print("=" * 60)
    
    # Step 1: Check Python version
    check_python_version()
    
    # Step 2: Handle Poetry conflicts
    deactivate_poetry()
    
    # Step 3: Clean existing environment
    clean_existing_venv()
    
    # Step 4: Check uv installation
    check_uv_installation()
    
    # Step 5: Create fresh virtual environment
    create_virtual_environment()
    
    # Step 6: Install dependencies
    install_dependencies()
    
    # Step 7: Verify installation
    verify_installation()
    
    print("\n" + "=" * 60)
    print("🎉 Setup completed successfully!")
    print("\nNext steps:")
    print("  make serve    # Start development server")
    print("  make build    # Build presentation")
    print("  make help     # See all available commands")


if __name__ == "__main__":
    main()