# TDI for React: Summary and Framing (Reactive Edition)

## 1. Architectural Intent

TDI enforces **explicit boundaries** while remaining **natively reactive**.

- **Components** render declaratively.
- **Services** encapsulate logic and state, implemented as **reactive classes** (via Valtio `proxy`).
- **Dependency Injection** provides lifecycle and scoping.

---

## 2. Problem It Solves

React’s hook composition becomes brittle as shared or cross-cutting state expands.  
Symptoms:

- Prop-drilling and prop explosion
- Repeated effect logic
- Inconsistent synchronization across views

TDI isolates behavior in reactive services. Components stay simple renderers of observed state.

---

## 3. Conceptual Model

| Role                 | Responsibility                                                                 |
| -------------------- | ------------------------------------------------------------------------------ |
| **Reactive Service** | Class or object containing observable state and logic (Valtio-powered)         |
| **Component**        | Pure view consuming injected services; auto-updates when service state changes |
| **Container**        | Manages service instances, scopes, and dependencies                            |

---

## 4. Functional Contrast

- **React Standard:** local reasoning through hooks and props.
- **TDI:** architectural reasoning through reactive service objects; DI ensures controlled lifetimes.  
  Both remain reactive, but TDI externalizes state ownership and synchronization.

---

## 5. Trade-offs

**Gains**

- Zero glue code: reactivity handled by proxies, no manual subscriptions.
- Strong domain boundaries and shared state consistency.
- Lifecycle and dependency control through DI.
- Reduced boilerplate versus custom hook networks.

**Costs**

- Additional indirection layer (DI container + reactive proxy).
- Less transparent for React DevTools and profiler.
- Requires disciplined scoping for SSR and concurrency safety.

---

## 6. Integration Discipline

- Use **Valtio proxies** inside service classes; React components auto-subscribe through `useSnapshot`.
- Scope services per route, session, or request; avoid global singletons.
- Keep side effects inside services, not components.
- Treat components as _pure templates_—they render state, never own it.

---

## 7. Positioning Statement

### 1

TDI is **not anti-React** and **not anti-functional**.  
It **inverts emphasis**: from local hook composition to architectural service composition.  
The goal is **maintainability at scale**, not purity.

> “TDI trades a bit of React’s compositional freedom for predictable structure and long-term scalability.  
> It doesn’t replace React — it constrains it to behave architecturally.”


### 2


TDI is **not a rejection of React’s functional model**; it’s a structural refinement.  
It merges **reactive data flow** with **object-level architecture**.  
By using Valtio proxies, it retains React’s automatic rendering behavior while reinstating service-oriented design.

> “TDI combines React’s reactivity with classical architectural clarity.  
> Components render; services think. The glue code is gone, the boundaries remain.”

