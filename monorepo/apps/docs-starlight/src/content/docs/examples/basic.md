---
title: Try TDI2 in 30 Seconds
description: Get a working React app with zero prop drilling running in 30 seconds. Experience dependency injection firsthand.
---

# Try TDI2 in 30 Seconds

**Experience zero prop drilling instantly** - no tutorials, no setup complexity. Just copy, paste, run.

## One Command Setup

```bash
npx degit 7frank/tdi2/examples/tdi2-basic-example my-di-app
cd my-di-app && npm install && npm run dev
```

**Open**: `http://localhost:5173` → **You now have a working React app with dependency injection!**

## What You'll See

A working counter app with:
- ✅ **Zero prop drilling** - no props passed to components
- ✅ **Automatic state sync** - change count anywhere, all components update
- ✅ **Clean separation** - business logic in services, UI in components
- ✅ **Type safety** - full TypeScript with automatic interface resolution

## The Magic in 4 Files

### 1. Service with Reactive State

```typescript
// src/services/CounterService.ts
@Service()
export class CounterService implements CounterServiceInterface {
  state = {
    count: 0,
    message: "Click buttons to count!",
  };

  increment(): void {
    this.state.count++;
    this.state.message = `Count is now ${this.state.count}`;
  }

  decrement(): void {
    this.state.count--;
    this.state.message = `Count is now ${this.state.count}`;
  }
}
```

### 2. Component with Service Injection

```typescript
// src/App.tsx
interface CounterProps {
  services: { counterService: Inject<CounterServiceInterface> };
}

export function Counter(props: CounterProps) {
  const { services: { counterService } } = props;
  
  // No useState, no useEffect - everything from service!
  return (
    <div>
      <h1>{counterService.state.count}</h1>
      <p>{counterService.state.message}</p>
      <button onClick={() => counterService.increment()}>+</button>
      <button onClick={() => counterService.decrement()}>-</button>
    </div>
  );
}
```

### 3. DI Container Setup

```typescript
// src/main.tsx
const container = new DIContainer();
container.loadConfiguration(DI_CONFIG);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <DIProvider container={container}>
    <App />
  </DIProvider>
);
```

### 4. Build-Time Configuration

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    react(),
    diEnhancedPlugin({
      enableFunctionalDI: true,
      enableInterfaceResolution: true,
    })
  ]
});
```

## Debug the Magic

While your app runs, visit these URLs to see how DI works:

- `http://localhost:5173/_di_debug` - Complete dependency injection info
- `http://localhost:5173/_di_interfaces` - Interface → Service mappings
- `http://localhost:5173/_di_configs` - Build-time generated config

## The Transformation

**What just happened?**

1. **No prop drilling** - `CounterService` injects directly into components
2. **Automatic reactivity** - Change `counterService.state.count` → all components update
3. **Interface resolution** - TypeScript `CounterServiceInterface` → `CounterService` automatically
4. **Zero boilerplate** - No providers, contexts, or manual subscriptions

## Key Benefits You Experience

| Traditional React | TDI2 (What You Just Ran) |
|------------------|---------------------------|
| `useState` + `useEffect` chains | Clean service state |
| Manual prop passing | Automatic service injection |
| Component testing complexity | Service unit testing |
| State scattered everywhere | Centralized service state |
| Manual synchronization | Automatic reactivity |

## Next Steps

**Convinced?** Here's your learning path:

1. 📖 **[Quick Start Guide](../getting-started/quick-start/)** - Build a service from scratch
2. 🏗️ **[Migration Strategy](../guides/migration/strategy/)** - Transform your existing React app
3. 🏢 **[Enterprise Guide](../guides/enterprise/implementation/)** - Scale to large teams

**Questions?** Check our [troubleshooting guide](../guides/advanced/troubleshooting/) or [architecture decisions](../adr/).

---

**🎯 The Point**: You just experienced React without prop drilling. This is what TDI2 enables - clean, scalable, automatically synchronized React applications.