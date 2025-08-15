// Example demonstrating TDI2 lifecycle hooks
import React from 'react';
import { Service, PostConstruct, PreDestroy, OnMount, OnUnmount, Scope } from '@tdi2/di-core/decorators';
import type { Inject } from '@tdi2/di-core/markers';

// Service-level lifecycle example
@Service()
export class UserService implements UserServiceInterface {
  private userData: any = null;
  
  @PostConstruct
  async initialize() {
    console.log('🚀 UserService: PostConstruct - Loading initial data...');
    // This runs after dependency injection, perfect for async initialization
    this.userData = await this.fetchUserFromAPI();
  }
  
  @PreDestroy
  cleanup() {
    console.log('🧹 UserService: PreDestroy - Cleaning up...');
    // This runs when the service is destroyed
    this.userData = null;
  }
  
  private async fetchUserFromAPI(): Promise<any> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
    return { name: 'John Doe', id: '123' };
  }
  
  getUser() {
    return this.userData;
  }
}

// Component-scoped lifecycle example
@Service()
@Scope("transient") // New instance per component
export class TimerService implements TimerServiceInterface {
  private intervalId: number | null = null;
  private count = 0;
  
  @OnMount
  startPolling({ signal }: { signal: AbortSignal }) {
    console.log('⏰ TimerService: OnMount - Starting timer...');
    
    this.intervalId = setInterval(() => {
      this.count++;
      console.log(`Timer tick: ${this.count}`);
    }, 1000);
    
    // Cleanup on abort signal (component unmount)
    signal.addEventListener('abort', () => {
      this.stopPolling();
    });
  }
  
  @OnUnmount
  stopPolling() {
    console.log('⏹️ TimerService: OnUnmount - Stopping timer...');
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  getCount() {
    return this.count;
  }
  
  isRunning() {
    return this.intervalId !== null;
  }
}

// Interfaces
export interface UserServiceInterface {
  getUser(): any;
}

export interface TimerServiceInterface {
  getCount(): number;
  isRunning(): boolean;
}

// React component that will have lifecycle hooks auto-generated
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
  //   timerService.onMount?.({ signal: abortController.signal });
  //   
  //   return () => {
  //     abortController.abort();
  //     timerService.onUnmount?.();
  //   };
  // }, []);

  const user = userService.getUser();
  
  return (
    <div>
      <h1>Welcome, {user?.name || 'Loading...'}</h1>
      <p>Timer count: {timerService.getCount()}</p>
      <p>Timer status: {timerService.isRunning() ? 'Running' : 'Stopped'}</p>
    </div>
  );
}

/*
 * Transformation Output:
 * 
 * The functional DI transformer will convert the above component to:
 * 
 * export function UserDashboard(props: {
 *   userService: Inject<UserServiceInterface>;
 *   timerService: Inject<TimerServiceInterface>;
 * }) {
 *   const userService = props.userService;
 *   const timerService = props.timerService;
 * 
 *   React.useEffect(() => {
 *     const abortController = new AbortController();
 *     
 *     timerService.onMount?.({ signal: abortController.signal });
 * 
 *     return () => {
 *       abortController.abort();
 *       timerService.onUnmount?.();
 *     };
 *   }, []);
 * 
 *   const user = userService.getUser();
 *   
 *   return (
 *     <div>
 *       <h1>Welcome, {user?.name || 'Loading...'}</h1>
 *       <p>Timer count: {timerService.getCount()}</p>
 *       <p>Timer status: {timerService.isRunning() ? 'Running' : 'Stopped'}</p>
 *     </div>
 *   );
 * }
 */