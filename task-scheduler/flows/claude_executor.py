"""
Claude Code Executor

Handles execution of Claude Code with automatic acceptance and resume capabilities.
"""
import subprocess
import time
import re
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass


@dataclass
class ClaudeExecutionResult:
    """Result of Claude Code execution"""
    success: bool
    stdout: str
    stderr: str
    return_code: int
    execution_time: float
    changed_files: List[str]
    workspace_path: str
    session_id: Optional[str] = None
    error_message: Optional[str] = None
    token_limit_hit: bool = False


class ClaudeCodeExecutor:
    """Executes Claude Code commands with automation features"""

    def __init__(self):
        """Initialize Claude Code executor"""
        self.default_timeout = 300  # 5 minutes
        self.session_timeout = 1800  # 30 minutes for complex tasks

    def execute_task(self, workspace_path: Path, prompt: str, 
                    auto_accept: bool = True, session_id: Optional[str] = None,
                    timeout: Optional[int] = None) -> ClaudeExecutionResult:
        """
        Execute a Claude Code task in the given workspace
        
        Args:
            workspace_path: Path to workspace directory
            prompt: Task prompt/description
            auto_accept: Whether to automatically accept all prompts
            session_id: Existing session ID to resume
            timeout: Command timeout in seconds
            
        Returns:
            ClaudeExecutionResult object
        """
        start_time = time.time()
        
        if timeout is None:
            timeout = self.default_timeout
        
        print(f"Executing Claude Code in workspace: {workspace_path}")
        
        # Get initial file list for change detection
        initial_files = self._get_workspace_files(workspace_path)
        
        try:
            # Prepare Claude prompt file
            self._create_prompt_file(workspace_path, prompt)
            
            if session_id:
                # Resume existing session
                result = self._resume_claude_session(
                    workspace_path, session_id, prompt, auto_accept, timeout
                )
            else:
                # Start new session
                result = self._start_new_claude_session(
                    workspace_path, prompt, auto_accept, timeout
                )
            
            # Calculate execution time
            execution_time = time.time() - start_time
            
            # Detect changed files
            final_files = self._get_workspace_files(workspace_path)
            changed_files = self._detect_file_changes(initial_files, final_files, workspace_path)
            
            # Check if token limit was hit
            token_limit_hit = self._check_token_limit_in_output(result.stdout, result.stderr)
            
            return ClaudeExecutionResult(
                success=result.return_code == 0 and not token_limit_hit,
                stdout=result.stdout,
                stderr=result.stderr,
                return_code=result.return_code,
                execution_time=execution_time,
                changed_files=changed_files,
                workspace_path=str(workspace_path),
                session_id=result.session_id,
                error_message=result.error_message,
                token_limit_hit=token_limit_hit
            )
            
        except subprocess.TimeoutExpired:
            execution_time = time.time() - start_time
            return ClaudeExecutionResult(
                success=False,
                stdout="",
                stderr="Claude Code execution timed out",
                return_code=-1,
                execution_time=execution_time,
                changed_files=[],
                workspace_path=str(workspace_path),
                error_message=f"Execution timed out after {timeout} seconds"
            )
        except Exception as e:
            execution_time = time.time() - start_time
            return ClaudeExecutionResult(
                success=False,
                stdout="",
                stderr=str(e),
                return_code=-1,
                execution_time=execution_time,
                changed_files=[],
                workspace_path=str(workspace_path),
                error_message=f"Execution failed: {str(e)}"
            )

    def _start_new_claude_session(self, workspace_path: Path, prompt: str,
                                 auto_accept: bool, timeout: int) -> 'ClaudeResult':
        """Start a new Claude Code session"""
        cmd = ['claude-code']
        
        if auto_accept:
            cmd.append('--dangerously-skip-permissions')
        
        # Add prompt as command line argument for headless mode
        cmd.extend(['--print', prompt])
        
        print(f"Starting new Claude session with command: {' '.join(cmd)}")
        
        result = subprocess.run(
            cmd,
            cwd=workspace_path,
            capture_output=True,
            text=True,
            timeout=timeout
        )
        
        # Extract session ID from output if available
        session_id = self._extract_session_id(result.stdout)
        
        return ClaudeResult(
            stdout=result.stdout,
            stderr=result.stderr,
            return_code=result.returncode,
            session_id=session_id,
            error_message=None if result.returncode == 0 else result.stderr
        )

    def _resume_claude_session(self, workspace_path: Path, session_id: str, 
                              prompt: str, auto_accept: bool, timeout: int) -> 'ClaudeResult':
        """Resume an existing Claude Code session"""
        cmd = ['claude-code', '--continue']
        
        if auto_accept:
            cmd.append('--dangerously-skip-permissions')
        
        # Add additional prompt if provided
        if prompt and prompt.strip():
            cmd.extend(['--print', prompt])
        
        print(f"Resuming Claude session {session_id} with command: {' '.join(cmd)}")
        
        result = subprocess.run(
            cmd,
            cwd=workspace_path,
            capture_output=True,
            text=True,
            timeout=timeout
        )
        
        return ClaudeResult(
            stdout=result.stdout,
            stderr=result.stderr,
            return_code=result.returncode,
            session_id=session_id,  # Keep existing session ID
            error_message=None if result.returncode == 0 else result.stderr
        )

    def _create_prompt_file(self, workspace_path: Path, prompt: str):
        """Create a prompt file in the workspace .claude directory"""
        claude_dir = workspace_path / '.claude'
        claude_dir.mkdir(exist_ok=True)
        
        prompt_file = claude_dir / 'prompt.md'
        
        # Create formatted prompt with timestamp
        formatted_prompt = f"""# Task Execution Request

**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Task Description
{prompt}

## Instructions
- Follow the task description carefully
- Create clean, well-documented code
- Add comments explaining implementation decisions
- Follow best practices for the relevant technology stack

## Deliverables
Please implement the requested functionality according to the description above.
"""
        
        prompt_file.write_text(formatted_prompt)
        print(f"Created prompt file: {prompt_file}")

    def _get_workspace_files(self, workspace_path: Path) -> Dict[str, float]:
        """Get dictionary of files and their modification times"""
        files = {}
        try:
            for file_path in workspace_path.rglob('*'):
                if file_path.is_file() and not self._should_ignore_file(file_path):
                    relative_path = str(file_path.relative_to(workspace_path))
                    files[relative_path] = file_path.stat().st_mtime
        except Exception as e:
            print(f"Error scanning workspace files: {e}")
        
        return files

    def _should_ignore_file(self, file_path: Path) -> bool:
        """Check if file should be ignored in change detection"""
        ignore_patterns = [
            '.git',
            '__pycache__',
            '*.pyc',
            '.DS_Store',
            'node_modules',
            '.venv',
            '.env'
        ]
        
        file_str = str(file_path)
        return any(pattern in file_str for pattern in ignore_patterns)

    def _detect_file_changes(self, initial_files: Dict[str, float], 
                           final_files: Dict[str, float], 
                           workspace_path: Path) -> List[str]:
        """Detect which files were changed, added, or modified"""
        changed_files = []
        
        # Find new files
        for file_path in final_files:
            if file_path not in initial_files:
                changed_files.append(file_path)
                print(f"New file: {file_path}")
        
        # Find modified files
        for file_path in initial_files:
            if file_path in final_files:
                if final_files[file_path] > initial_files[file_path]:
                    changed_files.append(file_path)
                    print(f"Modified file: {file_path}")
        
        return changed_files

    def _extract_session_id(self, output: str) -> Optional[str]:
        """Extract session ID from Claude output"""
        # Look for session ID patterns in Claude output
        patterns = [
            r'session[_\-\s]+id[:\s]+([a-f0-9\-]{36})',  # session id: uuid
            r'Session:\s+([a-f0-9\-]{36})',  # Session: uuid
            r'ID:\s+([a-f0-9\-]{36})',  # ID: uuid
        ]
        
        for pattern in patterns:
            match = re.search(pattern, output, re.IGNORECASE)
            if match:
                return match.group(1)
        
        return None

    def _check_token_limit_in_output(self, stdout: str, stderr: str) -> bool:
        """Check if output indicates token limit was reached"""
        combined_output = (stdout + stderr).lower()
        
        limit_indicators = [
            'rate limit',
            'usage limit',
            'token limit',
            'quota exceeded',
            'limit reached',
            'too many requests',
            'capacity limit'
        ]
        
        return any(indicator in combined_output for indicator in limit_indicators)

    def check_claude_availability(self) -> Tuple[bool, str]:
        """
        Check if Claude Code is available and working
        
        Returns:
            (is_available: bool, message: str)
        """
        try:
            result = subprocess.run(
                ['claude-code', '--version'],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                return True, f"Claude Code available: {result.stdout.strip()}"
            else:
                return False, f"Claude Code not working: {result.stderr}"
                
        except subprocess.TimeoutExpired:
            return False, "Claude Code command timed out"
        except FileNotFoundError:
            return False, "Claude Code not found in PATH"
        except Exception as e:
            return False, f"Error checking Claude Code: {str(e)}"

    def generate_prompt_from_template(self, template_name: str, **kwargs) -> str:
        """
        Generate prompt from template file
        
        Args:
            template_name: Name of template file (without .md extension)
            **kwargs: Variables to substitute in template
            
        Returns:
            Formatted prompt string
        """
        template_path = Path(f"templates/prompts/{template_name}.md")
        
        if not template_path.exists():
            # Return default template
            return self._get_default_prompt_template().format(**kwargs)
        
        try:
            template_content = template_path.read_text()
            return template_content.format(**kwargs)
        except Exception as e:
            print(f"Error reading template {template_name}: {e}")
            return self._get_default_prompt_template().format(**kwargs)

    def _get_default_prompt_template(self) -> str:
        """Get default prompt template"""
        return """# Task: {title}

## Description
{description}

## Requirements
- Implement the described functionality
- Create clean, well-documented code
- Follow best practices
- Add appropriate error handling

## Deliverables
- Working implementation
- Clear code structure
- Proper documentation
"""


@dataclass
class ClaudeResult:
    """Internal result class for Claude execution"""
    stdout: str
    stderr: str
    return_code: int
    session_id: Optional[str] = None
    error_message: Optional[str] = None