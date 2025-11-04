import { describe, it, expect, beforeAll } from 'vitest';

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CompileTimeDIContainer as DIContainer } from '@tdi2/di-core';
import { DIProvider } from '@tdi2/di-core/context';

// Import services and components from both packages
import { LoggerService, type LoggerInterface } from '../fixtures/package-a/LoggerService';
import { Logger } from '../fixtures/package-a/Logger';
import { UserService, type UserServiceInterface } from '../fixtures/package-b/UserService';
import { UserList } from '../fixtures/package-b/UserList';

describe('Cross-Package DI Integration', () => {
  let container: DIContainer;
  let loggerService: LoggerInterface;
  let userService: UserServiceInterface;

  beforeAll(() => {
    // Create DI container
    container = new DIContainer();

    // Register services from Package A
    loggerService = new LoggerService();
    container.register('LoggerInterface', loggerService);
    container.register('LoggerService', loggerService);

    // Register services from Package B (with dependency on Package A)
    userService = new UserService(loggerService);
    container.register('UserServiceInterface', userService);
    container.register('UserService', userService);
  });

  describe('Service Dependencies', () => {
    it('should initialize UserService with LoggerInterface from Package A', () => {
      expect(userService).toBeDefined();
      expect(loggerService.state.logs.length).toBeGreaterThan(0);
      expect(loggerService.state.logs[0]).toContain('UserService initialized');
    });

    it('should log when adding users via UserService', () => {
      const initialLogCount = loggerService.state.logs.length;

      userService.addUser('Alice');

      expect(userService.state.users).toHaveLength(1);
      expect(userService.state.users[0].name).toBe('Alice');
      expect(loggerService.state.logs.length).toBeGreaterThan(initialLogCount);
      expect(loggerService.state.logs[loggerService.state.logs.length - 1]).toContain('User added: Alice');
    });

    it('should log when fetching users via UserService', () => {
      const initialLogCount = loggerService.state.logs.length;

      userService.getUsers();

      expect(loggerService.state.logs.length).toBeGreaterThan(initialLogCount);
      expect(loggerService.state.logs[loggerService.state.logs.length - 1]).toContain('Fetching');
    });
  });

  describe('Component Integration', () => {
    it('should render Logger component with logs from Package A', () => {
      render(
        <DIProvider container={container}>
          <Logger services={{ logger: loggerService as any }} />
        </DIProvider>
      );

      expect(screen.getByTestId('logger')).toBeInTheDocument();
      expect(screen.getByTestId('log-list')).toBeInTheDocument();

      const logs = screen.getAllByTestId(/^log-/);
      expect(logs.length).toBeGreaterThan(0);
    });

    it('should render UserList component with dependencies from both packages', () => {
      render(
        <DIProvider container={container}>
          <UserList
            services={{
              userService: userService as any,
              logger: loggerService as any
            }}
          />
        </DIProvider>
      );

      expect(screen.getByTestId('user-list')).toBeInTheDocument();
      expect(screen.getByTestId('add-user-btn')).toBeInTheDocument();
      expect(screen.getByTestId('refresh-btn')).toBeInTheDocument();
    });

    it('should add users and log via cross-package dependencies', () => {
      const initialUserCount = userService.state.users.length;
      const initialLogCount = loggerService.state.logs.length;

      render(
        <DIProvider container={container}>
          <UserList
            services={{
              userService: userService as any,
              logger: loggerService as any
            }}
          />
        </DIProvider>
      );

      // Click add user button
      const addButton = screen.getByTestId('add-user-btn');
      fireEvent.click(addButton);

      // Verify user was added
      expect(userService.state.users.length).toBe(initialUserCount + 1);

      // Verify logger was called
      expect(loggerService.state.logs.length).toBeGreaterThan(initialLogCount);
    });

    it('should display users from both services', () => {
      // Clear and add specific test users
      userService.state.users = [];
      userService.addUser('Bob');
      userService.addUser('Charlie');

      render(
        <DIProvider container={container}>
          <div>
            <UserList
              services={{
                userService: userService as any,
                logger: loggerService as any
              }}
            />
            <Logger services={{ logger: loggerService as any }} />
          </div>
        </DIProvider>
      );

      // Check users are displayed
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();

      // Check logs show user additions
      const logElements = screen.getAllByTestId(/^log-/);
      const logTexts = logElements.map(el => el.textContent);
      const userLogs = logTexts.filter(text => text?.includes('User added'));
      expect(userLogs.length).toBeGreaterThan(0);
    });
  });

  describe('Transformed Component Integration', () => {
    it('should work with auto-injected services (simulated)', () => {
      // This test simulates what would happen after transformation
      // The actual transformation would inject services automatically

      const App = () => (
        <DIProvider container={container}>
          <div>
            <UserList
              services={{
                userService: userService as any,
                logger: loggerService as any
              }}
            />
            <Logger services={{ logger: loggerService as any }} />
          </div>
        </DIProvider>
      );

      render(<App />);

      // Verify both components render
      expect(screen.getByTestId('user-list')).toBeInTheDocument();
      expect(screen.getByTestId('logger')).toBeInTheDocument();

      // Interact and verify cross-package communication
      fireEvent.click(screen.getByTestId('refresh-btn'));

      // Logger should have received the refresh log
      const logs = loggerService.state.logs;
      const hasRefreshLog = logs.some(log => log.includes('Refreshing user list'));
      expect(hasRefreshLog).toBe(true);
    });
  });
});
