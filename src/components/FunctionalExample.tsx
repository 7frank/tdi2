// src/components/FunctionalExample.tsx - Example of functional DI

import React, { useState, useEffect } from 'react';
import type { Inject, InjectOptional } from '../di/markers';
import type { ExampleApiInterface } from '../services/ExampleApiInterface';
import type { LoggerService } from '../services/ExampleApiService';

// Define the services this component needs
interface UserCardServices {
  api: Inject<ExampleApiInterface>;
  logger?: InjectOptional<LoggerService>;
}

// Functional component with DI marker interfaces
// The transformer will detect this pattern and generate the appropriate hooks
function UserCard(props: { 
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

// Alternative syntax: Arrow function with marker interfaces
const ProductList = (props: {
  category: string;
  services: {
    api: Inject<ExampleApiInterface>;
    logger: Inject<LoggerService>;
  }
}) => {
  const { category, services } = props;
  const [products, setProducts] = useState<string[]>([]);

  useEffect(() => {
    services.logger.log(`Loading products for category: ${category}`);
    
    // Simulate loading products
    services.api.getData().then(data => {
      const categoryProducts = data.map(item => `${category}: ${item}`);
      setProducts(categoryProducts);
    });
  }, [category]);

  return (
    <div>
      <h3>Products in {category}</h3>
      <ul>
        {products.map((product, index) => (
          <li key={index}>{product}</li>
        ))}
      </ul>
    </div>
  );
};

// This would be transformed by the DI transformer to:
/*
const UserCardTransformed = (props: { userId: string }) => {
  // Auto-generated DI hooks
  const api = useService<ExampleApiInterface>('EXAMPLE_API_TOKEN');
  const logger = useOptionalService<LoggerService>('LOGGER_TOKEN');
  
  const services = { api, logger };
  
  // Call original component
  return UserCard({ ...props, services });
};
*/

export { UserCard, ProductList };