// Auto-generated transformation snapshot for UserProfileWithLifecycle
// Generated: 2025-08-15T12:01:28.534Z
// Test fixture for lifecycle hooks transformation
import React from 'react';
import type { Inject } from "@tdi2/di-core/markers";

// Service interfaces with lifecycle hooks
export interface UserServiceInterface {
  user: { name: string; id: string };
  loadUserData(): Promise<void>;
  onMount?(options: { signal: AbortSignal }): void;
  onUnmount?(): void;
}

export interface TimerServiceInterface {
  startTimer(): void;
  stopTimer(): void;
  onMount?(): void;
  onUnmount?(): void;
}

// Component that uses services with lifecycle hooks
export function UserProfileWithLifecycle({
  userService,
  timerService
}: {
  userService: Inject<UserServiceInterface>;
  timerService: Inject<TimerServiceInterface>;
}) {
  return (
    <div>
      <h1>{userService.user.name}</h1>
      <p>Timer running: {timerService.isRunning ? 'Yes' : 'No'}</p>
    </div>
  );
}