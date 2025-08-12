# Spring Boot Style Testing API


## 🚀 NEW Clean API vs 😰 OLD Clunky API

### ❌ OLD Clunky Way (Before)

```typescript
describe("User Service Tests", () => {
  let testContext: TestContext;

  beforeEach(() => {
    testContext = setupTest({
      diMap: {
        UserService: {
          factory: () => () => new RealUserService(),
          scope: "singleton",
          dependencies: [],
          implementationClass: "RealUserService",
          isAutoResolved: false
        },
        EmailService: {
          factory: () => () => new RealEmailService(),
          scope: "singleton",
          dependencies: [],
          implementationClass: "RealEmailService", 
          isAutoResolved: false
        }
      }
    });
  });

  afterEach(() => {
    teardownTest(testContext);
  });

  it("should do something", () => {
    // Create mock manually
    const mockUserService = createMock<UserService>("UserService", {
      getUser: (id: string) => ({ id, name: `Mock User ${id}` }),
      updateUser: () => { /* mock implementation */ }
    });

    // Override the service in the container
    testContext.mockService("UserService", mockUserService);

    // Test...
    const userService = testContext.container.resolve<UserService>("UserService");
    const user = userService.getUser("123");
    expect(user.name).toBe("Mock User 123");
  });
});
```

### ✅ NEW Spring Boot Style (After)

```typescript
@TestContext({ isolateTest: true, autoReset: true })
class UserServiceTests {
  @MockBean({ token: "UserService" })
  userService!: MockedService<UserService>;

  @MockBean({ token: "EmailService" })
  emailService!: MockedService<EmailService>;

  businessService!: SomeBusinessService;

  setup() {
    this.businessService = new SomeBusinessService(
      this.userService as any,
      this.emailService as any
    );
  }
}

describe("Clean API Tests", () => {
  let test: UserServiceTests;

  beforeEach(() => {
    test = createTestInstance(UserServiceTests);
    test.setup();
  });

  it("should handle user operations", async () => {
    // 🎯 Clean fluent API
    test.userService
      .when('getUser').thenReturn({ id: '123', name: 'John' })
      .when('updateUser').thenReturn(undefined);

    test.emailService
      .when('sendEmail').thenReturn(Promise.resolve());

    // 💼 Run business logic
    await test.businessService.doSomething();

    // 🔍 Spring Boot style verification
    verify(test.userService, 'getUser').once();
    verify(test.emailService, 'sendEmail').withArgs('john@test.com', 'Welcome');
  });
});
```

## 🌟 Key Improvements

### 1. **@MockBean Decorator - Zero Configuration**
```typescript
// OLD: Manual mock creation + container registration
const mockService = createMock<UserService>("UserService", { ... });
testContext.mockService("UserService", mockService);

// NEW: One line declaration
@MockBean({ token: "UserService" })
userService!: MockedService<UserService>;
```

### 2. **Fluent Mock API - Mockito/Spring Style**
```typescript
// OLD: Pre-define all mock behavior
const mockService = createMock<UserService>("UserService", {
  getUser: (id) => ({ id, name: "Mock" }),
  updateUser: () => {}
});

// NEW: Fluent when().then() API
mockService
  .when('getUser').thenReturn({ id: '123', name: 'Mock' })
  .when('updateUser').thenReturn(undefined)
  .when('deleteUser').thenThrow(new Error('Not allowed'));
```

### 3. **Verification API - Spring Boot Style**
```typescript
// OLD: Manual assertion
expect(calls).toHaveLength(1);

// NEW: Fluent verification  
verify(mockService, 'getUser').once();
verify(mockService, 'updateUser').withArgs('123', 'New Name');
verify(mockService, 'deleteUser').never();
verifyNoInteractions(mockService);
```

### 4. **Test Class Organization**
```typescript
// OLD: Scattered setup in beforeEach
let testContext: TestContext;
let mockUserService: any;
let mockEmailService: any;

beforeEach(() => {
  testContext = setupTest({ /* complex config */ });
  mockUserService = createMock(...);
  // ... more setup
});

// NEW: Organized test class
@TestContext()
class MyTests {
  @MockBean() userService!: MockedService<UserService>;
  @MockBean() emailService!: MockedService<EmailService>;
  
  businessService!: BusinessService;
  
  setup() {
    this.businessService = new BusinessService(
      this.userService as any,
      this.emailService as any
    );
  }
}
```

## 🎯 Advanced Features

### Dynamic Mock Behavior
```typescript
// Conditional returns
mockService.when('getUser').thenCall((id: string) => {
  if (id === 'admin') return { id, name: 'Admin User', role: 'admin' };
  return { id, name: 'Regular User', role: 'user' };
});

// Throw errors
mockService.when('deleteUser').thenThrow(new Error('Access denied'));
```

### Comprehensive Verification
```typescript
// Call count verification
verify(mockService, 'getUser').times(3);
verify(mockService, 'updateUser').atLeast(1);
verify(mockService, 'deleteUser').atMost(2);

// Argument verification
verify(mockService, 'updateUser').withArgs('123', 'John Doe');

// No interactions
verifyNoInteractions(emailService);
```

### Call History & Debugging
```typescript
// Inspect all calls for debugging
const calls = mockService.getCallHistory();
console.log('All service calls:', calls);

// Reset mock state
reset(mockService);
```

## 🏆 Benefits Summary

| Aspect | OLD API | NEW API |
|--------|---------|---------|
| **Setup** | 15+ lines | 3 lines |
| **Mocking** | Manual object creation | `@MockBean` decorator |
| **Behavior** | Pre-defined objects | Fluent `when().then()` |
| **Verification** | Manual assertions | `verify()` API |
| **Readability** | Poor | Excellent |
| **Maintainability** | Difficult | Easy |
| **Spring Boot Similarity** | None | Very High |

## 🚀 Migration Guide

1. **Replace setupTest/teardownTest**:
   ```typescript
   // Before
   let testContext = setupTest({...});
   
   // After  
   @TestContext()
   class MyTests { ... }
   const test = createTestInstance(MyTests);
   ```

2. **Replace createMock with @MockBean**:
   ```typescript
   // Before
   const mock = createMock<Service>("Service", {...});
   
   // After
   @MockBean({ token: "Service" })
   service!: MockedService<Service>;
   ```

3. **Use fluent API for behavior**:
   ```typescript
   // Before
   const mock = createMock<Service>("Service", {
     method: () => "result"
   });
   
   // After
   service.when('method').thenReturn("result");
   ```

4. **Replace manual assertions with verify()**:
   ```typescript
   // Before
   expect(callCount).toBe(1);
   
   // After
   verify(service, 'method').once();
   ```

The new API transforms testing from a chore into a pleasant, productive experience! 🎉