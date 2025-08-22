// Test fixture for service lifecycle interfaces
import { Service, Scope } from "@tdi2/di-core/decorators";
import type { OnInit, OnDestroy, OnMount, OnUnmount } from "@tdi2/di-core/types";

// Service with lifecycle interfaces
@Service()
export class UserService implements OnInit, OnDestroy {
  private data: any = null;
  
  async onInit() {
    console.log('UserService initializing...');
    this.data = await this.loadInitialData();
  }
  
  onDestroy() {
    console.log('UserService cleanup...');
    this.data = null;
  }
  
  private async loadInitialData() {
    return { user: { name: 'John Doe', id: '123' } };
  }
  
  getUser() {
    return this.data?.user;
  }
}

// Component-scoped service with mount/unmount hooks
@Service()
@Scope("transient")
export class TimerService implements OnMount, OnUnmount {
  private timerId: NodeJS.Timeout | null = null;
  
  onMount({ signal }: { signal?: AbortSignal } = {}) {
    console.log('Timer starting...');
    this.timerId = setInterval(() => {
      console.log('Timer tick');
    }, 1000);
    
    if (signal) {
      signal.addEventListener('abort', () => {
        this.onUnmount();
      });
    }
  }
  
  onUnmount() {
    console.log('Timer stopping...');
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
  
  isRunning() {
    return this.timerId !== null;
  }
}