# Features

Looking at our system from a Spring Boot perspective, we are focusing on implementing the more often used decorators.
We believe that feature wise a production ready system can be achieved with the following:

## Core Features

> package `@tdi2/di-core`

| Feature            | Description                    | Implementation Status | Note                                                                                                                                                      |
| ------------------ | ------------------------------ | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| @Service/Component | Service registration decorator | ✅                    |                                                                                                                                                           |
| @Inject            | Dependency injection decorator | ✅                    | Decorator for classes and Marker Interface for Functional Components                                                                                      |
| @Qualifier         | Qualifier for disambiguation   | ✅                    | Currently not planned. Instead create generic interface LoggerInterface\<T> with marker type Otel\|Console={} and use "implements LoggerInterface\<Otel>" |
| @Scope             | Scope management               | ✅                    | Spring Boot style: `@Service @Scope("singleton\|transient")`. Separate decorators follow separation of concerns                                           |
| @Value             | Value injection                | ✅                    | Currently not planned. Instead for env variables better create ApplicationConfig interface and import where necessary                                     |

### @Scope Usage Examples (Spring Boot Convention)

```typescript
// Singleton service (default)
@Service()
class DatabaseConnection {}

// Explicit singleton
@Service()
@Scope("singleton")
class ConfigService {}

// Transient service (new instance each time)
@Service()
@Scope("transient")
class RequestLogger {}
```

## Configuration

| Feature        | Description                   | Implementation Status | Note |
| -------------- | ----------------------------- | --------------------- | ---- |
| @Configuration | Configuration class decorator | ❌                    |      |
| @Bean          | Bean definition decorator     | ❌                    |      |

## Environment Management

| Feature  | Description              | Implementation Status | Note                            |
| -------- | ------------------------ | --------------------- | ------------------------------- |
| @Profile | Profile-based activation | ❌                    | e.g. dev, prod,test,integration |

## Lifecycle Management

| Feature        | Description                      | Implementation Status | Note                                                                                                                                    |
| -------------- | -------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| @PostConstruct | Post-construction lifecycle hook | ✅                    | compare to angular onInit/onDestroy frist to find out what we actually expect from lifecycle to implement it correct in the first place |
| @PreDestroy    | Pre-destruction lifecycle hook   | ✅                    | TBD TC39 vs Angular Style                                                                                                               |
| @onMount       | controller style hook            | ✅                    |                                                                                                                                         |
| @onUnMount     | controller style hook            | ✅                    |                                                                                                                                         |

## Testing

> package `@tdi2/di-testing`

| Feature   | Description           | Implementation Status | Note |
| --------- | --------------------- | --------------------- | ---- |
| @DiTest   | DI testing framework  | ✅                    |      |
| @MockBean | Mock bean for testing | ✅                    |      |

##

Based on my analysis of the Features.md file and the existing codebase, here's my categorization of the unimplemented features
from a TypeScript perspective:

🟢 Low Hanging Fruits (Easy to Implement)

-

🟡 Medium Complexity

4. @Configuration

- Why medium: Requires new class processing pattern
- Implementation: Classes that define @Bean methods instead of service classes
- TypeScript complexity: Moderate - needs method metadata extraction and factory generation

5. @Bean

- Why medium: Method-level decorators for external class registration
- Implementation: Process @Configuration class methods, generate factories
- TypeScript complexity: Moderate - method return type inference, dependency injection into factory methods

6. @Profile ✅ Already implemented in decorators but needs runtime support

- Why medium: Decorator exists but needs environment-aware container logic
- Implementation: Runtime profile filtering during service registration
- TypeScript complexity: Moderate - environment configuration and service filtering

> @Profile(string|string[]) (KISS)

> Next phase: 4. @Configuration + @Bean (enables external library integration) 5. Complete @Profile runtime support

(out of scope) Advanced features (if needed): 6. Advanced scoping scenarios 7. Complex profile conditions

🔧 Technical Implementation Notes

- Most decorators already have basic metadata collection
- Main work is in container.ts to respect the metadata
- Interface resolution system is already sophisticated
- Vite plugin transformation pipeline can handle the compile-time aspects

The architecture is well-positioned for these additions since the metadata collection and transformation pipeline
infrastructure already exists.
