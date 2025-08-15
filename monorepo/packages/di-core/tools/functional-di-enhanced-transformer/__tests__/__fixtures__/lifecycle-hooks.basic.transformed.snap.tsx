// Auto-generated transformation snapshot for UserProfileWithLifecycle
// Generated: 2025-08-15T12:22:39.985Z
// Test fixture for lifecycle hooks transformation
import React from 'react';
import type { Inject } from "@tdi2/di-core/markers";
import { useService, useOptionalService } from "@tdi2/di-core/context";

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
export function UserProfileWithLifecycle(props: {
      userService: Inject<UserServiceInterface>;
      timerService: Inject<TimerServiceInterface>;
    }) {
    const userService = props.userService;
    React.useEffect(() => {
        const abortController = new AbortController();
        
        userService?.onMount?.({ signal: abortController.signal });
        timerService?.onMount?.({ signal: abortController.signal });

        return () => {
          abortController.abort();
          userService?.onUnmount?.();
          timerService?.onUnmount?.();
        };
      }, []); if (!userService) {throw new Error("Could not find implementation for 'UserServiceInterface'");}
    const timerService = props.timerService; if (!timerService) {throw new Error("Could not find implementation for 'TimerServiceInterface'");}
  return (
    <div>
      <h1>{userService.user.name}</h1>
      <p>Timer running: {timerService.isRunning() ? 'Yes' : 'No'}</p>
    </div>
  );
}