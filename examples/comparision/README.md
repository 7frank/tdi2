# State Management & DI Comparison Examples

A collection of counter implementations demonstrating different approaches to decoupling, dependency injection and state management in React.

## Implemented Examples

### [Vanilla State](./vanilla-state/)

Baseline React implementation using `useState` hook. All state and logic live directly in the component.

### [Context API](./vanilla-context/)

Idiomatic React Context API pattern. State centralized in a Provider component, accessed via custom hooks.

### [Zustand](./zustandjs/)

Lightweight state management library. Global store with automatic subscriptions, no providers needed.

### [Redux Toolkit](./redux-toolkit/)
Official Redux toolset with slices and automatic action creators. Centralized state with predictable updates via dispatched actions.

### [Deepkit Injector](./di-deepkit-injector/)
TypeScript reflection-based DI. Services injected via function parameters using runtime type metadata, no decorators needed.

### [TDI2 with Reactive Services](./tdi2/)
Dependency injection with reactive state management (Valtio). Business logic in service classes, components are pure templates.

## ToDo

### More DI Solutions:
- **TSyringe / TypeDI** – Decorator-based DI; ergonomic but less React-aware.
- **InversifyJS** – Powerful but verbose and reflection-heavy.
- **Awilix** – Dynamic, predictable, low-ceremony container; lacks interface typing.
- **react-ioc** – Minimal contextual DI; pragmatic but not full-featured.
- **Obsidian** – https://github.com/wix-incubator
