# TDI2 with Reactive Services

This example demonstrates the TDI2 dependency injection framework combined with reactive state management (Valtio). Business logic is encapsulated in service classes decorated with `@Service()`, and components receive injected dependencies through the DI container. State changes are automatically tracked via proxies, allowing components to remain pure templates while all logic and state management happens in testable, decoupled services. 
