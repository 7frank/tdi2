/**
 * @fileoverview Pure Service-Level Testing with TDI2 (No React)
 * 
 * This test file demonstrates how to test business services and their interactions
 * using TDI2's testing framework without React components. It focuses on testing
 * business logic, service orchestration, and dependency interactions at the pure
 * service layer.
 * 
 * ## When to Use This Testing Pattern
 * 
 * Use pure service-level testing when:
 * 
 * 1. **Business Logic Testing**: Testing core business services that contain domain
 *    logic, validation, and business rules independent of UI
 * 
 * 2. **Service Orchestration**: Testing services that coordinate multiple other
 *    services to complete complex business operations
 * 
 * 3. **Integration Logic**: Verifying that services correctly integrate with external
 *    dependencies (databases, APIs, message queues, etc.)
 * 
 * 4. **Domain-Driven Design**: Testing domain services, aggregates, and business
 *    workflows in isolation from presentation layers
 * 
 * 5. **Enterprise Architecture**: Testing the service layer in multi-layer applications
 *    where business logic is separated from UI concerns
 * 
 * ## What This Tests vs Other Testing Approaches
 * 
 * **Pure Service Testing** (This approach):
 * - Tests business logic without UI dependencies  
 * - Verifies service-to-service interactions and call sequences
 * - Focuses on business rules, validation, and domain workflows
 * - Fast execution with precise dependency control
 * - Clear separation of concerns between business and presentation logic
 * 
 * **Component Service Testing** (react-component-service-testing.test.tsx):
 * - Tests React components that use service injection
 * - Combines UI rendering with service interaction testing
 * - Focuses on component orchestration of services
 * 
 * **Unit Testing** (Traditional):
 * - Tests individual methods in isolation
 * - Often requires extensive mocking setup
 * - May miss integration issues between services
 * 
 * ## Key Benefits of This Approach
 * 
 * - **Business Logic Focus**: Tests pure business functionality without UI complexity
 * - **Interaction Verification**: Precise tracking of service method calls and parameters
 * - **Deterministic Dependencies**: All external services are controlled via mocks
 * - **Fast Feedback**: No DOM rendering, network calls, or heavy framework overhead
 * - **Enterprise Pattern**: Familiar testing style for backend/enterprise developers
 * - **Clear Architecture**: Enforces separation between business logic and presentation
 * 
 * ## TDI2 Testing Framework Features Demonstrated
 * 
 * - `@TestContext`: Organizes test dependencies with automatic reset between tests
 * - `@MockBean`: Creates type-safe mocks for service dependencies
 * - `MockedService<T>`: Fluent API for setting up mock behavior and responses
 * - `verify()`: Spring Boot-style verification of service interactions
 * - `verifyNoInteractions()`: Ensures services are not called when they shouldn't be
 * - `createTestInstance()`: Instantiates test context with dependency injection
 * - Callback-based mocking with `thenCall()` for complex scenarios
 * 
 * ## Testing Patterns Shown
 * 
 * - **Happy Path Testing**: Normal business flow with expected inputs/outputs
 * - **Error Handling**: Service failures and exception propagation
 * - **Conditional Logic**: Business rules that affect service call patterns
 * - **Interaction Sequencing**: Verifying services are called in correct order
 * - **Partial Execution**: Testing rollback and cleanup scenarios
 * 
 * Use this pattern for testing the core business logic layer of your application.
 * Combine with integration tests for full end-to-end coverage.
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { 
  MockBean, 
  TestContext, 
  createTestInstance,
  createMockedService,
  verify,
  verifyNoInteractions
} from "../src";
import type { MockedService } from "../src";

// Example service interfaces
interface UserService {
  getUser(id: string): { id: string; name: string };
  updateUser(id: string, name: string): void;
  deleteUser(id: string): boolean;
}

interface EmailService {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
  sendWelcomeEmail(userId: string): Promise<void>;
}

interface NotificationService {
  notify(message: string): void;
}

// Example business service that uses the above
class UserManagementService {
  constructor(
    private userService: UserService,
    private emailService: EmailService,
    private notificationService: NotificationService
  ) {}

  async createUser(name: string): Promise<{ id: string; name: string }> {
    const user = { id: Date.now().toString(), name };
    this.userService.updateUser(user.id, name);
    await this.emailService.sendWelcomeEmail(user.id);
    this.notificationService.notify(`User ${name} created`);
    return user;
  }

  async deleteUser(userId: string): Promise<boolean> {
    const user = this.userService.getUser(userId);
    if (!user) return false;
    
    const deleted = this.userService.deleteUser(userId);
    if (deleted) {
      await this.emailService.sendEmail(
        'admin@company.com', 
        'User Deleted', 
        `User ${user.name} was deleted`
      );
      this.notificationService.notify(`User ${user.name} deleted`);
    }
    return deleted;
  }
}

describe("Clean API Example - Spring Boot Style", () => {

  @TestContext({ isolateTest: true, autoReset: true })
  class UserManagementTests {
    @MockBean()
    userService!: MockedService<UserService>;

    @MockBean()
    emailService!: MockedService<EmailService>;

    @MockBean()
    notificationService!: MockedService<NotificationService>;

    // Business service under test
    userManagementService!: UserManagementService;

    setup() {
      // This would normally be injected by the DI container
      this.userManagementService = new UserManagementService(
        this.userService as any,
        this.emailService as any,
        this.notificationService as any
      );
    }
  }

  let testInstance: UserManagementTests & { __testContext: any };

  beforeEach(() => {
    testInstance = createTestInstance(UserManagementTests);
    testInstance.setup();
  });

  it("should create user with proper service interactions", async () => {
    // Arrange - Setup mock behaviors using the new __mock__ API
    testInstance.userService.__mock__
      .when('getUser').thenReturn({ id: '123', name: 'John Doe' })
      .when('updateUser').thenReturn(undefined);

    testInstance.emailService.__mock__
      .when('sendWelcomeEmail').thenReturn(Promise.resolve());

    testInstance.notificationService.__mock__
      .when('notify').thenReturn(undefined);

    // Act
    const result = await testInstance.userManagementService.createUser('John Doe');

    // Assert
    expect(result.name).toBe('John Doe');

    // Verify interactions using Spring Boot-style verification
    verify(testInstance.userService, 'updateUser').once();
    verify(testInstance.emailService, 'sendWelcomeEmail').once();
    verify(testInstance.notificationService, 'notify').withArgs('User John Doe created');
  });

  it("should handle user deletion with email notification", async () => {
    // Arrange
    const userId = '123';
    const userData = { id: userId, name: 'John Doe' };

    testInstance.userService.__mock__
      .when('getUser').thenReturn(userData)
      .when('deleteUser').thenReturn(true);

    testInstance.emailService.__mock__
      .when('sendEmail').thenReturn(Promise.resolve());

    testInstance.notificationService.__mock__
      .when('notify').thenReturn(undefined);

    // Act
    const result = await testInstance.userManagementService.deleteUser(userId);

    // Assert
    expect(result).toBe(true);

    // Verify complex interactions
    verify(testInstance.userService, 'getUser').withArgs(userId);
    verify(testInstance.userService, 'deleteUser').withArgs(userId);
    verify(testInstance.emailService, 'sendEmail')
      .withArgs('admin@company.com', 'User Deleted', 'User John Doe was deleted');
    verify(testInstance.notificationService, 'notify')
      .withArgs('User John Doe deleted');
  });

  it("should handle user not found scenario", async () => {
    // Arrange
    testInstance.userService.__mock__
      .when('getUser').thenReturn(null)
      .when('deleteUser').thenReturn(false);

    // Act
    const result = await testInstance.userManagementService.deleteUser('nonexistent');

    // Assert
    expect(result).toBe(false);

    // Verify no email or notification sent
    verifyNoInteractions(testInstance.emailService);
    verifyNoInteractions(testInstance.notificationService);
    verify(testInstance.userService, 'deleteUser').never();
  });

  it("should handle email service failures gracefully", async () => {
    // Arrange
    testInstance.userService.__mock__
      .when('updateUser').thenReturn(undefined);

    testInstance.emailService.__mock__
      .when('sendWelcomeEmail').thenThrow(new Error('Email service down'));

    testInstance.notificationService.__mock__
      .when('notify').thenReturn(undefined);

    // Act & Assert
    await expect(
      testInstance.userManagementService.createUser('John Doe')
    ).rejects.toThrow('Email service down');

    // Verify partial execution
    verify(testInstance.userService, 'updateUser').once();
    verify(testInstance.emailService, 'sendWelcomeEmail').once();
    // Notification should not be called due to email failure
    verify(testInstance.notificationService, 'notify').never();
  });

  it("demonstrates fluent mock API with callbacks", async () => {
    // Arrange with callback-based mock
    let capturedUserId: string = '';
    
    testInstance.userService.__mock__
      .when('updateUser').thenCall((id: string, name: string) => {
        capturedUserId = id;
        console.log(`Updating user ${id} with name ${name}`);
      });

    testInstance.emailService.__mock__
      .when('sendWelcomeEmail').thenReturn(Promise.resolve());

    testInstance.notificationService.__mock__
      .when('notify').thenReturn(undefined);

    // Act
    await testInstance.userManagementService.createUser('Jane Smith');

    // Assert
    expect(capturedUserId).toBeTruthy();
    verify(testInstance.userService, 'updateUser').once();
  });
});

describe("Manual Mock API Usage", () => {
  it("demonstrates direct mock usage without decorators", () => {
    // Create mock manually using the new API
    const mockUserService = createMockedService<UserService>(null as any, 'UserService');
    
    // Setup behavior
    mockUserService.__mock__
      .when('getUser').thenReturn({ id: '1', name: 'Test User' })
      .when('updateUser').thenReturn(undefined);

    // Use the mock - now works with TypeScript!
    const user = mockUserService.getUser('1');
    expect(user.name).toBe('Test User');

    mockUserService.updateUser('1', 'Updated Name');

    // Verify
    verify(mockUserService, 'getUser').once();
    verify(mockUserService, 'updateUser').withArgs('1', 'Updated Name');
  });
});