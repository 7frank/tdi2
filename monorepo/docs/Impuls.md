# Timeline of React Dependency Injection Exploration

## 2019 — Initial Concept

- Explored the idea: "What if React supported dependency injection?"
- Used [AST Explorer](https://astexplorer.net/) to test feasibility
- Confirmed a Babel-based implementation was viable
- Concept was shelved without further pursuit

## 2021 — Critique of React Hooks

- Delivered public talks criticizing React Hooks
  - Argued Hooks encourage tight coupling and violate SOLID principles
- Proposed strategies to decouple logic
  - Applied SOLID principles to React design patterns

## February 2023 — Spring Boot–Style Autowiring PoC

- Revisited the concept using autowiring techniques
- Built [TDI (Typed Dependency Injection)](https://github.com/7frank/tdi)
  - Created a basic proof of concept for [Spring Boot like @Autowiring](https://www.baeldung.com/spring-autowire)
  - Focus on Classes and Interface 

## June 2025 — Return with TDI2

- Returned to the React ecosystem after time with Svelte
- Noted recurring structural issues in large-scale React projects
- Discovered [this article](https://dev.to/9zemian5/typescript-deserves-a-better-dependency-injection-framework-29bp) that took my previous attempt a step further
- Reassessed React's compatibility with DI
- Released [TDI2](https://github.com/7frank/tdi2)
  - Delivered a more refined, production-ready DI solution **TBA**
