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

### [TDI2 with Reactive Services](./tdi2/)

Dependency injection with reactive state management (Valtio). Business logic in service classes, components are pure templates.

## ToDo

Various DI solutions:

- @deepkit/injector https://github.com/marcj/typescript-react-dependency-injection

- obsidian https://github.com/wix-incubator

4. **TSyringe / TypeDI** – solid decorator-based DI; ergonomic but less React-aware.
5. **InversifyJS** – powerful but verbose and reflection-heavy.
6. **Awilix** – dynamic, predictable, low-ceremony container; lacks interface typing.
7. **react-ioc** – minimal contextual DI; pragmatic but not full-featured.
8. **react-magnetic-di** – testing-oriented, not architectural DI.
