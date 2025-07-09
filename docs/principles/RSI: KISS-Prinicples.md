# RSI KISS Principles

## 🎯 **Core Philosophy: Simple & Direct**

### **Rule 1: Use Proxy State for Reactivity**
```typescript
// ✅ Simple reactive state
@Service()
class FormService {
  state = {
    data: {},
    isValid: false,
    isSubmitting: false
  }; // Proxy makes this automatically reactive
}

// ❌ Observable complexity
@Service() 
class FormService {
  private dataSubject = new BehaviorSubject({});
  private isValidSubject = new BehaviorSubject(false);
  data$ = this.dataSubject.asObservable();
  isValid$ = this.isValidSubject.asObservable();
}
```

### **Rule 2: Direct Method Calls Between Services**
```typescript
// ✅ Clear, direct communication
@Service()
class WorkflowService {
  async completeStep(stepId: string): Promise<void> {
    if (stepId === 'demographics') {
      const data = this.demographicsService.getData(); // Direct call
      
      if (data.age < 18) {
        this.unlockStep('guardian_consent'); // Direct method
      }
      
      this.unlockStep('insurance'); // Clear order
    }
  }
}

// ❌ Observable indirection
@Service()
class WorkflowService {
  constructor() {
    this.demographicsService.completed$.subscribe(stepId => {
      this.demographicsService.data$.pipe(
        map(data => data.age),
        filter(age => age < 18)
      ).subscribe(() => {
        this.unlockStep('guardian_consent');
      });
    });
  }
}
```

### **Rule 3: Observables Only When Actually Needed**
```typescript
// ✅ Observable for real streaming data
@Service()
class NotificationService {
  // Real-time stream from server
  notifications$ = fromWebSocket('/notifications');
}

// ✅ Observable for complex async with cancellation
@Service()
class SearchService {
  search(query: string): Observable<SearchResult[]> {
    return fromFetch(`/search?q=${query}`).pipe(
      debounceTime(300),
      switchMap(response => response.json()),
      retry(3)
    );
  }
}

// ❌ Observable for simple form state
@Service()
class FormService {
  // Just use proxy state instead!
  state = { formData: {} };
}
```

## 🏗️ **Architecture Layers**

### **Layer 1: Components (View)**
- Access service state directly via proxy
- Call service methods directly
- No manual subscriptions
- Pure presentation logic

### **Layer 2: Services (Business Logic)**
- Proxy state for reactive data
- Direct method calls to other services
- Clear business operations
- No observable orchestration complexity

### **Layer 3: External (Data)**
- Observables for real streaming data
- Promises for simple async operations
- Direct HTTP calls for CRUD

## 📋 **Decision Matrix: Observable vs Direct Call**

| Use Case | Approach | Reason |
|----------|----------|---------|
| Form field update | Direct call | Immediate, synchronous |
| Service validation | Direct call | Simple business logic |
| Cross-service communication | Direct call | Clear execution order |
| Auto-save after delay | Observable | Time-based operation |
| WebSocket data | Observable | Real streaming data |
| Complex async with retry | Observable | Cancellation/error handling |
| API call with loading state | Direct call + proxy state | Simple async + reactive UI |
| Real-time notifications | Observable | Continuous data stream |

## 🎯 **Benefits of KISS RSI**

### **1. Simpler Mental Model**
```
Service A calls Service B → Service B updates state → UI reacts
```
Instead of:
```
Service A emits → Service B subscribes → Service B emits → Service C subscribes → etc.
```

### **2. Easier Debugging**
- Direct call stack in debugger
- No subscription chain to trace
- Clear cause and effect

### **3. Better Performance**
- No subscription overhead
- No memory leak potential
- Proxy state only updates when changed

### **4. Easier Testing**
```typescript
// ✅ Simple test
test('completing demographics unlocks insurance', async () => {
  await workflowService.completeStep('demographics');
  expect(workflowService.isStepUnlocked('insurance')).toBe(true);
});

// ❌ Complex observable test
test('completing demographics unlocks insurance', (done) => {
  workflowService.unlockedSteps$.pipe(
    filter(steps => steps.includes('insurance')),
    first()
  ).subscribe(() => {
    expect(workflowService.isStepUnlocked('insurance')).toBe(true);
    done();
  });
  
  demographicsService.complete();
});
```

## 🚦 **Red Flags: When You're Over-Engineering**

### **❌ Observable Anti-Patterns:**
- BehaviorSubject for every piece of state
- Subscription chains between services
- Observable for simple getters/setters
- Complex pipe operations for basic logic
- Memory leak worries from subscriptions

### **✅ KISS Indicators:**
- Direct method calls between services
- Proxy state for UI reactivity
- Clear execution flow
- Easy to step through in debugger
- Tests are simple and straightforward

## 🎖️ **The Bottom Line**

**RSI KISS = The best of both worlds:**
- **Reactive UI** (via proxy state)
- **Simple business logic** (via direct calls)
- **Clear architecture** (services with clear boundaries)
- **Easy testing** (no subscription complexity)
- **Good performance** (no observable overhead)

**Use observables sparingly:**
- Real-time data streams
- Complex async operations with cancellation
- External event sources

**Everything else:**
- Direct method calls
- Proxy state
- Simple promises for async operations