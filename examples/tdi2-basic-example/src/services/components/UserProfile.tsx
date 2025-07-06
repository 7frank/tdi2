import React, { useState, useEffect } from 'react';
import type { Inject } from '@tdi2/di-core/markers';
import type { UserServiceInterface, User } from '../services/interfaces';

interface UserProfileProps {
  userId: string;
  services: {
    userService: Inject<UserServiceInterface>; // Auto-injected!
  };
}

export function UserProfile({ userId, services }: UserProfileProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUser();
  }, [userId]);

  const loadUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await services.userService.getUser(userId);
      setUser(userData);
    } catch (err) {
      setError('Failed to load user');
      console.error('Error loading user:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading user...</div>;
  }

  if (error) {
    return (
      <div>
        <p>Error: {error}</p>
        <button onClick={loadUser}>Retry</button>
      </div>
    );
  }

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div style={{ 
      padding: '20px', 
      border: '1px solid #ccc', 
      borderRadius: '8px',
      margin: '20px 0'
    }}>
      <h2>User Profile</h2>
      <p><strong>ID:</strong> {user.id}</p>
      <p><strong>Name:</strong> {user.name}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <button onClick={loadUser} style={{ marginTop: '10px' }}>
        Reload User
      </button>
    </div>
  );
}