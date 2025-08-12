# @tdi2/di-testing

Testing utilities for the TDI2 dependency injection framework, inspired by Spring Boot's testing capabilities.

## Installation

```bash
bun add -D @tdi2/di-testing
```

## Quick Start

```typescript
import { setupTest, teardownTest, createMock } from "@tdi2/di-testing";

// In your test
const testContext = setupTest({
  mocks: [{
    token: "UserService",
    implementation: createMock<UserService>("UserService", {
      getUser: (id) => ({ id, name: `Test User ${id}` })
    })
  }]
});

// Use the mocked service
const userService = testContext.container.resolve<UserService>("UserService");
const user = userService.getUser("123");

// Cleanup
teardownTest(testContext);
```

## Core Features

### TestContainer

Extended DI container with testing capabilities:

```typescript
import { TestContainer } from "@tdi2/di-testing";

const container = new TestContainer();

// Mock a service
container.mockService("UserService", mockImplementation);

// Restore original
container.restoreService("UserService");

// Reset all instances
container.reset();
```

### Setup/Teardown Utilities

```typescript
import { setupTest, teardownTest } from "@tdi2/di-testing";

// Setup with service overrides
const testContext = setupTest({
  mocks: [
    { token: "UserService", implementation: mockUserService },
    { token: "EmailService", implementation: mockEmailService }
  ],
  isolateTest: true // Each test gets fresh container (default)
});

// Cleanup after test
teardownTest(testContext);
```

### Mock Helpers

```typescript
import { createMock, createSpy } from "@tdi2/di-testing";

// Create a mock with partial implementation
const mockService = createMock<UserService>("UserService", {
  getUser: (id) => ({ id, name: "Mock User" })
});

// Create a spy that preserves original behavior
const spyService = createSpy(originalService, {
  getUser: (id) => ({ id, name: "Spied User" }) // Only override this method
});
```

### Decorators (Phase 2)

```typescript
import { MockService, TestConfig, TestBean } from "@tdi2/di-testing";

@MockService()
class MockUserService implements UserService {
  getUser(id: string) {
    return { id, name: `Mock ${id}` };
  }
}

@TestConfig()
class TestConfiguration {
  @TestBean("UserService")
  userService(): UserService {
    return new MockUserService();
  }
}
```

## Testing Patterns

### Unit Testing Services

```typescript
describe("UserService", () => {
  let testContext: TestContext;

  beforeEach(() => {
    testContext = setupTest({
      mocks: [{
        token: "DatabaseService",
        implementation: createMock<DatabaseService>("DatabaseService", {
          findUser: () => Promise.resolve({ id: "1", name: "Test" })
        })
      }]
    });
  });

  afterEach(() => {
    teardownTest(testContext);
  });

  it("should get user by id", async () => {
    const userService = testContext.container.resolve<UserService>("UserService");
    const user = await userService.getUser("1");
    expect(user.name).toBe("Test");
  });
});
```

### Integration Testing

```typescript
describe("User Management Flow", () => {
  it("should handle complete user workflow", () => {
    const testContext = setupTest({
      diMap: REAL_DI_CONFIG, // Use real services
      mocks: [
        // Only mock external dependencies
        { token: "EmailService", implementation: mockEmailService }
      ]
    });

    // Test with mostly real services, mocked externals
    const userService = testContext.container.resolve<UserService>("UserService");
    // ... test real business logic with mocked email
  });
});
```

### Component Testing with React

```typescript
import { setupComponentTest } from "@tdi2/di-testing";

describe("UserProfile Component", () => {
  it("should display user data", () => {
    const { container } = setupComponentTest({
      mocks: [{
        token: "UserService",
        implementation: createMock<UserService>("UserService", {
          getUser: () => ({ id: "1", name: "John" })
        })
      }]
    });

    // Render component with DI context
    // Component will receive mocked UserService
  });
});
```

## API Reference

### TestContainer

- `mockService<T>(token, implementation, scope?)` - Override a service
- `restoreService(token)` - Restore original implementation  
- `restoreAllServices()` - Restore all services
- `reset()` - Clear all instances
- `createTestScope()` - Create isolated test scope

### Test Utils

- `setupTest(options)` - Initialize test with mocks and config
- `teardownTest(context?)` - Cleanup test resources
- `createMock<T>(token, partial)` - Create mock implementation
- `createSpy<T>(original, overrides)` - Create spy with selective overrides
- `expectServiceRegistered(container, token)` - Assert service is registered
- `expectServiceMocked(container, token)` - Assert service is mocked

## Roadmap

- **Phase 1**: ✅ Core mocking and test utilities
- **Phase 2**: Test configuration system and profiles
- **Phase 3**: Enhanced spying and React integration