# @tdi2/di-testing - Spring Boot Style Mock API

### ✅ **NEW Clean APIs**

#### 1. **@MockBean Decorator** 
```typescript
@MockBean({ token: "UserService" })
userService!: MockedService<UserService>;
```

#### 2. **Fluent Mock API** (Mockito/Spring Boot style)
```typescript
userService
  .when('getUser').thenReturn({ id: '1', name: 'John' })
  .when('updateUser').thenReturn(undefined)
  .when('deleteUser').thenThrow(new Error('Access denied'));
```

#### 3. **Spring Boot Style Verification**
```typescript
verify(userService, 'getUser').once();
verify(userService, 'updateUser').withArgs('123', 'New Name');
verify(userService, 'deleteUser').never();
verifyNoInteractions(emailService);
```

#### 4. **@TestContext Decorator** 
```typescript
@TestContext({ isolateTest: true, autoReset: true })
class MyTests {
  @MockBean() userService!: MockedService<UserService>;
  // ...
}
```

### 📊 **Dramatic Improvement**

| Old API | New API |
|---------|---------|
| **15+ lines** setup | **3 lines** setup |
| Manual `createMock()` | `@MockBean` decorator |
| Pre-defined mock objects | Fluent `when().then()` |
| Manual assertions | `verify()` API |
| **Clunky** ❌ | **Spring Boot-like** ✅ |

### 🚀 **Usage Examples**

#### Before (Clunky)
```typescript
let testContext: TestContext;

beforeEach(() => {
  testContext = setupTest({ /* complex setup */ });
});

it("should work", () => {
  const mock = createMock<UserService>("UserService", {
    getUser: () => ({ id: "1", name: "Mock" })
  });
  testContext.mockService("UserService", mock);
  // ...
});
```

#### After (Clean)
```typescript
@TestContext()
class Tests {
  @MockBean() userService!: MockedService<UserService>;
}

it("should work", () => {
  const test = createTestInstance(Tests);
  test.userService.when('getUser').thenReturn({ id: "1", name: "Mock" });
  // ... business logic
  verify(test.userService, 'getUser').once();
});
```

### 🛠 **Advanced Features**

- **Dynamic callbacks**: `when('method').thenCall((arg) => arg * 2)`
- **Error throwing**: `when('method').thenThrow(new Error('Fail'))`
- **Call history tracking**: `service.getCallHistory()`
- **Comprehensive verification**: `times(3)`, `atLeast(1)`, `withArgs(...)`
- **Auto-reset between tests**: Configured via `@TestContext`

## 🏆 **Result**

The testing experience went from **clunky and verbose** to **clean and Spring Boot-like**. The new API:

- ✅ **Eliminates setup boilerplate** 
- ✅ **Provides fluent mock configuration**
- ✅ **Offers Spring Boot-style verification**
- ✅ **Maintains type safety**
- ✅ **Supports all advanced mocking patterns**

This is exactly what Spring Boot developers expect when testing with @MockBean! 🎉