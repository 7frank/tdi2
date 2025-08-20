# TDI2 Framework Guide for AI Bots

## Core Concept
TDI2 provides **autowiring dependency injection** for React. You declare services in component interfaces, the Vite plugin automatically injects them at build time.

## Service Pattern
```typescript
@Service()
export class MyService implements MyServiceInterface {
  state = proxy({ /* Valtio reactive state */ });
  
  constructor(@Inject() dependency: OtherServiceInterface) {}
  
  onInit() { /* business logic initialization */ }
  onDestroy() { /* cleanup */ }
}
```

## Component Pattern
```typescript
// You write:
interface MyComponentProps {
  services: {
    myService: Inject<MyServiceInterface>;
  };
}

export function MyComponent(props: MyComponentProps) {
  const { services: { myService } } = props;
  return <div>{myService.state.data}</div>;
}

// TDI2 transforms to:
// export function MyComponent() {
//   const myService = useService('MyServiceInterface');
//   return <div>{myService.state.data}</div>;
// }
```

## Lifecycle Patterns

**Business Logic → Services**
- Use `onInit()` / `onDestroy()` 
- Persistent state, business rules

**View Logic → Controllers**
- Use `OnMount` / `OnUnmount` interfaces
- UI state, component lifecycle

## Setup
```typescript
// main.tsx
const container = new CompileTimeDIContainer();
container.loadConfiguration(DI_CONFIG); // Auto-generated

<DIProvider container={container}>
  <App />
</DIProvider>
```

## Key Rules
- Services auto-register with `@Service()` decorator
- No manual `container.register()` calls
- Components declare services in props, TDI2 auto-injects
- Separate business logic (services) from view logic (controllers/hooks)

Reference: [Full Documentation](https://7frank.github.io/tdi2/)