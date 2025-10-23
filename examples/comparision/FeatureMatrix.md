# Feature Matrix

A comparison of different state management and dependency injection approaches in React, focusing on separation of concerns and SOLID principles.

| Name | Repository / Documentation | Description | Decoupling | Autowiring | DI Type | Reactivity | Boilerplate | Dependency Tree Config |
|------|---------------------------|-------------|------------|------------|---------|------------|-------------|----------------------|
| **Vanilla State** | [React useState](https://react.dev/reference/react/useState) | Baseline React implementation using built-in hooks. Simple and direct, with all logic in the component. | 🔴 **Low** - Logic tightly coupled to component | N/A - No DI container | ❌ No DI | React Built-in (useState) | 🟢 **Minimal** (~16 LOC) | N/A - No container |
| **Context API** | [React Context](https://react.dev/reference/react/createContext) | Idiomatic React pattern for sharing state across components. Centralized state in Provider, accessed via custom hooks. | 🟡 **Medium** - State separated but still React-bound | ⚙️ **Manual** - Manual Provider setup | 🔑 **Token-based** - Context as token | React Built-in (Context + useState) | 🔴 **Heavy** (~65 LOC) | ⚙️ Manual - Provider/Context setup |
| **Zustand** | [zustand](https://github.com/pmndrs/zustand) | Lightweight state management with minimal boilerplate. Global store with automatic subscriptions, no providers needed. | 🟡 **Medium** - External store but logic in actions | ⚙️ **Manual** - Manual store creation | ❌ No DI - Direct imports | External Library (Proxy-based) | 🟡 **Moderate** (~46 LOC) | ⚙️ Manual - Store definition |
| **Redux Toolkit** | [@reduxjs/toolkit](https://redux-toolkit.js.org/) | Official Redux toolset with modern API. Centralized state with slices, reducers, and predictable updates via actions. | 🟡 **Medium** - Clear separation but framework-specific patterns | ⚙️ **Manual** - Manual store & slice configuration | ❌ No DI - Direct imports | External Library (Immer + subscriptions) | 🟡 **Moderate** (~42 LOC + store) | ⚙️ Manual - Slice + store config |
| **Deepkit Injector** | [@deepkit/injector](https://github.com/deepkit/deepkit-framework) | TypeScript reflection-based dependency injection. Services injected via function parameters using runtime type metadata, no decorators required. | 🟢 **High** - True DI with service classes, testable in isolation | 🔧 **Compile-time** - TypeScript types via `tsc` compiler | 🎯 **Type-based** - Class types as tokens | Manual Subscription | 🟢 **Minimal** (~15 LOC) | 🔧 Semi-Auto - Providers list, auto-injection |
| **TDI2** | [tdi2](https://github.com/7frank/tdi2) | Custom DI framework with reactive state management (Valtio). Business logic in service classes, components are pure templates. | 🟢 **High** - Full DI container, business logic fully separated | ⚙️ **Manual** - Manual container registration | 🎨 **Interface-based** - TypeScript interfaces | Framework Reactive (Valtio) | 🟢 **Minimal** (~20 LOC) | 🤖 Auto - `@Service()` decorator auto-registers |
| **React Obsidian** | [react-obsidian](https://github.com/wix-incubator/obsidian) | Decorator-based DI framework by Wix for React/React Native. Object Graphs with `@provides()` and built-in reactivity via `Observable` and `useObserver()`. | 🟢 **High** - True DI with Object Graphs, dependency inversion principle | 🔧 **Compile-time** - Decorators via SWC/Babel transformer | 🔑 **Token-based** - String keys in Graph | Framework Reactive (Observable) | 🟢 **Minimal** (~11 LOC) | ⚙️ Manual - `@provides()` methods in Graph |



## verify claims

Autowiring, tdi is i think the only framework that does this the otheer 2 do it differently we might need to make somechanges here

boilerplate: lets verfiy the claims with LOC  or remove the column and let the examples speak instead for themselfs

-compare what the 3 di solutions compilers are actually doing

- sort by how clean an architecture can be with the one or oth er approach if thatn makes sense, our pitch here is that we actually could provide the cleanest