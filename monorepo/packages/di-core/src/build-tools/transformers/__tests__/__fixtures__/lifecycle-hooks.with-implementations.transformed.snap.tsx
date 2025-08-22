// Auto-generated transformation snapshot for UserProfileWithImplementedLifecycle
// Generated: 2025-08-15T13:35:00.000Z
// Test fixture for lifecycle hooks transformation with actual implementations
import React from 'react';
import type { Inject } from "@tdi2/di-core/markers";
import { useService, useOptionalService } from "@tdi2/di-core/context";
import { Service } from "@tdi2/di-core";
import type { OnMount, OnUnmount, OnInit, OnDestroy } from "@tdi2/di-core";

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

// Service implementations that actually implement lifecycle interfaces
@Service()
export class UserService implements UserServiceInterface, OnMount, OnUnmount, OnInit, OnDestroy {
  user = { name: "John", id: "123" };
  
  async loadUserData() {
    // Load user data
  }

  onInit() {
    console.log('UserService initialized');
  }

  onDestroy() {
    console.log('UserService destroyed');
  }

  onMount() {
    console.log('UserService mounted');
  }

  onUnmount() {
    console.log('UserService unmounted');
  }
}

@Service()
export class TimerService implements TimerServiceInterface, OnMount, OnUnmount {
  private running = false;

  startTimer() {
    this.running = true;
  }

  stopTimer() {
    this.running = false;
  }

  isRunning() {
    return this.running;
  }

  onMount() {
    this.startTimer();
  }

  onUnmount() {
    this.stopTimer();
  }
}

// Component that uses services (transformer will add lifecycle hooks)
export function UserProfileWithImplementedLifecycle(props: {
      userService: Inject<UserServiceInterface>;
      timerService: Inject<TimerServiceInterface>;
    }) {
    const userService = props.userService ?? (useService('UserServiceInterface') as unknown as UserServiceInterface);
    const timerService = props.timerService ?? (useService('TimerServiceInterface') as unknown as TimerServiceInterface);
    React.useEffect(() => {
        const abortController = new AbortController();
        
        userService?.onMount?.({ signal: abortController.signal });
        timerService?.onMount?.({ signal: abortController.signal });

        return () => {
          abortController.abort();
          userService?.onUnmount?.();
          timerService?.onUnmount?.();
        };
      }, []);
  return (
    <div>
      <h1>{userService.user.name}</h1>
      <p>Timer running: {timerService.isRunning() ? 'Yes' : 'No'}</p>
    </div>
  );
}