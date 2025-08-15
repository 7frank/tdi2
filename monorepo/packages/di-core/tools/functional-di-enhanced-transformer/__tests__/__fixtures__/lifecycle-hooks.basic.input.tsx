// Test fixture for lifecycle hooks transformation
import React from 'react';
import type { Inject } from "@tdi2/di-core/markers";

// Clean business interfaces (no lifecycle methods)
export interface UserServiceInterface {
  user: { name: string; id: string };
  loadUserData(): Promise<void>;
}

export interface TimerServiceInterface {
  startTimer(): void;
  stopTimer(): void;
  isRunning(): boolean;
}

// Component that uses services (transformer will add lifecycle hooks)
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
      <p>Timer running: {timerService.isRunning() ? 'Yes' : 'No'}</p>
    </div>
  );
}