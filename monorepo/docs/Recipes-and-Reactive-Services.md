# Recipes

In architecture there is no "one size fits all".

- For certain scenarios and stream/project sizes, different patterns can be combined for maximum efficiency.

## Client Side

> You have multiple services that need to be reactive to one another.

### Options

- **EventEmitter (Node.js / Angular-style)**
  - Publisher emits named events.
  - Subscribers listen via `on(event, handler)`.
  - Simple but limited in composition and lifecycle control.

- **Callbacks**
  - Direct function references passed to services.
  - Lightweight but tightly coupled and inflexible for multi-subscriber or asynchronous flows.

- **Pub/Sub Buses**
  - Central event bus or message broker pattern.
  - Services publish events to topics; subscribers register interest.
  - Useful for modular, large-scale systems.

- **Observer Pattern (Custom Implementation)**
  - Define `subscribe`, `unsubscribe`, and `notify` methods.
  - Manual management of observers.
  - Good for lightweight, framework-agnostic use.

### Best Approach (RxJS or EventEmitter for lighter projects)

- **Use RxJS Subjects or Observables** for best integration with classes under Inversify:
  - Each service exposes reactive streams via `BehaviorSubject`, `ReplaySubject`, or `Observable`.
  - Consumers subscribe using standard RxJS.
  - Internal state updates propagate through subjects.
  - Maintains decoupling via interfaces.
  - Compatible with constructor injection.

- **Alternative**: use custom Observer pattern if RxJS overhead is unacceptable.
  - Define interface with `subscribe`, `unsubscribe`, `notify`.
  - Lightweight but limited in composition and debugging tools.

- **Avoid** EventEmitter unless targeting Node-style synchronous events.
- **Avoid** callbacks due to inversion violation and tight coupling.
- **Pub/Sub** buses scale but reduce traceability inside DI graphs.

**Summary**:

- `RxJS` = Best for reactive classes under DI.
- `Custom Observer` = Minimal viable option.
- Avoid: `callbacks`, `polling`, `EventEmitter` for complex service graphs.

## Server Side

> No hooks on server

**TODO**: Missing implementation

- Use `InjectServer<>` instead of `Inject<>`
  **or**
- Let `useService` contain a server/browser check:
  - On server: use `useState` and `useSnapshot`
  - On client: just pass the `di.invoke("ServiceName")` result

---

---

---

---

# Reactive Services in Type-Injection Architectures

## Overview

This document outlines decision boundaries for when to architect services as _reactive_ in a TypeScript project using dependency injection (DI), and when to maintain _imperative_ service structures. The guiding pattern assumes a structured service graph—acyclic, possibly hierarchical (tree-like)—informed by clean architecture or hexagonal principles. The focus is on preserving determinism, reducing complexity, and isolating side-effects to system boundaries.

---

## When to Use Reactive Services

Use reactive constructs **only at system boundaries**, where external events or user interactions require response over time or across layers.

### Valid Scenarios

- **UI input streams**: User typing, clicking, resizing — mapped to UI-bound observables.
- **External event sources**: WebSockets, HTTP polling, file watchers, message queues.
- **Framework-bound lifecycles**: Reactive libraries (Angular `Signals`, RxJS in components).
- **Dataflow modeling**: Streams that model continuous data (e.g., telemetry, logs).

### Characteristics

- One-to-many notification required.
- No fixed call order.
- Non-blocking, time-dependent, uncertain frequency.

---

## When _Not_ to Use Reactive Services

Avoid reactive constructs inside **core services** or between services injected via DI. Instead, model services as deterministic procedures.

### Invalid Scenarios

- **Business logic chaining**: Replace reactive streams with method calls.
- **Service orchestration**: Use imperative control, not event propagation.
- **State transitions**: Model explicitly, not through reactive subscriptions.
- **Testing hooks**: Prefer mocking interfaces over injecting observables.

### Characteristics

- Requires strict ordering.
- Needs predictable execution.
- Produces side-effects under control flow.
- Violates separation of concerns if reactive.

---

## Architectural Implications

### If Reactive Used in Core

- **Loss of traceability**: Hidden dependencies via subscriptions.
- **Side-effect diffusion**: Untracked emissions propagate non-locally.
- **Testing burden**: Hard to isolate reactive flows without full system context.
- **Control inversion**: Callers lose knowledge of downstream effects.

### If Reactive Kept at Boundary

- **High observability**: External events flow into explicit handlers.
- **Testability**: Services are composable, mockable, linear.
- **Flow clarity**: Data movement is sequenced, not emergent.
- **Maintainability**: Changes localize to adapters or orchestration layers.

---

## Summary Decision Table

| Context                        | Reactive? | Justification                       |
| ------------------------------ | --------- | ----------------------------------- |
| UI event handling              | Yes       | Multiple listeners, async source    |
| WebSocket message stream       | Yes       | Continuous, unordered input         |
| Service-to-service call        | No        | Deterministic, imperative preferred |
| Orchestration logic            | No        | Requires clear, sequential control  |
| In-process data transformation | No        | Use functions or pipelines          |
| External adapter integration   | Yes       | Boundary condition, encapsulated    |
| Core domain logic              | No        | Must remain testable, pure          |

---

## Final Principle

**Reactive constructs are architectural side-effects.** Use them only where uncertainty originates. Services injected via DI should form a directed, ordered, and traceable graph. Core logic must remain procedurally explicit. Reintroducing reactivity downstream is an anti-pattern masquerading as abstraction.

Never enough.
