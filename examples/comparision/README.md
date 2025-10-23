# State Management & DI Comparison Examples

A collection of counter implementations demonstrating different approaches to decoupling, dependency injection and state management  in React.

## Implemented Examples

### [Vanilla State](./vanilla-state/)
Baseline React implementation using `useState` hook. All state and logic live directly in the component.

### [Context API](./vanilla-context/)
Idiomatic React Context API pattern. State centralized in a Provider component, accessed via custom hooks.

### [Zustand](./zustandjs/)
Lightweight state management library. Global store with automatic subscriptions, no providers needed.

### [TDI2 with Reactive Services](./tdi2/)
Dependency injection with reactive state management (Valtio). Business logic in service classes, components are pure templates.

## ToDo

- Redux
- Various DI solutions (InversifyJS, TSyringe, etc.)
