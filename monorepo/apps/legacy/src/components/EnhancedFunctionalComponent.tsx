// src/components/EnhancedFunctionalComponent.tsx - Interface-based functional DI

import { useState, useEffect } from "react";
import type { Inject, InjectOptional } from "@tdi2/di-core/markers";

import type { ExampleApiInterface } from "../services/ExampleApiInterface";
import type {
  LoggerInterface,
  CacheInterface,
} from "../services/UserApiServiceImpl";
import { Service } from "@tdi2/di-core";

// Enhanced UserProfile with interface-based dependencies
function UserProfile(props: {
  userId: string;
  title?: string;
  services: {
    api: Inject<ExampleApiInterface>; // Required: Will auto-resolve to UserApiServiceImpl
    logger?: InjectOptional<LoggerInterface>; // Optional: Will auto-resolve to ConsoleLogger
    cache?: InjectOptional<CacheInterface<any>>; // Optional: Will auto-resolve to MemoryCache
  };
}) {
  const { userId, title = "User Profile", services } = props;
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<string>("unknown");

  const loadUser = async () => {
    setLoading(true);
    services.logger?.log(`Loading user profile for ${userId}`);

    try {
      // Check cache status if available
      if (services.cache) {
        const cached = await services.cache.get(`user-${userId}`);
        setCacheStatus(cached ? "hit" : "miss");
      }

      const userData = await services.api.getUserInfo(userId);
      setUser(userData);
      services.logger?.log(`User profile loaded: ${userData.name}`);
    } catch (error) {
      services.logger?.error(`Failed to load user: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async () => {
    if (services.cache) {
      await services.cache.delete(`user-${userId}`);
      services.logger?.log(`Cache cleared for user ${userId}`);
      setCacheStatus("cleared");
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
    <div>
      <h3>{title} (Interface DI)</h3>
      <div>
        <strong>Name:</strong> {user.name}
      </div>
      <div>
        <strong>Email:</strong> {user.email}
      </div>
      <div>
        <strong>ID:</strong> {user.id}
      </div>

      {/* Cache status indicator */}
      {services.cache && (
        <div style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>
          <strong>Cache:</strong> {cacheStatus}
          {cacheStatus !== "cleared" && (
            <button
              onClick={clearCache}
              style={{
                marginLeft: "8px",
                padding: "2px 6px",
                fontSize: "10px",
                backgroundColor: "#ff9800",
                color: "white",
                border: "none",
                borderRadius: "2px",
                cursor: "pointer",
              }}
            >
              Clear Cache
            </button>
          )}
        </div>
      )}

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

      {/* Debug info */}
      <div style={{ marginTop: "8px", fontSize: "11px", color: "#999" }}>
        Dependencies: API={services.api ? "✅" : "❌"}, Logger=
        {services.logger ? "✅" : "❌"}, Cache={services.cache ? "✅" : "❌"}
      </div>
    </div>
  );
}

// DataList with comprehensive interface dependencies
const DataList = (props: {
  category: string;
  services: {
    api: Inject<ExampleApiInterface>;
    logger: Inject<LoggerInterface>;
    cache?: InjectOptional<CacheInterface<string[]>>;
  };
}) => {
  const { category, services } = props;
  const [items, setItems] = useState<string[]>([]);
  const [cacheHit, setCacheHit] = useState<boolean>(false);

  const loadData = async () => {
    services.logger.log(`Loading ${category} data`);

    // Try cache first
    if (services.cache) {
      const cached = await services.cache.get(`data-${category}`);
      if (cached) {
        services.logger.log(`Cache hit for ${category} data`);
        setItems(cached.map((item) => `${category}: ${item} (cached)`));
        setCacheHit(true);
        return;
      }
    }

    setCacheHit(false);
    const data = await services.api.getData();
    const categoryItems = data.map((item) => `${category}: ${item}`);
    setItems(categoryItems);

    // Cache the result
    if (services.cache) {
      await services.cache.set(`data-${category}`, data, 180); // 3 minutes
      services.logger.log(`Data cached for ${category}`);
    }
  };

  const postNewData = async () => {
    const newData = { category, timestamp: new Date().toISOString() };
    const success = await services.api.postData(newData);

    if (success) {
      services.logger.log(`Successfully posted data for ${category}`);
      // Reload data after posting
      loadData();
    } else {
      services.logger.error(`Failed to post data for ${category}`);
    }
  };

  useEffect(() => {
    loadData();
  }, [category]);

  return (
    <div>
      <h4>{category} Items (Interface DI)</h4>

      {cacheHit && (
        <div
          style={{ fontSize: "12px", color: "#ff9800", marginBottom: "8px" }}
        >
          ⚡ Data loaded from cache
        </div>
      )}

      <ul>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>

      <div style={{ marginTop: "8px" }}>
        <button
          onClick={loadData}
          style={{
            padding: "4px 8px",
            backgroundColor: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            marginRight: "8px",
          }}
        >
          Refresh
        </button>

        <button
          onClick={postNewData}
          style={{
            padding: "4px 8px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Post Data
        </button>
      </div>

      {/* Debug info */}
      <div style={{ marginTop: "8px", fontSize: "11px", color: "#999" }}>
        Resolved: API={services.api?.constructor.name}, Logger=
        {services.logger?.constructor.name}, Cache=
        {services.cache?.constructor.name || "none"}
      </div>
    </div>
  );
};

export { UserProfile, DataList };
