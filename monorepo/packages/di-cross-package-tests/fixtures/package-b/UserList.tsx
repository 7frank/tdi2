import React from 'react';
import type { Inject } from '@tdi2/di-core/markers';
import type { UserServiceInterface } from './UserService';
import type { LoggerInterface } from '../package-a/LoggerService';

/**
 * UserList component - Package B
 * Depends on BOTH UserService (local) AND LoggerInterface (from Package A)
 */
export function UserList(props: {
  services: {
    userService: Inject<UserServiceInterface>;
    logger: Inject<LoggerInterface>;
  };
}) {
  const { userService, logger } = props.services;

  const handleAddUser = () => {
    const name = `User ${userService.state.users.length + 1}`;
    userService.addUser(name);
  };

  const handleRefresh = () => {
    logger.log('Refreshing user list...');
    userService.getUsers();
  };

  return (
    <div data-testid="user-list">
      <h3>Users</h3>
      <button onClick={handleAddUser} data-testid="add-user-btn">
        Add User
      </button>
      <button onClick={handleRefresh} data-testid="refresh-btn">
        Refresh
      </button>
      <ul data-testid="users">
        {userService.state.users.map((user) => (
          <li key={user.id} data-testid={`user-${user.id}`}>
            {user.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
