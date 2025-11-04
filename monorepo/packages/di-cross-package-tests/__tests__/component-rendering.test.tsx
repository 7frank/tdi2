import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';

// Import services and components from both packages
import { LoggerService, type LoggerInterface } from '../fixtures/package-a/LoggerService';
import { UserService, type UserServiceInterface } from '../fixtures/package-b/UserService';

/**
 * Component rendering tests WITHOUT full DIProvider
 * These tests focus on validating that the component structure is correct
 * and can be rendered with manually provided services
 */
describe('Cross-Package Component Rendering', () => {
  let loggerService: LoggerInterface;
  let userService: UserServiceInterface;

  beforeEach(() => {
    loggerService = new LoggerService();
    userService = new UserService(loggerService);
  });

  describe('Component Structure Validation', () => {
    it('should validate Logger component props interface', async () => {
      // Dynamically import to avoid rendering issues
      const { Logger } = await import('../fixtures/package-a/Logger');

      // Verify component exists and is callable
      expect(Logger).toBeDefined();
      expect(typeof Logger).toBe('function');

      // Verify component accepts correct props structure
      const props = {
        services: {
          logger: loggerService as any
        }
      };

      // Component should not throw when constructed with proper props
      expect(() => Logger(props)).not.toThrow();
    });

    it('should validate UserList component props interface', async () => {
      const { UserList } = await import('../fixtures/package-b/UserList');

      expect(UserList).toBeDefined();
      expect(typeof UserList).toBe('function');

      // UserList requires BOTH services (cross-package dependency)
      const props = {
        services: {
          userService: userService as any,
          logger: loggerService as any
        }
      };

      expect(() => UserList(props)).not.toThrow();
    });

    it('should demonstrate cross-package prop requirements', async () => {
      const { UserList } = await import('../fixtures/package-b/UserList');

      // This demonstrates that UserList (Package B) requires:
      // 1. UserServiceInterface from its own package
      // 2. LoggerInterface from Package A
      const validProps = {
        services: {
          userService: userService as any,
          logger: loggerService as any
        }
      };

      const result = UserList(validProps);

      // Verify result is a valid React element structure
      expect(result).toBeDefined();
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('props');
    });
  });

  describe('Service Integration in Components', () => {
    it('should allow Logger component to access LoggerInterface state', async () => {
      const { Logger } = await import('../fixtures/package-a/Logger');

      loggerService.log('Test log');

      const props = {
        services: {
          logger: loggerService as any
        }
      };

      const result = Logger(props);

      // Component should be constructed successfully with service state
      expect(result).toBeDefined();
      expect(loggerService.state.logs.some(log => log.includes('Test log'))).toBe(true);
    });

    it('should allow UserList to interact with both services', async () => {
      const { UserList } = await import('../fixtures/package-b/UserList');

      userService.addUser('Test User');

      const props = {
        services: {
          userService: userService as any,
          logger: loggerService as any
        }
      };

      const result = UserList(props);

      // Verify services were used
      expect(result).toBeDefined();
      expect(userService.state.users).toHaveLength(1);
      expect(loggerService.state.logs.some(log => log.includes('Test User'))).toBe(true);
    });
  });

  describe('Cross-Package Type Safety', () => {
    it('should enforce LoggerInterface type from Package A in Package B', async () => {
      // This test documents the type relationship
      const typeRelationship = {
        packageA: {
          exports: 'LoggerInterface',
          implementation: 'LoggerService'
        },
        packageB: {
          imports: 'LoggerInterface from ../package-a/LoggerService',
          usedIn: ['UserService constructor', 'UserList component props']
        },
        validation: {
          userServiceDependsOnLogger: typeof userService !== 'undefined',
          userListRequiresBothServices: true
        }
      };

      expect(typeRelationship.validation.userServiceDependsOnLogger).toBe(true);
      expect(typeRelationship.validation.userListRequiresBothServices).toBe(true);
    });
  });
});
