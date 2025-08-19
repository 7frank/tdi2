// Test fixture for service lifecycle decorators
import { Service, PostConstruct, PreDestroy, OnMount, OnUnmount, Scope } from "@tdi2/di-core/decorators";

// Service with lifecycle decorators
@Service()
export class UserService {
  private data: any = null;
  
  @PostConstruct
  async initialize() {
    console.log('UserService initializing...');
    this.data = await this.loadInitialData();
  }
  
  @PreDestroy
  cleanup() {
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
export class TimerService {
  private timerId: number | null = null;
  
  @OnMount
  startTimer({ signal }: { signal: AbortSignal }) {
    console.log('Timer starting...');
    this.timerId = setInterval(() => {
      console.log('Timer tick');
    }, 1000);
    
    signal.addEventListener('abort', () => {
      this.stopTimer();
    });
  }
  
  @OnUnmount
  stopTimer() {
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