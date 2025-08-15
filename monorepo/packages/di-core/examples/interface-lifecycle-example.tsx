// Example showing the clean interface-based lifecycle pattern
import React from 'react';
import { Service } from '@tdi2/di-core/decorators';
import type { Inject } from '@tdi2/di-core/markers';
import type { OnInit, OnDestroy, OnMount, OnUnmount } from '@tdi2/di-core';

// STEP 1: Clean business interfaces (no lifecycle methods)
export interface UserServiceInterface {
  user: { name: string; id: string } | null;
  loadUserData(): Promise<void>;
  isLoading(): boolean;
}

export interface TimerServiceInterface {
  startTimer(): void;
  stopTimer(): void;
  isRunning(): boolean;
  getCount(): number;
}

// STEP 2: Service implementations that implement BOTH business interface AND lifecycle interfaces
@Service()
export class UserService implements UserServiceInterface, OnInit, OnDestroy {
  user: { name: string; id: string } | null = null;
  private loading = false;
  
  // Business methods
  async loadUserData(): Promise<void> {
    this.loading = true;
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
    this.user = { name: 'John Doe', id: '123' };
    this.loading = false;
  }
  
  isLoading(): boolean {
    return this.loading;
  }
  
  // Lifecycle implementation (OnInit interface)
  async onInit(): void {
    console.log('UserService: OnInit - Loading initial data...');
    await this.loadUserData();
  }
  
  // Lifecycle implementation (OnDestroy interface)
  onDestroy(): void {
    console.log('UserService: OnDestroy - Cleaning up...');
    this.user = null;
  }
}

@Service()
export class TimerService implements TimerServiceInterface, OnMount, OnUnmount {
  private intervalId: number | null = null;
  private count = 0;
  
  // Business methods
  startTimer(): void {
    if (!this.intervalId) {
      this.intervalId = setInterval(() => {
        this.count++;
        console.log(`Timer: ${this.count}`);
      }, 1000);
    }
  }
  
  stopTimer(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  isRunning(): boolean {
    return this.intervalId !== null;
  }
  
  getCount(): number {
    return this.count;
  }
  
  // Lifecycle implementation (OnMount interface)
  onMount(options?: { signal?: AbortSignal }): void {
    console.log('TimerService: OnMount - Starting timer...');
    this.startTimer();
    
    // Handle component unmount via AbortSignal
    if (options?.signal) {
      options.signal.addEventListener('abort', () => {
        this.stopTimer();
      });
    }
  }
  
  // Lifecycle implementation (OnUnmount interface)
  onUnmount(): void {
    console.log('TimerService: OnUnmount - Stopping timer...');
    this.stopTimer();
  }
}

// STEP 3: React component (transformer will automatically add lifecycle hooks)
export function UserDashboard({
  userService,
  timerService
}: {
  userService: Inject<UserServiceInterface>;
  timerService: Inject<TimerServiceInterface>;
}) {
  // The transformer will automatically generate:
  // React.useEffect(() => {
  //   const abortController = new AbortController();
  //   
  //   userService?.onMount?.({ signal: abortController.signal });
  //   timerService?.onMount?.({ signal: abortController.signal });
  //   
  //   return () => {
  //     abortController.abort();
  //     userService?.onUnmount?.();
  //     timerService?.onUnmount?.();
  //   };
  // }, []);

  const user = userService.user;
  
  return (
    <div>
      <h1>Dashboard</h1>
      {userService.isLoading() ? (
        <p>Loading user...</p>
      ) : user ? (
        <p>Welcome, {user.name}!</p>
      ) : (
        <p>No user data</p>
      )}
      
      <div>
        <p>Timer: {timerService.getCount()}</p>
        <p>Status: {timerService.isRunning() ? 'Running' : 'Stopped'}</p>
        <button onClick={() => timerService.startTimer()}>Start</button>
        <button onClick={() => timerService.stopTimer()}>Stop</button>
      </div>
    </div>
  );
}

/*
 * Benefits of this approach:
 * 
 * 1. Clean separation: Business logic interfaces vs lifecycle implementation
 * 2. Type-safe: TypeScript enforces interface implementation
 * 3. Familiar: Same pattern as Angular (OnInit, OnDestroy, etc.)
 * 4. Automatic: Transformer generates useEffect automatically
 * 5. Runtime-safe: Uses optional chaining (service?.onMount?.())
 * 6. Flexible: Services can implement any combination of lifecycle interfaces
 * 
 * The transformer detects that timerService implements OnMount/OnUnmount
 * and automatically generates the useEffect hook for component lifecycle.
 */