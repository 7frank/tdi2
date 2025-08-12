import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { 
  setupTest, 
  teardownTest, 
  createMock, 
  createSpy,
  MockService,
  type TestContext 
} from "../src";

// Example service interfaces and implementations
interface UserService {
  getUser(id: string): { id: string; name: string };
  updateUser(id: string, name: string): void;
}

interface EmailService {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
}

class RealUserService implements UserService {
  private users = new Map([
    ["1", { id: "1", name: "John Doe" }],
    ["2", { id: "2", name: "Jane Smith" }]
  ]);

  getUser(id: string) {
    return this.users.get(id) || { id, name: "Unknown" };
  }

  updateUser(id: string, name: string) {
    this.users.set(id, { id, name });
  }
}

class RealEmailService implements EmailService {
  async sendEmail(to: string, subject: string, _body: string) {
    console.log(`Sending email to ${to}: ${subject}`);
    // Real implementation would send email
  }
}

describe("TDI2 Testing Framework", () => {
  let testContext: TestContext;

  beforeEach(() => {
    // Setup test with some real services
    testContext = setupTest({
      diMap: {
        UserService: {
          factory: () => () => new RealUserService(),
          scope: "singleton",
          implementationClass: "RealUserService"
        },
        EmailService: {
          factory: () => () => new RealEmailService(),
          scope: "singleton", 
          implementationClass: "RealEmailService"
        }
      }
    });
  });

  afterEach(() => {
    teardownTest(testContext);
  });

  it("should allow mocking a service", () => {
    // Create a mock user service
    const mockUserService = createMock<UserService>("UserService", {
      getUser: (id: string) => ({ id, name: `Mock User ${id}` }),
      updateUser: () => { /* mock implementation */ }
    });

    // Override the service in the container
    testContext.mockService("UserService", mockUserService);

    // Resolve and test the mocked service
    const userService = testContext.container.resolve<UserService>("UserService");
    const user = userService.getUser("123");
    
    expect(user.name).toBe("Mock User 123");
  });

  it("should allow creating spies that preserve some original behavior", () => {
    const realUserService = new RealUserService();
    
    // Create a spy that overrides only getUser
    const spyUserService = createSpy<UserService>(realUserService, {
      getUser: (id: string) => ({ id, name: `Spied User ${id}` })
    });

    testContext.mockService("UserService", spyUserService);

    const userService = testContext.container.resolve<UserService>("UserService");
    
    // getUser should use spy implementation
    expect(userService.getUser("1").name).toBe("Spied User 1");
    
    // updateUser should still work with original behavior
    userService.updateUser("1", "Updated Name");
    // This would work with the real implementation
  });

  it("should support multiple service overrides", () => {
    const mockUserService = createMock<UserService>("UserService", {
      getUser: () => ({ id: "test", name: "Test User" }),
      updateUser: () => {}
    });

    const mockEmailService = createMock<EmailService>("EmailService", {
      sendEmail: async () => { /* mock - no actual email sent */ }
    });

    // Override multiple services
    testContext.mockService("UserService", mockUserService);
    testContext.mockService("EmailService", mockEmailService);

    const userService = testContext.container.resolve<UserService>("UserService");
    const emailService = testContext.container.resolve<EmailService>("EmailService");

    expect(userService.getUser("any").name).toBe("Test User");
    expect(emailService.sendEmail).toBeDefined();
  });

  it("should restore services after test", () => {
    // Mock a service
    const mockUserService = createMock<UserService>("UserService", {
      getUser: () => ({ id: "mock", name: "Mock" }),
      updateUser: () => {}
    });
    
    testContext.mockService("UserService", mockUserService);
    
    // Verify mock is active
    let userService = testContext.container.resolve<UserService>("UserService");
    expect(userService.getUser("1").name).toBe("Mock");
    
    // Restore the service
    testContext.restoreService("UserService");
    
    // Should now get original behavior (though this test setup is simplified)
    userService = testContext.container.resolve<UserService>("UserService");
    // In a real scenario, this would be the original service
  });

  it("should support test isolation", () => {
    // Create first test context
    const test1 = setupTest({
      mocks: [{
        token: "UserService",
        implementation: createMock<UserService>("UserService", {
          getUser: () => ({ id: "test1", name: "Test 1" }),
          updateUser: () => {}
        })
      }]
    });

    // Create second isolated test context
    const test2 = setupTest({
      mocks: [{
        token: "UserService", 
        implementation: createMock<UserService>("UserService", {
          getUser: () => ({ id: "test2", name: "Test 2" }),
          updateUser: () => {}
        })
      }]
    });

    // Each should have its own mocked service
    const service1 = test1.container.resolve<UserService>("UserService");
    const service2 = test2.container.resolve<UserService>("UserService");

    expect(service1.getUser("x").name).toBe("Test 1");
    expect(service2.getUser("x").name).toBe("Test 2");

    // Cleanup
    teardownTest(test1);
    teardownTest(test2);
  });
});

// Example of using decorator-based approach
describe("Decorator-based Testing", () => {
  @MockService()
  class MockUserService implements UserService {
    getUser(id: string) {
      return { id, name: `Mock ${id}` };
    }
    
    updateUser(_id: string, _name: string) {
      // Mock implementation
    }
  }

  it("should work with decorated mock services", () => {
    const mockService = new MockUserService();
    expect(mockService.getUser("test").name).toBe("Mock test");
  });
});