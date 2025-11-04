import { describe, it, expect, beforeEach } from 'vitest';

// Import services from both packages
import { LoggerService, type LoggerInterface } from '../fixtures/package-a/LoggerService';
import { UserService, type UserServiceInterface } from '../fixtures/package-b/UserService';

describe('Cross-Package Service Resolution', () => {
  let loggerService: LoggerInterface;
  let userService: UserServiceInterface;

  beforeEach(() => {
    // Create fresh instances for each test
    loggerService = new LoggerService();
    userService = new UserService(loggerService);
  });

  describe('Package A - LoggerService', () => {
    it('should create LoggerService instance', () => {
      expect(loggerService).toBeDefined();
      expect(loggerService.state).toBeDefined();
      expect(Array.isArray(loggerService.state.logs)).toBe(true);
    });

    it('should log messages', () => {
      // Clear existing logs first (UserService logs during init)
      const initialCount = loggerService.state.logs.length;

      loggerService.log('Test message');

      expect(loggerService.state.logs).toHaveLength(initialCount + 1);
      expect(loggerService.state.logs[loggerService.state.logs.length - 1]).toContain('Test message');
    });

    it('should get all logs', () => {
      const initialCount = loggerService.state.logs.length;

      loggerService.log('Message 1');
      loggerService.log('Message 2');

      const logs = loggerService.getLogs();
      expect(logs).toHaveLength(initialCount + 2);
    });
  });

  describe('Package B - UserService with LoggerInterface dependency', () => {
    it('should create UserService with LoggerInterface from Package A', () => {
      expect(userService).toBeDefined();
      expect(userService.state).toBeDefined();
      expect(userService.state.users).toEqual([]);
    });

    it('should log during initialization', () => {
      // UserService constructor should log
      expect(loggerService.state.logs.length).toBeGreaterThan(0);
      expect(loggerService.state.logs[0]).toContain('UserService initialized');
    });

    it('should add users and log via LoggerInterface', () => {
      const initialLogCount = loggerService.state.logs.length;

      userService.addUser('Alice');

      // Verify user was added
      expect(userService.state.users).toHaveLength(1);
      expect(userService.state.users[0]).toEqual({ id: 1, name: 'Alice' });

      // Verify logger was called
      expect(loggerService.state.logs.length).toBe(initialLogCount + 1);
      expect(loggerService.state.logs[loggerService.state.logs.length - 1]).toContain('User added: Alice');
    });

    it('should get users and log via LoggerInterface', () => {
      userService.addUser('Bob');
      const initialLogCount = loggerService.state.logs.length;

      const users = userService.getUsers();

      // Verify users returned
      expect(users).toHaveLength(1);
      expect(users[0].name).toBe('Bob');

      // Verify logger was called
      expect(loggerService.state.logs.length).toBe(initialLogCount + 1);
      expect(loggerService.state.logs[loggerService.state.logs.length - 1]).toContain('Fetching 1 users');
    });

    it('should handle multiple users with cross-package logging', () => {
      userService.addUser('Charlie');
      userService.addUser('Dave');
      userService.addUser('Eve');

      // Verify all users added
      expect(userService.state.users).toHaveLength(3);

      // Verify all additions were logged
      const logs = loggerService.getLogs();
      const addLogs = logs.filter(log => log.includes('User added'));
      expect(addLogs).toHaveLength(3);
    });
  });

  describe('Cross-Package Integration', () => {
    it('should demonstrate interface-based dependency from Package B to Package A', () => {
      // This test validates that:
      // 1. Package B can import LoggerInterface from Package A
      // 2. Package B service can depend on Package A interface
      // 3. Actual implementation is properly injected

      const initialLogs = loggerService.state.logs.length;

      // Perform operations in Package B
      userService.addUser('Integration Test User');
      const users = userService.getUsers();

      // Verify Package B functionality works
      expect(users).toHaveLength(1);

      // Verify Package A interface was used (2 new logs: add + get)
      expect(loggerService.state.logs.length).toBe(initialLogs + 2);
    });

    it('should share state between services across packages', () => {
      // Clear logs
      loggerService.state.logs = [];

      // Add users
      userService.addUser('User 1');
      userService.addUser('User 2');

      // Verify shared state
      expect(userService.state.users).toHaveLength(2);
      expect(loggerService.state.logs).toHaveLength(2);

      // Both logs should reference the adds
      expect(loggerService.state.logs.every(log => log.includes('User added'))).toBe(true);
    });
  });
});
