// src/components/FunctionalExample.tsx - Example of functional DI patterns (reference only)

import React, { useState, useEffect } from 'react';
import type { Inject, InjectOptional } from '../di/markers';
import type { ExampleApiInterface } from '../services/ExampleApiInterface';
import type { LoggerService } from '../services/ExampleApiService';

// Define the services this component needs
interface UserCardServices {
  api: Inject<ExampleApiInterface>;
  logger?: InjectOptional<LoggerService>;
}

// NOTE: This is a reference example - not transformed
// For working examples, see NewFunctionalComponent.tsx
function UserCardExample(props: { 
  userId: string; 
  services: UserCardServices 
}): JSX.Element {
  const { userId, services } = props;
  const [userInfo, setUserInfo] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchUser = async () => {
    setLoading(true);
    services.logger?.log(`Fetching user ${userId}`);
    
    try {
      const user = await services.api.getUserInfo(userId);
      setUserInfo(user);
      services.logger?.log(`User ${userId} loaded successfully`);
    } catch (error) {
      services.logger?.log(`Failed to load user ${userId}: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [userId]);

  if (loading) {
    return <div>Loading user...</div>;
  }

  if (!userInfo) {
    return <div>User not found</div>;
  }

  return (
    <div style={{
      border: '1px solid #ccc',
      borderRadius: '8px',
      padding: '16px',
      margin: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>{userInfo.name}</h3>
      <p><strong>ID:</strong> {userInfo.id}</p>
      <p><strong>Email:</strong> {userInfo.email}</p>
      <button onClick={fetchUser}>
        Refresh User
      </button>
    </div>
  );
}

// Simple component without transformation for demonstration
const SimpleProductList = ({ category }: { category: string }) => {
  const [products] = useState(['Demo Product 1', 'Demo Product 2']);

  return (
    <div style={{
      border: '1px solid #ddd',
      borderRadius: '4px',
      padding: '12px',
      margin: '8px'
    }}>
      <h3>Products in {category}</h3>
      <ul>
        {products.map((product, index) => (
          <li key={index}>{product}</li>
        ))}
      </ul>
    </div>
  );
};

export { UserCardExample as UserCard, SimpleProductList as ProductList };