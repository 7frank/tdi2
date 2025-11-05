# React Obsidian DI Example

[App.tsx](./src/App.tsx)

This example demonstrates dependency injection using [react-obsidian](https://github.com/wix-incubator/obsidian), a DI framework for React and React Native applications developed by Wix.

## Key Concepts

- **Service Layer**: Business logic is encapsulated in [CounterService](./src/services/CounterService.ts)
- **Object Graph**: Dependencies are defined in [ApplicationGraph](./src/graph/ApplicationGraph.ts) using decorators (`@singleton()`, `@graph()`, `@provides()`)
- **Component Injection**: The [App](./src/App.tsx) component receives dependencies via `injectComponent()`, separating dependency construction from consumption
- **Type Safety**: Uses `DependenciesOf<>` utility for automatic type inference of injected dependencies

## Architecture

```
ApplicationGraph (@singleton @graph)
  └─ @provides counterService() → CounterService

AppComponent (injected component)
  └─ receives { counterService } as props from ApplicationGraph
  └─ manages local state and exposes increment, decrement, reset actions

App (exported)
  └─ injectComponent(AppComponent, ApplicationGraph)
```

## Build Configuration

This example uses Vite with SWC and the `swc-plugin-obsidian` transformer to support TypeScript decorators. The configuration enables:
- `experimentalDecorators: true` in TypeScript
- `tsDecorators: true` in Vite's React SWC plugin
- Parser decorators and plugin-first execution in SWC options

## Running

```bash
npm install
npm run dev
```
