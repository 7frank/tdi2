# Features

Looking at Spring Boot we are focusing on implementing the more often used decorators.
We believe that feature wise a production ready system can be achieved with the following:

## Core Features

| Feature            | Description                    | Implementation Status | Note                                                                                                                                                      |
| ------------------ | ------------------------------ | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| @Service/Component | Service registration decorator | ✅                    |                                                                                                                                                           |
| @Inject            | Dependency injection decorator | ✅                    |                                                                                                                                                           |
| @Qualifier         | Qualifier for disambiguation   | ✅                    | Currently not planned. Instead create generic interface LoggerInterface\<T> with marker type Otel\|Console={} and use "implements LoggerInterface\<Otel>" |
| @Scope             | Scope management               | ❌                    |                                                                                                                                                           |
| @Value             | Value injection                | ✅                    | Currently not planned. Instead for env variables better create ApplicationConfig interface and import where necessary                                     |

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

| Feature        | Description                      | Implementation Status | Note |
| -------------- | -------------------------------- | --------------------- | ---- |
| @PostConstruct | Post-construction lifecycle hook | ❌                    |      |
| @PreDestroy    | Pre-destruction lifecycle hook   | ❌                    |      |

## Testing

| Feature   | Description           | Implementation Status | Note |
| --------- | --------------------- | --------------------- | ---- |
| @DiTest   | DI testing framework  | ✅                    |      |
| @MockBean | Mock bean for testing | ✅                    |      |
