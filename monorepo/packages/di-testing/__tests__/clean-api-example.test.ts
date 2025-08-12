import { describe, it, expect, beforeEach } from "bun:test";
import { 
  MockBean, 
  TestContext, 
  createTestInstance,
  MockedService,
  verify,
  verifyNoInteractions
} from "../src";

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
    // Arrange - Setup mock behaviors using fluent API
    testInstance.userService
      .when('getUser').thenReturn({ id: '123', name: 'John Doe' })
      .when('updateUser').thenReturn(undefined);

    testInstance.emailService
      .when('sendWelcomeEmail').thenReturn(Promise.resolve());

    testInstance.notificationService
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

    testInstance.userService
      .when('getUser').thenReturn(userData)
      .when('deleteUser').thenReturn(true);

    testInstance.emailService
      .when('sendEmail').thenReturn(Promise.resolve());

    testInstance.notificationService
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
    testInstance.userService
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
    testInstance.userService
      .when('updateUser').thenReturn(undefined);

    testInstance.emailService
      .when('sendWelcomeEmail').thenThrow(new Error('Email service down'));

    testInstance.notificationService
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
    
    testInstance.userService
      .when('updateUser').thenCall((id: string, name: string) => {
        capturedUserId = id;
        console.log(`Updating user ${id} with name ${name}`);
      });

    testInstance.emailService
      .when('sendWelcomeEmail').thenReturn(Promise.resolve());

    testInstance.notificationService
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
    // Create mock manually
    const mockUserService = new MockedService<UserService>(null as any, 'UserService');
    
    // Setup behavior
    mockUserService
      .when('getUser').thenReturn({ id: '1', name: 'Test User' })
      .when('updateUser').thenReturn(undefined);

    // Use the mock
    const user = mockUserService.getUser('1');
    expect(user.name).toBe('Test User');

    mockUserService.updateUser('1', 'Updated Name');

    // Verify
    verify(mockUserService, 'getUser').once();
    verify(mockUserService, 'updateUser').withArgs('1', 'Updated Name');
  });
});