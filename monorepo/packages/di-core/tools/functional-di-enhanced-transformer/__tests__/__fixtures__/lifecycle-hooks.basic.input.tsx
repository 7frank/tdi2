// Test fixture for lifecycle hooks transformation
import React from 'react';
import type { Inject } from "@tdi2/di-core/markers";
import { Service } from "@tdi2/di-core";
import type { OnMount, OnUnmount } from "@tdi2/di-core";

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
export class UserService implements UserServiceInterface, OnMount, OnUnmount {
  user = { name: "John", id: "123" };
  
  async loadUserData() {
    // Load user data
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