---
title: 'ADR-005: Spring Boot Decorator Conventions'
description: Why TDI2 follows Spring Boot decorator patterns instead of inventing new conventions.
---

# ADR-005: Spring Boot Decorator Conventions

**Status**: Active  
**Date**: 2024

## Context

TDI2 needed a decorator and lifecycle convention that would:
- **Minimize learning curve** for enterprise developers
- **Provide familiar patterns** from proven frameworks
- **Cover essential DI features** without over-engineering
- **Support both simple and complex use cases**

Enterprise teams often have developers with Spring Boot experience, and dependency injection patterns are well-established in the Java ecosystem.

## Decision

Adopt **Spring Boot decorator conventions** adapted for TypeScript/React:

- `@Service()` for service registration (equivalent to `@Service`, `@Component`)
- `@Inject()` for dependency injection (equivalent to `@Autowired`) 
- `@PostConstruct` for initialization lifecycle (equivalent to `@PostConstruct`)
- `@PreDestroy` for cleanup lifecycle (equivalent to `@PreDestroy`)
- `@Scope()` for service lifetime management (equivalent to `@Scope`)

## Implementation

```typescript
// Service registration - familiar to Spring Boot developers
@Service()
@Scope("singleton") // Default behavior, explicit for clarity
export class UserService implements UserServiceInterface {
  
  constructor(
    @Inject() private apiClient: ApiClientInterface,
    @Inject() private logger: LoggerInterface
  ) {}
  
  @PostConstruct
  async initialize() {
    // Called after all dependencies injected
    await this.apiClient.authenticate();
    this.logger.info('UserService initialized');
  }
  
  @PreDestroy
  async cleanup() {
    // Called before service destruction
    await this.apiClient.disconnect();
    this.logger.info('UserService destroyed');
  }
}

// Scope variations
@Service()
@Scope("transient") // New instance each injection
export class RequestLogger implements LoggerInterface {
  // Fresh instance per request/component
}
```

## Spring Boot Equivalence

| TDI2 | Spring Boot | Purpose |
|------|-------------|---------|
| `@Service()` | `@Service`, `@Component` | Mark class for DI registration |
| `@Inject()` | `@Autowired` | Mark dependency for injection |
| `@PostConstruct` | `@PostConstruct` | Initialization after injection |
| `@PreDestroy` | `@PreDestroy` | Cleanup before destruction |
| `@Scope("singleton")` | `@Scope("singleton")` | Single instance (default) |
| `@Scope("transient")` | `@Scope("prototype")` | New instance each time |

## Consequences

### Benefits
- **Reduced learning curve** - enterprise developers know these patterns
- **Proven conventions** - battle-tested in large-scale applications
- **Clear lifecycle model** - explicit initialization and cleanup phases
- **Familiar documentation** - can reference Spring Boot concepts and patterns
- **Enterprise credibility** - using established enterprise patterns builds trust

### Trade-offs
- **Java heritage** - some patterns may feel foreign to pure JavaScript developers
- **Decorator dependency** - requires TypeScript experimental decorators
- **Convention over configuration** - less flexibility than custom decorator schemes

## Alternatives Considered

1. **Angular DI conventions** - Rejected due to more complex token system
   ```typescript
   constructor(@Inject('USER_SERVICE') userService: UserService) // More verbose
   ```

2. **Custom TDI2 conventions** - Rejected due to learning curve for new patterns
   ```typescript
   @TDIService() @TDIInject() // New concepts to learn
   ```

3. **Minimal decorator set** - Rejected due to missing lifecycle management
   ```typescript
   @Service() // Only registration, no lifecycle hooks
   ```

The Spring Boot approach provides the right balance of familiarity, functionality, and enterprise acceptance for TDI2's target audience.