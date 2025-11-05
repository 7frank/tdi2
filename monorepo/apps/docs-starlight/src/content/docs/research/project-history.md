---
title: TDI2 Project History & Motivation
description: Timeline of React dependency injection exploration from initial concept to TDI2 release
sidebar:
  order: 4
---

Understanding TDI2's evolution provides context for its architectural decisions and the React ecosystem problems it addresses.

## Timeline of Development

### 2019 — Initial Concept
- **Vision**: "What if React supported dependency injection?"
- **Exploration**: Used [AST Explorer](https://astexplorer.net/) to test feasibility
- **Outcome**: Confirmed Babel-based implementation was viable
- **Status**: Concept shelved without further pursuit

### 2021 — React Hooks Critique
- **Public talks** criticizing React Hooks architectural patterns
- **Arguments**: Hooks encourage tight coupling and violate SOLID principles
- **Solutions proposed**: Strategies to decouple logic using SOLID principles
- **Focus**: Applied traditional software engineering principles to React design

### February 2023 — Spring Boot-Style Autowiring PoC
- **Concept revival**: Revisited dependency injection using autowiring techniques
- **Implementation**: Built [TDI (Typed Dependency Injection)](https://github.com/7frank/tdi)
- **Features**: Basic proof of concept for [Spring Boot-like @Autowiring](https://www.baeldung.com/spring-autowire)
- **Architecture**: Focus on Classes and Interface-based dependency resolution

### June 2025 — TDI2 Release
- **Context**: Returned to React ecosystem after working with Svelte
- **Observations**: Noted recurring structural issues in large-scale React projects
- **Inspiration**: Discovered [TypeScript dependency injection article](https://dev.to/9zemian5/typescript-deserves-a-better-dependency-injection-framework-29bp) that advanced previous concepts
- **Assessment**: Reassessed React's compatibility with enterprise DI patterns
- **Release**: [TDI2](https://github.com/7frank/tdi2) - More refined, production-ready DI solution

## Key Motivations

### Enterprise Architecture Gap
The React ecosystem lacked enterprise-grade architectural patterns that backend developers expect:
- **Dependency injection** for loose coupling
- **Service layer** for business logic separation
- **Interface-based programming** for testability
- **Lifecycle management** for resource cleanup

### Scaling Pain Points
Large React applications consistently suffered from:
- **Props drilling** through deep component hierarchies
- **State synchronization** complexity across features
- **Testing difficulties** due to tightly coupled components
- **Team coordination** issues from lack of clear boundaries

### Alternative Framework Insights
Experience with other frameworks highlighted React's limitations:
- **Angular's DI system** provided clear service boundaries
- **Spring Boot patterns** offered familiar enterprise architecture
- **Svelte's reactivity** showed simpler state management possibilities

## Philosophical Foundation

### SOLID Principles in React
TDI2 applies classic software engineering principles to React:

**Single Responsibility**: Services handle specific business concerns
```typescript
@Service()
export class UserAuthenticationService {
  // Only handles authentication logic
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    // Focused responsibility
  }
}
```

**Open/Closed**: Extend functionality without modifying existing code
```typescript
// Extend without modification
@Service()
export class ExtendedAuthService extends UserAuthenticationService {
  // New functionality without changing base class
}
```

**Liskov Substitution**: Interface-based programming enables substitution
```typescript
// Any implementation of UserServiceInterface can be substituted
function UserProfile({ userService }: { 
  userService: Inject<UserServiceInterface> 
}) {
  // Works with any UserServiceInterface implementation
}
```

**Interface Segregation**: Focused service contracts
```typescript
// Clients depend only on methods they use
interface UserDataInterface {
  getUserData(): UserData;
}

interface UserActionsInterface {
  updateUser(data: UserUpdate): Promise<void>;
}
```

**Dependency Inversion**: High-level modules depend on abstractions
```typescript
// High-level component depends on abstraction, not concrete implementation
function Dashboard({ 
  userService,    // UserServiceInterface abstraction
  dataService     // DataServiceInterface abstraction
}: ServiceProps) {
  // Implementation details handled by DI container
}
```

### React-Specific Innovations

**Component-Service Separation**: Clear boundaries between presentation and logic
- Components handle rendering and user interaction
- Services manage business logic and state
- Automatic state synchronization via reactive proxies

**Build-Time Optimization**: Compile-time dependency resolution
- Zero runtime dependency resolution overhead
- Type-safe interface-to-implementation mapping
- Automatic code transformation for clean syntax

**Enterprise Patterns**: Familiar patterns for scaling teams
- Repository pattern for data access
- Service layer for business logic
- Interface segregation for clear contracts
- Lifecycle management for resource cleanup

## Vision Achievement

TDI2 represents the culmination of years of experience with React's architectural limitations and enterprise development patterns. It bridges the gap between React's component model and the service-oriented architecture that enterprise applications require.

**Goal**: Transform React from component chaos to service-centric clarity
**Method**: Proven dependency injection patterns adapted for React
**Result**: Enterprise-grade architecture with familiar patterns for scaling teams

The project validates that React can support sophisticated architectural patterns without sacrificing its fundamental simplicity and developer experience.