"""
YAML Task Manager Service

Handles reading, writing, and managing tasks in the YAML configuration file.
"""
import yaml
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict


@dataclass
class TaskConfig:
    """Task configuration data structure"""
    id: str
    title: str
    description: str
    prompt_template: str = "default"
    status: str = "pending"  # pending, running, completed, failed, paused
    created_at: str = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    attempts: int = 0
    max_attempts: int = 3
    last_error: Optional[str] = None
    session_id: Optional[str] = None  # Claude session ID for resume
    workspace_path: Optional[str] = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now(timezone.utc).isoformat()


@dataclass
class TasksFileMetadata:
    """Metadata for tasks file"""
    version: str = "1.0"
    last_updated: str = None

    def __post_init__(self):
        if self.last_updated is None:
            self.last_updated = datetime.now(timezone.utc).isoformat()


class YamlTaskManager:
    """Manages tasks in YAML configuration file"""

    def __init__(self, tasks_file_path: str = "config/tasks.yaml"):
        self.tasks_file_path = Path(tasks_file_path)
        self.tasks_file_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Initialize file if it doesn't exist
        if not self.tasks_file_path.exists():
            self._initialize_tasks_file()

    def _initialize_tasks_file(self):
        """Initialize empty tasks file with metadata"""
        initial_data = {
            "meta": asdict(TasksFileMetadata()),
            "tasks": []
        }
        self._save_tasks_data(initial_data)

    def _load_tasks_data(self) -> Dict[str, Any]:
        """Load raw tasks data from YAML file"""
        try:
            with open(self.tasks_file_path, 'r') as f:
                data = yaml.safe_load(f)
                if data is None:
                    data = {"meta": asdict(TasksFileMetadata()), "tasks": []}
                return data
        except (FileNotFoundError, yaml.YAMLError) as e:
            print(f"Warning: Could not load tasks file: {e}")
            return {"meta": asdict(TasksFileMetadata()), "tasks": []}

    def _save_tasks_data(self, data: Dict[str, Any]):
        """Save tasks data to YAML file"""
        # Update metadata timestamp
        data["meta"]["last_updated"] = datetime.now(timezone.utc).isoformat()
        
        try:
            with open(self.tasks_file_path, 'w') as f:
                yaml.dump(data, f, default_flow_style=False, sort_keys=False, indent=2)
        except Exception as e:
            print(f"Error saving tasks file: {e}")
            raise

    def load_tasks(self) -> List[TaskConfig]:
        """Load all tasks as TaskConfig objects"""
        data = self._load_tasks_data()
        tasks = []
        
        for task_dict in data.get("tasks", []):
            # Convert dict to TaskConfig
            task = TaskConfig(**task_dict)
            tasks.append(task)
        
        return tasks

    def save_tasks(self, tasks: List[TaskConfig]):
        """Save list of TaskConfig objects to YAML file"""
        data = self._load_tasks_data()
        
        # Convert TaskConfig objects to dicts
        data["tasks"] = [asdict(task) for task in tasks]
        
        self._save_tasks_data(data)

    def add_task(self, title: str, description: str, prompt_template: str = "default") -> TaskConfig:
        """Add a new task and return the TaskConfig"""
        tasks = self.load_tasks()
        
        # Generate unique task ID
        task_id = f"task-{len(tasks) + 1:03d}"
        while any(t.id == task_id for t in tasks):
            task_id = f"task-{len(tasks) + 1 + len([t for t in tasks if t.id.startswith('task-')]):03d}"
        
        new_task = TaskConfig(
            id=task_id,
            title=title,
            description=description,
            prompt_template=prompt_template
        )
        
        tasks.append(new_task)
        self.save_tasks(tasks)
        
        return new_task

    def get_task(self, task_id: str) -> Optional[TaskConfig]:
        """Get a specific task by ID"""
        tasks = self.load_tasks()
        return next((task for task in tasks if task.id == task_id), None)

    def update_task(self, task_id: str, **updates) -> bool:
        """Update a task with new values"""
        tasks = self.load_tasks()
        
        for task in tasks:
            if task.id == task_id:
                # Update fields
                for key, value in updates.items():
                    if hasattr(task, key):
                        setattr(task, key, value)
                
                self.save_tasks(tasks)
                return True
        
        return False

    def delete_task(self, task_id: str) -> bool:
        """Delete a task by ID"""
        tasks = self.load_tasks()
        original_count = len(tasks)
        
        tasks = [task for task in tasks if task.id != task_id]
        
        if len(tasks) < original_count:
            self.save_tasks(tasks)
            return True
        
        return False

    def get_tasks_by_status(self, status: str) -> List[TaskConfig]:
        """Get all tasks with a specific status"""
        tasks = self.load_tasks()
        return [task for task in tasks if task.status == status]

    def get_pending_tasks(self) -> List[TaskConfig]:
        """Get all pending tasks"""
        return self.get_tasks_by_status("pending")

    def get_running_tasks(self) -> List[TaskConfig]:
        """Get all running tasks"""
        return self.get_tasks_by_status("running")

    def get_failed_tasks(self) -> List[TaskConfig]:
        """Get all failed tasks"""
        return self.get_tasks_by_status("failed")

    def mark_task_running(self, task_id: str, session_id: Optional[str] = None) -> bool:
        """Mark a task as running"""
        updates = {
            "status": "running",
            "started_at": datetime.now(timezone.utc).isoformat(),
            "attempts": self.get_task(task_id).attempts + 1 if self.get_task(task_id) else 1
        }
        
        if session_id:
            updates["session_id"] = session_id
            
        return self.update_task(task_id, **updates)

    def mark_task_completed(self, task_id: str) -> bool:
        """Mark a task as completed"""
        return self.update_task(
            task_id,
            status="completed",
            completed_at=datetime.now(timezone.utc).isoformat(),
            last_error=None
        )

    def mark_task_failed(self, task_id: str, error: str) -> bool:
        """Mark a task as failed with error message"""
        return self.update_task(
            task_id,
            status="failed",
            completed_at=datetime.now(timezone.utc).isoformat(),
            last_error=error
        )

    def mark_task_paused(self, task_id: str, reason: str = "Token limit reached") -> bool:
        """Mark a task as paused (e.g., due to token limits)"""
        return self.update_task(
            task_id,
            status="paused",
            last_error=reason
        )

    def reset_task(self, task_id: str) -> bool:
        """Reset a task back to pending status"""
        return self.update_task(
            task_id,
            status="pending",
            started_at=None,
            completed_at=None,
            last_error=None,
            session_id=None
        )

    def get_task_statistics(self) -> Dict[str, int]:
        """Get statistics about tasks"""
        tasks = self.load_tasks()
        
        stats = {
            "total": len(tasks),
            "pending": len([t for t in tasks if t.status == "pending"]),
            "running": len([t for t in tasks if t.status == "running"]),
            "completed": len([t for t in tasks if t.status == "completed"]),
            "failed": len([t for t in tasks if t.status == "failed"]),
            "paused": len([t for t in tasks if t.status == "paused"])
        }
        
        return stats