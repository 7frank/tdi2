# Timeline of React Dependency Injection Exploration

## 2019 — Initial Concept

- Thought experiment: "What if we could do React DI?"
- Explored via [AST Explorer](https://astexplorer.net/) — confirmed feasibility
- Babel-based implementation was possible
- Idea shelved, not pursued

## 2021 — Critique of React Hooks

- Public talks on how React Hooks are pathological
  - Hooks induce inward pull and tight coupling
  - Violate SOLID principles
- Proposed decoupling strategies
  - Applied SOLID principles to React design patterns

## February 2023 — Spring Boot–style Autowiring PoC

- Revisited the idea through autowiring
- Built [TDI (Typed Dependency Injection)](https://github.com/7frank/tdi)
  - Rough proof of concept
  - Applied DI container ideas to React

## June 2025 — Return with TDI2

- Brief return to React ecosystem after time in Svelte
- Conversations revealed persistent structural issues in React
  - High adoption, low design maturity in large projects
- Found [article](https://dev.to/9zemian5/typescript-deserves-a-better-dependency-injection-framework-29bp)
- Reinvestigated DI in React
- Released [TDI2](https://github.com/7frank/tdi2)
  - More refined, production-consumable DI solution
