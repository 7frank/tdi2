# Deepkit Injector Example

[App.tsx](./src/App.tsx)

This example demonstrates Deepkit's dependency injection with TypeScript reflection. Services are registered in a `ServiceContainer` and injected directly into component function parameters using TypeScript's type information. The Deepkit type compiler enables runtime type metadata without decorators or manual registration, allowing for clean dependency injection through function signatures. This approach provides strong typing and automatic dependency resolution while keeping components decoupled from service instantiation.

Note: besides this one example https://github.com/marcj/typescript-react-dependency-injection deepkit injector doesnt seem to be used widely in react applications rather in backend code
