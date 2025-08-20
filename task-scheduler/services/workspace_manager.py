"""
Workspace Manager Service

Manages isolated workspaces for Claude Code task execution.
Handles workspace creation, cleanup, and file operations.
"""
import os
import shutil
import tempfile
from pathlib import Path
from typing import Optional, Dict, List
from dataclasses import dataclass
import json


@dataclass
class WorkspaceInfo:
    """Information about a task workspace"""
    task_id: str
    workspace_path: Path
    created_at: str
    is_temporary: bool
    base_template: Optional[str] = None


class WorkspaceManager:
    """Manages isolated workspaces for task execution"""

    def __init__(self, base_workspace_dir: str = "workspaces"):
        """
        Initialize workspace manager
        
        Args:
            base_workspace_dir: Base directory for all workspaces
        """
        self.base_workspace_dir = Path(base_workspace_dir)
        self.base_workspace_dir.mkdir(parents=True, exist_ok=True)
        
        # Keep track of active workspaces
        self.active_workspaces: Dict[str, WorkspaceInfo] = {}
        
        # Load existing workspace info
        self._load_workspace_registry()

    def _load_workspace_registry(self):
        """Load existing workspace registry"""
        registry_file = self.base_workspace_dir / ".workspace_registry.json"
        
        if registry_file.exists():
            try:
                with open(registry_file, 'r') as f:
                    data = json.load(f)
                
                for task_id, info_dict in data.items():
                    workspace_path = Path(info_dict['workspace_path'])
                    if workspace_path.exists():
                        self.active_workspaces[task_id] = WorkspaceInfo(
                            task_id=task_id,
                            workspace_path=workspace_path,
                            created_at=info_dict['created_at'],
                            is_temporary=info_dict.get('is_temporary', True),
                            base_template=info_dict.get('base_template')
                        )
            except Exception as e:
                print(f"Warning: Could not load workspace registry: {e}")

    def _save_workspace_registry(self):
        """Save workspace registry to disk"""
        registry_file = self.base_workspace_dir / ".workspace_registry.json"
        
        data = {}
        for task_id, workspace_info in self.active_workspaces.items():
            data[task_id] = {
                'workspace_path': str(workspace_info.workspace_path),
                'created_at': workspace_info.created_at,
                'is_temporary': workspace_info.is_temporary,
                'base_template': workspace_info.base_template
            }
        
        try:
            with open(registry_file, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"Warning: Could not save workspace registry: {e}")

    def create_workspace(self, task_id: str, template_name: Optional[str] = None,
                        temporary: bool = True) -> Path:
        """
        Create an isolated workspace for a task
        
        Args:
            task_id: Unique task identifier
            template_name: Optional template to base workspace on
            temporary: If True, workspace will be cleaned up after task completion
            
        Returns:
            Path to the created workspace
        """
        from datetime import datetime, timezone
        
        if task_id in self.active_workspaces:
            return self.active_workspaces[task_id].workspace_path
        
        if temporary:
            # Create temporary directory
            temp_dir = tempfile.mkdtemp(prefix=f"task_{task_id}_", dir=self.base_workspace_dir)
            workspace_path = Path(temp_dir)
        else:
            # Create persistent directory
            workspace_path = self.base_workspace_dir / task_id
            workspace_path.mkdir(parents=True, exist_ok=True)
        
        # Apply template if specified
        if template_name:
            self._apply_workspace_template(workspace_path, template_name)
        else:
            # Create basic workspace structure
            self._create_basic_workspace(workspace_path)
        
        # Register workspace
        workspace_info = WorkspaceInfo(
            task_id=task_id,
            workspace_path=workspace_path,
            created_at=datetime.now(timezone.utc).isoformat(),
            is_temporary=temporary,
            base_template=template_name
        )
        
        self.active_workspaces[task_id] = workspace_info
        self._save_workspace_registry()
        
        print(f"Created workspace for task {task_id}: {workspace_path}")
        return workspace_path

    def _create_basic_workspace(self, workspace_path: Path):
        """Create basic workspace structure"""
        # Create basic directories
        (workspace_path / "src").mkdir(exist_ok=True)
        (workspace_path / "docs").mkdir(exist_ok=True)
        (workspace_path / ".claude").mkdir(exist_ok=True)
        
        # Create basic README
        readme_content = f"""# Task Workspace

This workspace was created for automated task execution using Claude Code.

Created: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Structure
- `src/` - Source code files
- `docs/` - Documentation
- `.claude/` - Claude Code configuration and prompts

## Usage
This workspace is isolated and can be safely modified during task execution.
"""
        
        readme_file = workspace_path / "README.md"
        readme_file.write_text(readme_content)

    def _apply_workspace_template(self, workspace_path: Path, template_name: str):
        """Apply a workspace template"""
        template_dir = Path("templates") / "workspaces" / template_name
        
        if template_dir.exists():
            try:
                # Copy template contents
                for item in template_dir.iterdir():
                    if item.is_file():
                        shutil.copy2(item, workspace_path)
                    elif item.is_dir():
                        shutil.copytree(item, workspace_path / item.name, dirs_exist_ok=True)
                
                print(f"Applied template '{template_name}' to workspace")
            except Exception as e:
                print(f"Warning: Could not apply template '{template_name}': {e}")
                self._create_basic_workspace(workspace_path)
        else:
            print(f"Warning: Template '{template_name}' not found, creating basic workspace")
            self._create_basic_workspace(workspace_path)

    def get_workspace(self, task_id: str) -> Optional[Path]:
        """Get the workspace path for a task"""
        workspace_info = self.active_workspaces.get(task_id)
        
        if workspace_info and workspace_info.workspace_path.exists():
            return workspace_info.workspace_path
        
        return None

    def cleanup_workspace(self, task_id: str, force: bool = False) -> bool:
        """
        Clean up a task workspace
        
        Args:
            task_id: Task identifier
            force: If True, clean up even non-temporary workspaces
            
        Returns:
            True if cleanup successful, False otherwise
        """
        workspace_info = self.active_workspaces.get(task_id)
        
        if not workspace_info:
            return True  # Already cleaned up
        
        # Only cleanup temporary workspaces unless forced
        if not workspace_info.is_temporary and not force:
            print(f"Skipping cleanup of persistent workspace for task {task_id}")
            return False
        
        try:
            if workspace_info.workspace_path.exists():
                shutil.rmtree(workspace_info.workspace_path)
                print(f"Cleaned up workspace for task {task_id}")
            
            # Remove from registry
            del self.active_workspaces[task_id]
            self._save_workspace_registry()
            
            return True
        except Exception as e:
            print(f"Error cleaning up workspace for task {task_id}: {e}")
            return False

    def cleanup_all_temporary_workspaces(self) -> int:
        """
        Clean up all temporary workspaces
        
        Returns:
            Number of workspaces cleaned up
        """
        cleaned_count = 0
        task_ids_to_cleanup = []
        
        for task_id, workspace_info in self.active_workspaces.items():
            if workspace_info.is_temporary:
                task_ids_to_cleanup.append(task_id)
        
        for task_id in task_ids_to_cleanup:
            if self.cleanup_workspace(task_id):
                cleaned_count += 1
        
        return cleaned_count

    def list_workspaces(self) -> List[WorkspaceInfo]:
        """List all active workspaces"""
        return list(self.active_workspaces.values())

    def get_workspace_files(self, task_id: str) -> List[Path]:
        """Get list of files in a task workspace"""
        workspace_path = self.get_workspace(task_id)
        
        if not workspace_path:
            return []
        
        files = []
        try:
            for item in workspace_path.rglob("*"):
                if item.is_file() and not item.name.startswith('.'):
                    files.append(item.relative_to(workspace_path))
        except Exception as e:
            print(f"Error listing workspace files for task {task_id}: {e}")
        
        return files

    def create_claude_prompt_file(self, task_id: str, prompt_content: str) -> Path:
        """
        Create a Claude prompt file in the task workspace
        
        Args:
            task_id: Task identifier
            prompt_content: Content for the prompt file
            
        Returns:
            Path to the created prompt file
        """
        workspace_path = self.get_workspace(task_id)
        
        if not workspace_path:
            raise ValueError(f"No workspace found for task {task_id}")
        
        claude_dir = workspace_path / ".claude"
        claude_dir.mkdir(exist_ok=True)
        
        prompt_file = claude_dir / "prompt.md"
        prompt_file.write_text(prompt_content)
        
        return prompt_file

    def backup_workspace(self, task_id: str, backup_dir: Optional[Path] = None) -> Optional[Path]:
        """
        Create a backup of a workspace before cleanup
        
        Args:
            task_id: Task identifier
            backup_dir: Directory to store backup (defaults to workspaces/backups)
            
        Returns:
            Path to backup directory or None if failed
        """
        workspace_path = self.get_workspace(task_id)
        
        if not workspace_path:
            return None
        
        if backup_dir is None:
            backup_dir = self.base_workspace_dir / "backups"
        
        backup_dir.mkdir(parents=True, exist_ok=True)
        
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = backup_dir / f"{task_id}_{timestamp}"
        
        try:
            shutil.copytree(workspace_path, backup_path)
            print(f"Created backup of workspace for task {task_id}: {backup_path}")
            return backup_path
        except Exception as e:
            print(f"Error creating backup for task {task_id}: {e}")
            return None

    def get_workspace_size(self, task_id: str) -> int:
        """
        Get the size of a workspace in bytes
        
        Args:
            task_id: Task identifier
            
        Returns:
            Size in bytes, 0 if workspace doesn't exist
        """
        workspace_path = self.get_workspace(task_id)
        
        if not workspace_path:
            return 0
        
        total_size = 0
        try:
            for item in workspace_path.rglob("*"):
                if item.is_file():
                    total_size += item.stat().st_size
        except Exception as e:
            print(f"Error calculating workspace size for task {task_id}: {e}")
        
        return total_size