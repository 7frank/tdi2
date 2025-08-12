# Spring Boot Style Testing API

## 🚀 **Usage Examples**

### **@MockBean with TypeScript Intelligence**

```typescript
@TestContext()
class MyTests {
  @MockBean() // ✅ No parameters needed - auto-detects interface!
  userService!: MockedService<UserServiceInterface>;

  @MockBean()
  emailService!: MockedService<EmailServiceInterface>;
}
```

### **Clean Mock Configuration**

```typescript
// ✅ NEW: Clear separation between service methods and mock methods
test.userService.__mock__
  .when("getUser")
  .thenReturn({ id: "123", name: "John" })
  .when("updateUser")
  .thenReturn(undefined)
  .when("deleteUser")
  .thenThrow(new Error("Access denied"));

// ✅ Service methods work naturally
const user = test.userService.getUser("123"); // TypeScript knows this returns user object
test.userService.updateUser("123", "New Name"); // TypeScript validates parameters

// ✅ Mock verification is clear
verify(test.userService, "getUser").once();
verify(test.userService, "updateUser").withArgs("123", "New Name");
```

### **Manual Mock Creation**

```typescript
// ✅ Create mocks manually when needed
const mockService = createMockedService<UserService>(null, "UserService");

mockService.__mock__.when("getUser").thenReturn({ id: "1", name: "Mock User" });

// ✅ Both service methods AND mock methods available
const user = mockService.getUser("1"); // Service interface
mockService.__mock__.verify("getUser").once(); // Mock utilities
```
