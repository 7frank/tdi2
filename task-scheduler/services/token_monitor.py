"""
Claude Code Token Monitor Service

Monitors Claude Code subscription token usage and limits using /status command.
Handles pause/resume logic based on token availability.
"""
import subprocess
import re
import time
from datetime import datetime, timezone, timedelta
from typing import Dict, Optional, Tuple, NamedTuple
from dataclasses import dataclass
from enum import Enum


class SubscriptionPlan(Enum):
    """Claude subscription plan types"""
    PRO = "pro"
    MAX_5X = "max5"
    MAX_20X = "max20"


@dataclass
class TokenUsageInfo:
    """Token usage information from Claude Code status"""
    messages_used: int
    messages_limit: int
    percentage_used: float
    time_until_reset: Optional[timedelta]
    plan: Optional[SubscriptionPlan]
    raw_output: str
    timestamp: datetime


class TokenMonitor:
    """Monitors Claude Code token usage and limits"""

    def __init__(self, warning_threshold: float = 0.8, critical_threshold: float = 0.95):
        """
        Initialize token monitor
        
        Args:
            warning_threshold: Percentage at which to warn (0.8 = 80%)
            critical_threshold: Percentage at which to pause tasks (0.95 = 95%)
        """
        self.warning_threshold = warning_threshold
        self.critical_threshold = critical_threshold
        self.last_check: Optional[TokenUsageInfo] = None
        self.monitoring_interval = 300  # 5 minutes in seconds

    def check_token_status(self) -> Optional[TokenUsageInfo]:
        """
        Check Claude Code token status using /status command
        
        Returns:
            TokenUsageInfo object or None if check failed
        """
        try:
            # Execute claude-code with /status command
            # We use echo to simulate typing /status in an interactive session
            result = subprocess.run(
                ['claude-code'],
                input='/status\n/exit\n',
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                usage_info = self._parse_status_output(result.stdout)
                if usage_info:
                    self.last_check = usage_info
                    return usage_info
            else:
                print(f"Claude status check failed with return code {result.returncode}")
                print(f"Error: {result.stderr}")
                
        except subprocess.TimeoutExpired:
            print("Claude status check timed out")
        except subprocess.CalledProcessError as e:
            print(f"Claude status check failed: {e}")
        except Exception as e:
            print(f"Unexpected error checking Claude status: {e}")
            
        return None

    def _parse_status_output(self, output: str) -> Optional[TokenUsageInfo]:
        """
        Parse Claude Code /status output to extract usage information
        
        The output format varies, but typically includes:
        - Message count (e.g., "45 messages" or "45/225")
        - Time remaining (e.g., "4h 23m remaining")
        - Plan information
        """
        try:
            # Look for message usage patterns
            message_patterns = [
                r'(\d+)/(\d+)\s+messages?',  # "45/225 messages"
                r'(\d+)\s+messages?\s+used.*?(\d+)\s+total',  # "45 messages used of 225 total"
                r'(\d+)\s+messages?\s+.*?limit\s+(\d+)',  # "45 messages, limit 225"
            ]
            
            messages_used = 0
            messages_limit = 0
            
            for pattern in message_patterns:
                match = re.search(pattern, output, re.IGNORECASE)
                if match:
                    messages_used = int(match.group(1))
                    messages_limit = int(match.group(2))
                    break
            
            # If no clear limit found, try to infer from usage
            if messages_limit == 0:
                # Look for standalone usage numbers and infer limits based on known plans
                usage_match = re.search(r'(\d+)\s+messages?', output, re.IGNORECASE)
                if usage_match:
                    messages_used = int(usage_match.group(1))
                    # Infer plan based on common limits
                    if messages_used <= 50:
                        messages_limit = 45  # Pro plan
                    elif messages_used <= 250:
                        messages_limit = 225  # Max 5x
                    else:
                        messages_limit = 900  # Max 20x
            
            # Look for time remaining
            time_until_reset = None
            time_patterns = [
                r'(\d+)h\s*(\d+)m\s+remaining',  # "4h 23m remaining"
                r'(\d+)\s*hours?\s*(\d+)\s*minutes?\s+remaining',  # "4 hours 23 minutes remaining"
                r'(\d+)h\s+remaining',  # "4h remaining"
                r'(\d+)\s*minutes?\s+remaining',  # "23 minutes remaining"
            ]
            
            for pattern in time_patterns:
                match = re.search(pattern, output, re.IGNORECASE)
                if match:
                    if len(match.groups()) == 2:
                        hours = int(match.group(1))
                        minutes = int(match.group(2))
                        time_until_reset = timedelta(hours=hours, minutes=minutes)
                    else:
                        # Single time unit
                        if 'h' in match.group(0) or 'hour' in match.group(0):
                            hours = int(match.group(1))
                            time_until_reset = timedelta(hours=hours)
                        else:
                            minutes = int(match.group(1))
                            time_until_reset = timedelta(minutes=minutes)
                    break
            
            # Determine plan type
            plan = None
            if messages_limit <= 50:
                plan = SubscriptionPlan.PRO
            elif messages_limit <= 250:
                plan = SubscriptionPlan.MAX_5X
            elif messages_limit <= 1000:
                plan = SubscriptionPlan.MAX_20X
            
            # Calculate percentage used
            percentage_used = 0.0
            if messages_limit > 0:
                percentage_used = messages_used / messages_limit
            
            return TokenUsageInfo(
                messages_used=messages_used,
                messages_limit=messages_limit,
                percentage_used=percentage_used,
                time_until_reset=time_until_reset,
                plan=plan,
                raw_output=output,
                timestamp=datetime.now(timezone.utc)
            )
            
        except Exception as e:
            print(f"Error parsing Claude status output: {e}")
            print(f"Raw output: {output}")
            return None

    def can_run_tasks(self) -> Tuple[bool, str]:
        """
        Check if tasks can run based on current token usage
        
        Returns:
            (can_run: bool, reason: str)
        """
        status = self.check_token_status()
        
        if not status:
            return False, "Could not check Claude Code token status"
        
        if status.percentage_used >= self.critical_threshold:
            time_str = ""
            if status.time_until_reset:
                hours = status.time_until_reset.total_seconds() // 3600
                minutes = (status.time_until_reset.total_seconds() % 3600) // 60
                time_str = f" (resets in {int(hours)}h {int(minutes)}m)"
            
            return False, f"Token usage at {status.percentage_used:.1%}, above critical threshold{time_str}"
        
        return True, "Token usage within acceptable limits"

    def get_usage_summary(self) -> Dict:
        """Get current usage summary for display"""
        status = self.check_token_status()
        
        if not status:
            return {
                "status": "unknown",
                "message": "Could not retrieve token status"
            }
        
        return {
            "status": "ok" if status.percentage_used < self.critical_threshold else "critical",
            "messages_used": status.messages_used,
            "messages_limit": status.messages_limit,
            "percentage_used": f"{status.percentage_used:.1%}",
            "plan": status.plan.value if status.plan else "unknown",
            "time_until_reset": str(status.time_until_reset) if status.time_until_reset else "unknown",
            "can_run_tasks": status.percentage_used < self.critical_threshold,
            "warning_active": status.percentage_used >= self.warning_threshold,
            "last_check": status.timestamp.strftime("%Y-%m-%d %H:%M:%S UTC")
        }

    def wait_for_token_reset(self) -> bool:
        """
        Wait for token limits to reset, checking periodically
        
        Returns:
            True if tokens are available, False if timeout or error
        """
        print("Waiting for Claude Code token limits to reset...")
        
        max_wait_time = timedelta(hours=6)  # Maximum wait time
        start_time = datetime.now(timezone.utc)
        check_interval = 300  # Check every 5 minutes
        
        while datetime.now(timezone.utc) - start_time < max_wait_time:
            can_run, reason = self.can_run_tasks()
            
            if can_run:
                print("Token limits have reset, tasks can resume")
                return True
            
            print(f"Still waiting... {reason}")
            
            # If we have a specific reset time, calculate better wait interval
            if self.last_check and self.last_check.time_until_reset:
                wait_time = min(check_interval, self.last_check.time_until_reset.total_seconds() / 4)
                time.sleep(max(60, wait_time))  # Wait at least 1 minute
            else:
                time.sleep(check_interval)
        
        print("Timeout waiting for token reset")
        return False

    def get_estimated_tasks_remaining(self) -> int:
        """
        Estimate how many more tasks can be run with remaining tokens
        
        Rough estimate based on typical Claude Code usage patterns
        """
        status = self.check_token_status()
        
        if not status:
            return 0
        
        remaining_messages = status.messages_limit - status.messages_used
        
        # Rough estimates based on typical task complexity:
        # Simple tasks: 2-5 messages
        # Medium tasks: 5-15 messages  
        # Complex tasks: 15-30 messages
        # Use conservative estimate of 10 messages per task
        estimated_tasks = max(0, remaining_messages // 10)
        
        return estimated_tasks