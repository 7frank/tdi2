/**
 * Full Cross-Package DI Integration Test
 *
 * This test validates the COMPLETE DI workflow, mimicking how production code works:
 * 1. Auto-generated di-config.ts from multiple scanDirs
 * 2. Container loads configuration automatically
 * 3. Dependencies resolved from container (not manual instantiation)
 * 4. Services from Package B depend on interfaces from Package A
 * 5. Components work with DIProvider (full stack)
 *
 * Pattern from: /examples/comparision/tdi2/src/main.tsx
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CompileTimeDIContainer } from '@tdi2/di-core';
import { DIProvider } from '@tdi2/di-core/context';

// Import auto-generated DI configuration
import { DI_CONFIG } from '../fixtures/package-a/.tdi2/di-config';

// Import types for validation
import type { LoggerInterface } from '../fixtures/package-a/LoggerService';
import type { UserServiceInterface } from '../fixtures/package-b/UserService';

// Import components
import { Logger } from '../fixtures/package-a/Logger';
import { UserList } from '../fixtures/package-b/UserList';

describe('Full Cross-Package DI Integration', () => {
  let container: CompileTimeDIContainer;

  beforeAll(() => {
    // This is the EXACT pattern from production code (main.tsx)
    container = new CompileTimeDIContainer();
    container.loadConfiguration(DI_CONFIG);

    console.log('🔧 DI Container initialized');
    console.log('📋 Registered services:', container.getRegisteredTokens());
  });

  describe('Configuration Loading', () => {
    it('should load DI_CONFIG from auto-generated bridge file', () => {
      expect(DI_CONFIG).toBeDefined();
      expect(typeof DI_CONFIG).toBe('object');
    });

    it('should register services from both packages', () => {
      const tokens = container.getRegisteredTokens();

      // Package A services
      expect(tokens).toContain('LoggerService');
      expect(tokens.some(t => t.includes('LoggerInterface'))).toBe(true);

      // Package B services
      expect(tokens).toContain('UserService');
      expect(tokens.some(t => t.includes('UserServiceInterface'))).toBe(true);
    });

    it('should have at least 4 service registrations (2 interfaces + 2 classes)', () => {
      const tokens = container.getRegisteredTokens();
      expect(tokens.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Cross-Package Dependency Resolution', () => {
    it('should resolve LoggerInterface from Package A', () => {
      // Get by interface (the way production code does it)
      const loggerToken = container.getRegisteredTokens()
        .find(t => t.includes('LoggerInterface'));

      expect(loggerToken).toBeDefined();

      const logger = container.resolve<LoggerInterface>(loggerToken!);
      expect(logger).toBeDefined();
      expect(logger.state).toBeDefined();
      expect(Array.isArray(logger.state.logs)).toBe(true);
    });

    it('should resolve UserServiceInterface from Package B', () => {
      const userServiceToken = container.getRegisteredTokens()
        .find(t => t.includes('UserServiceInterface'));

      expect(userServiceToken).toBeDefined();

      const userService = container.resolve<UserServiceInterface>(userServiceToken!);
      expect(userService).toBeDefined();
      expect(userService.state).toBeDefined();
      expect(Array.isArray(userService.state.users)).toBe(true);
    });

    it('should automatically inject LoggerInterface into UserService', () => {
      // This is the CRITICAL test - UserService constructor should receive logger automatically
      const userServiceToken = container.getRegisteredTokens()
        .find(t => t.includes('UserServiceInterface'));
      const loggerToken = container.getRegisteredTokens()
        .find(t => t.includes('LoggerInterface'));

      const userService = container.resolve<UserServiceInterface>(userServiceToken!);
      const logger = container.resolve<LoggerInterface>(loggerToken!);

      // Clear logs first
      logger.state.logs = [];

      // UserService should use the logger (from constructor injection)
      userService.addUser('Test User');

      // Verify logger was called (proves dependency injection worked)
      expect(logger.state.logs.length).toBeGreaterThan(0);
      expect(logger.state.logs.some(log => log.includes('Test User'))).toBe(true);
    });

    it('should maintain singleton scope across multiple gets', () => {
      const userServiceToken = container.getRegisteredTokens()
        .find(t => t.includes('UserServiceInterface'));

      const instance1 = container.resolve<UserServiceInterface>(userServiceToken!);
      const instance2 = container.resolve<UserServiceInterface>(userServiceToken!);

      // Should be same instance (singleton)
      expect(instance1).toBe(instance2);

      // State should be shared
      const initialLength = instance2.state.users.length;
      instance1.addUser('Shared User');
      expect(instance2.state.users.length).toBe(initialLength + 1);
    });
  });

  describe('Service Functionality', () => {
    let userService: UserServiceInterface;
    let logger: LoggerInterface;

    beforeEach(() => {
      const userServiceToken = container.getRegisteredTokens()
        .find(t => t.includes('UserServiceInterface'));
      const loggerToken = container.getRegisteredTokens()
        .find(t => t.includes('LoggerInterface'));

      userService = container.resolve<UserServiceInterface>(userServiceToken!);
      logger = container.resolve<LoggerInterface>(loggerToken!);

      // Clear state
      userService.state.users = [];
      logger.state.logs = [];
    });

    it('should add users and log via cross-package dependency', () => {
      userService.addUser('Alice');
      userService.addUser('Bob');

      expect(userService.state.users).toHaveLength(2);
      expect(userService.state.users[0].name).toBe('Alice');
      expect(userService.state.users[1].name).toBe('Bob');

      // Verify logging happened
      expect(logger.state.logs.length).toBeGreaterThanOrEqual(2);
      expect(logger.state.logs.some(log => log.includes('Alice'))).toBe(true);
      expect(logger.state.logs.some(log => log.includes('Bob'))).toBe(true);
    });

    it('should get users and log fetching', () => {
      userService.addUser('Charlie');
      logger.state.logs = []; // Clear add log

      const users = userService.getUsers();

      expect(users).toHaveLength(1);
      expect(logger.state.logs.some(log => log.includes('Fetching'))).toBe(true);
    });

    it('should log directly via LoggerInterface', () => {
      logger.log('Direct log message');

      expect(logger.state.logs).toHaveLength(1);
      expect(logger.state.logs[0]).toContain('Direct log message');
    });
  });

  describe('Component Integration with DIProvider', () => {
    it('should render Logger component with auto-injected service', () => {
      const loggerToken = container.getRegisteredTokens()
        .find(t => t.includes('LoggerInterface'));
      const logger = container.resolve<LoggerInterface>(loggerToken!);

      logger.state.logs = [];
      logger.log('Test log 1');
      logger.log('Test log 2');

      render(
        <DIProvider container={container}>
          <Logger services={{ logger: logger as any }} />
        </DIProvider>
      );

      expect(screen.getByTestId('logger')).toBeInTheDocument();
      expect(screen.getByTestId('log-list')).toBeInTheDocument();

      const logs = screen.getAllByTestId(/^log-/);
      expect(logs.length).toBeGreaterThanOrEqual(2); // At least 2 logs
    });

    it('should render UserList with cross-package dependencies', () => {
      const userServiceToken = container.getRegisteredTokens()
        .find(t => t.includes('UserServiceInterface'));
      const loggerToken = container.getRegisteredTokens()
        .find(t => t.includes('LoggerInterface'));

      const userService = container.resolve<UserServiceInterface>(userServiceToken!);
      const logger = container.resolve<LoggerInterface>(loggerToken!);

      userService.state.users = [];

      render(
        <DIProvider container={container}>
          <UserList
            services={{
              userService: userService as any,
              logger: logger as any
            }}
          />
        </DIProvider>
      );

      expect(screen.getByTestId('user-list')).toBeInTheDocument();
    });

    it('should handle user interactions with cross-package logging', () => {
      const userServiceToken = container.getRegisteredTokens()
        .find(t => t.includes('UserServiceInterface'));
      const loggerToken = container.getRegisteredTokens()
        .find(t => t.includes('LoggerInterface'));

      const userService = container.resolve<UserServiceInterface>(userServiceToken!);
      const logger = container.resolve<LoggerInterface>(loggerToken!);

      userService.state.users = [];
      logger.state.logs = [];

      render(
        <DIProvider container={container}>
          <UserList
            services={{
              userService: userService as any,
              logger: logger as any
            }}
          />
        </DIProvider>
      );

      // Click add user button
      fireEvent.click(screen.getByTestId('add-user-btn'));

      // Verify user was added
      expect(userService.state.users.length).toBe(1);

      // Verify logger was called (cross-package communication)
      expect(logger.state.logs.length).toBeGreaterThan(0);
      expect(logger.state.logs.some(log => log.includes('User added'))).toBe(true);
    });
  });

  describe('Full Application Stack', () => {
    it('should support complete app with both packages integrated', () => {
      const userServiceToken = container.getRegisteredTokens()
        .find(t => t.includes('UserServiceInterface'));
      const loggerToken = container.getRegisteredTokens()
        .find(t => t.includes('LoggerInterface'));

      const userService = container.resolve<UserServiceInterface>(userServiceToken!);
      const logger = container.resolve<LoggerInterface>(loggerToken!);

      userService.state.users = [];
      logger.state.logs = [];

      // Simulate mini-app with both components
      const App = () => (
        <DIProvider container={container}>
          <div>
            <h1>Cross-Package Test App</h1>
            <UserList
              services={{
                userService: userService as any,
                logger: logger as any
              }}
            />
            <Logger services={{ logger: logger as any }} />
          </div>
        </DIProvider>
      );

      render(<App />);

      // Interact with UserList
      fireEvent.click(screen.getByTestId('add-user-btn'));
      fireEvent.click(screen.getByTestId('add-user-btn'));

      // Verify both components work
      expect(userService.state.users).toHaveLength(2);
      expect(logger.state.logs.length).toBeGreaterThan(0);

      // Both components should render
      expect(screen.getByTestId('user-list')).toBeInTheDocument();
      expect(screen.getByTestId('logger')).toBeInTheDocument();
    });

    it('should prove UserService cannot work without LoggerInterface dependency', () => {
      // This test documents the dependency requirement
      // If factory generation is broken, UserService won't have logger

      const userServiceToken = container.getRegisteredTokens()
        .find(t => t.includes('UserServiceInterface'));
      const loggerToken = container.getRegisteredTokens()
        .find(t => t.includes('LoggerInterface'));

      const userService = container.resolve<UserServiceInterface>(userServiceToken!);
      const logger = container.resolve<LoggerInterface>(loggerToken!);

      logger.state.logs = [];

      // This MUST log (proving dependency was injected)
      userService.addUser('Dependency Test User');

      // If logger is empty, dependency injection failed
      expect(logger.state.logs.length).toBeGreaterThan(0);
      expect(logger.state.logs[0]).toContain('Dependency Test User');
    });
  });

  describe('Configuration Validation', () => {
    it('should have valid factory functions in DI_CONFIG', () => {
      expect(typeof DI_CONFIG).toBe('object');

      const configKeys = Object.keys(DI_CONFIG);
      expect(configKeys.length).toBeGreaterThan(0);

      // Each config entry should have factory function
      configKeys.forEach(key => {
        const config = DI_CONFIG[key];
        expect(config).toHaveProperty('factory');
        expect(typeof config.factory).toBe('function');
        expect(config).toHaveProperty('scope');
        expect(config).toHaveProperty('dependencies');
      });
    });

    it('should have correct interface-to-implementation mappings', () => {
      const tokens = container.getRegisteredTokens();

      // LoggerInterface -> LoggerService
      const loggerInterfaceToken = tokens.find(t => t.includes('LoggerInterface'));
      const loggerClassToken = tokens.find(t => t === 'LoggerService');
      expect(loggerInterfaceToken).toBeDefined();
      expect(loggerClassToken).toBeDefined();

      // UserServiceInterface -> UserService
      const userInterfaceToken = tokens.find(t => t.includes('UserServiceInterface'));
      const userClassToken = tokens.find(t => t === 'UserService');
      expect(userInterfaceToken).toBeDefined();
      expect(userClassToken).toBeDefined();
    });
  });
});
