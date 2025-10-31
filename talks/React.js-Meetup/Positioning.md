# TDI for React: Summary and Framing

## 1. Architectural Intent
TDI restores **clear boundaries**.  
- **Components** render.  
- **Services** own logic and state.  
- **Dependency Injection** wires them together.

---

## 2. Problem It Solves
React’s hook-based composition **degrades under scale**.  
When many components share synchronized state or cross-cutting behavior, symptoms appear:
- Prop-drilling
- Duplicated effect logic
- Hidden coupling between components

TDI resolves this by isolating logic in services and treating components as declarative surfaces.

---

## 3. Conceptual Model
| Role | Responsibility |
|------|----------------|
| **Service** | Domain module holding state and logic (class or object) |
| **Component** | Pure template consuming injected services |
| **Container** | Controls lifetimes and dependency wiring |

---

## 4. Functional Contrast
- **React:** prioritizes *local reasoning* — each component owns its state and effects.  
- **TDI:** prioritizes *architectural reasoning* — shared services manage state, components stay pure.

---

## 5. Trade-offs
**Gains**
- Stronger module boundaries  
- Shared state consistency  
- Explicit lifecycles  
- Simplified collaboration in large teams  

**Costs**
- Added indirection  
- Less React DevTools visibility  
- Manual reactivity bridging  
- Stricter rules for concurrency and SSR

---

## 6. Integration Discipline
- Services expose **observable data**, not raw mutable fields.  
- Components subscribe via a **thin adapter** (e.g. `useService`).  
- Scope services per **route**, **session**, or **request**, never global.  
- Place side effects inside services; keep components declarative.  

---

## 7. Positioning Statement
TDI is **not anti-React** and **not anti-functional**.  
It **inverts emphasis**: from local hook composition to architectural service composition.  
The goal is **maintainability at scale**, not purity.

> “TDI trades a bit of React’s compositional freedom for predictable structure and long-term scalability.  
> It doesn’t replace React — it constrains it to behave architecturally.”
