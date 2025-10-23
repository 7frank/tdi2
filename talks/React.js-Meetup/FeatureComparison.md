| Framework                 | Interface-Based Injection     | Autowiring                      | Reactivity Built-In           | Transparent State Injection      | Decorator Support | Compile-Time Safety                | React Integration Quality                  | SSR Support | Maintenance / Maturity               | Architecture Cleanliness                                       |
| ------------------------- | ----------------------------- | ------------------------------- | ----------------------------- | -------------------------------- | ----------------- | ---------------------------------- | ------------------------------------------ | ----------- | ------------------------------------ | -------------------------------------------------------------- |
| **RSI / TDI2**            | Yes (type + metadata)         | Yes (constructor, property)     | Yes (Valtio under the hood)   | **Yes** (no manual hook)         | Yes               | Partial (Vite plugin)              | Excellent (React-native, zero boilerplate) | No          | Active / experimental                | **Very high** — service-centric, clean separation, reactive DI |
| **Obsidian (Wix)**        | No (class or graph keys only) | Yes (graph provider resolution) | Yes (custom observable layer) | Partial (requires `useObserver`) | Yes               | Partial                            | High (React + React Native)                | Yes         | Active / maintained                  | High — modular DI graph, opt-in reactivity                     |
| **Deepkit Injector**      | **Yes** (true interface DI)   | Yes (type-driven reflection)    | No (reactivity external)      | No                               | Optional          | **Strong compile-time validation** | Medium (React adapter exists)              | Yes         | Active / stable                      | **Very high** — type-first, strict, low runtime cost           |
| **InversifyJS (+ React)** | Yes (token/symbol)            | Yes                             | No                            | No                               | Yes               | Partial (runtime reflection)       | Medium (community adapters)                | Yes         | Mature / widely used                 | Medium — heavy boilerplate, strong separation                  |
| **TSyringe (+ React)**    | Yes (token/symbol/class)      | Yes                             | No                            | No                               | Yes               | Partial                            | Medium (light React glue)                  | Yes         | Mature / stable                      | Medium-high — simple, lightweight DI                           |
| **TypeDI (+ React)**      | Yes (Token<T>)                | Yes                             | No                            | No                               | Yes               | Partial                            | Medium                                     | Partial     | Moderate / somewhat slow maintenance | Medium — clean API but weaker ecosystem                        |
| **Awilix (+ React)**      | No (tokens or names only)     | Yes                             | No                            | No                               | No                | None (dynamic container)           | Medium (via Context adapters)              | Yes         | Mature / very stable                 | Medium — clear container pattern, no compile checks            |
| **react-ioc**             | Partial (token-style)         | Yes                             | No                            | No                               | No                | None                               | High (idiomatic hook use)                  | Yes         | Semi-maintained                      | Medium-high — minimal ceremony, not full DI                    |
| **react-magnetic-di**     | N/A                           | No                              | No                            | No                               | No                | N/A                                | High (for testing / Storybook)             | Yes         | Active                               | Low — compile-time dependency swapping only                    |

**Summary hierarchy (architectural cleanliness + React DX):**

1. **RSI / TDI2** – most transparent DI and reactivity; combines Angular-like service architecture with React idioms.
2. **Deepkit Injector** – cleanest type-driven architecture; strongest compile-time guarantees; reactivity external.
3. **Obsidian** – integrated reactivity; React-native friendly; slightly less strict typing.
4. **TSyringe / TypeDI** – solid decorator-based DI; ergonomic but less React-aware.
5. **InversifyJS** – powerful but verbose and reflection-heavy.
6. **Awilix** – dynamic, predictable, low-ceremony container; lacks interface typing.
7. **react-ioc** – minimal contextual DI; pragmatic but not full-featured.
8. **react-magnetic-di** – testing-oriented, not architectural DI.

**Placement of Spring-Boot-like DI in React ecosystem:**

* Best fit: enterprise dashboards, large microfrontend systems, design systems, state-dense collaborative tools—domains needing strict boundaries, service orchestration, or multiple data contexts.
* Frameworks suited for that tier: **RSI/TDI2**, **Deepkit Injector**, **Obsidian**.
* Lower tiers remain better for small apps or libraries prioritizing simplicity over structure.
