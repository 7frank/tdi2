// src/components/NewFunctionalComponent.tsx - Real functional DI example

import { useState, useEffect } from "react";
import type { Inject, InjectOptional } from "../di/markers";
import type { ExampleApiInterface } from "../services/ExampleApiInterface";
import type { LoggerService } from "../services/ExampleApiService";

// This component will be transformed by the DI transformer!
function UserProfile(props: {
  userId: string;
  title?: string;
  services: {
    api: Inject<ExampleApiInterface>;
    logger?: InjectOptional<LoggerService>;
  };
}) {
  const { userId, title = "User Profile", services } = props;
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadUser = async () => {
    setLoading(true);
    services.logger?.log(`Loading user profile for ${userId}`);

    try {
      const userData = await services.api.getUserInfo(userId);
      setUser(userData);
      services.logger?.log(`User profile loaded: ${userData.name}`);
    } catch (error) {
      services.logger?.log(`Failed to load user: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, [userId]);

  if (loading) {
    return <div>Loading user profile...</div>;
  }

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div
      style={{
        border: "2px solid #4CAF50",
        borderRadius: "8px",
        padding: "16px",
        margin: "8px",
        backgroundColor: "#f8f9fa",
      }}
    >
      <h3>{title}</h3>
      <div>
        <strong>Name:</strong> {user.name}
      </div>
      <div>
        <strong>Email:</strong> {user.email}
      </div>
      <div>
        <strong>ID:</strong> {user.id}
      </div>
      <button
        onClick={loadUser}
        style={{
          marginTop: "8px",
          padding: "4px 8px",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Refresh
      </button>
    </div>
  );
}

// Arrow function example
const DataList = (props: {
  category: string;
  services: {
    api: Inject<ExampleApiInterface>;
    logger: Inject<LoggerService>;
  };
}) => {
  const { category, services } = props;
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    services.logger.log(`Loading ${category} data`);
    services.api.getData().then((data) => {
      const categoryItems = data.map((item) => `${category}: ${item}`);
      setItems(categoryItems);
    });
  }, [category]);

  return (
    <div
      style={{
        border: "2px solid #2196F3",
        borderRadius: "8px",
        padding: "16px",
        margin: "8px",
        backgroundColor: "#e3f2fd",
      }}
    >
      <h4>{category} Items</h4>
      <ul>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
};

export { UserProfile, DataList };
