// src/experimental-utils/observable/ExampleObservableFC.tsx - Interface-based Injection

import type { Inject } from "../../di/markers";
import type {
  ApiService,
  UserServiceState,
  UserServiceType, // This is the interface that combines AsyncState<UserServiceState> & UserServiceMethods
  ApiServiceType,
} from "./exampleServices";
import {
  useAsyncServiceInterface,
  useMultipleAsyncStates,
} from "./useObservableState";
import { useState } from "react";

export function ExampleObservableFC(props: {
  services: {
    apiService: Inject<ApiService>; // Interface-based injection
    userService: Inject<UserServiceType>; // Interface-based injection - THIS IS WHAT YOU WANTED!
  };
}) {
  const { services } = props;

  // Enhanced state management with interface-aware hooks
  const apiState = useAsyncServiceInterface(services.apiService);
  const userState = useAsyncServiceInterface(services.userService);

  // State for form inputs
  const [userId, setUserId] = useState("123");
  const [searchQuery, setSearchQuery] = useState("");
  const [updateData, setUpdateData] = useState<Partial<UserServiceState>>({});

  // Use the multiple states hook for combined state management
  const multiState = useMultipleAsyncStates({
    api: services.apiService,
    user: services.userService,
  });

  const handleApiCall = async () => {
    // services.apiService is now typed as ApiServiceType (interface)
    await services.apiService.fetchData();
  };

  const handleUserFetch = async () => {
    // services.userService is now typed as UserServiceType (interface)
    // This gives you full access to both AsyncState<UserServiceState> AND UserServiceMethods
    await services.userService.getProfile(userId);
  };

  const handleUserUpdate = async () => {
    if (updateData.name || updateData.email) {
      // You can call methods from UserServiceMethods interface
      await services.userService.updateProfile(userId, updateData);
      setUpdateData({}); // Reset form
    }
  };

  const handleUserSearch = async () => {
    if (searchQuery.trim()) {
      // Full access to all UserServiceMethods
      await services.userService.searchUsers(searchQuery);
    }
  };

  const handleUserDelete = async () => {
    if (confirm(`Are you sure you want to delete user ${userId}?`)) {
      // UserServiceType interface provides all methods
      await services.userService.deleteUser(userId);
    }
  };

  const renderApiState = () => {
    if (apiState.isLoading) return <div>Loading API data...</div>;
    if (apiState.isError)
      return (
        <div style={{ color: "red" }}>Error: {apiState.error?.message}</div>
      );
    if (apiState.isSuccess)
      return <div style={{ color: "green" }}>✅ {apiState.data}</div>;
    return <div>Ready to fetch API data</div>;
  };

  const renderUserState = () => {
    if (userState.isLoading) return <div>Loading user...</div>;
    if (userState.isError)
      return (
        <div style={{ color: "red" }}>Error: {userState.error?.message}</div>
      );
    if (userState.isSuccess) {
      // Handle different types of user data
      const data = userState.data;

      if (Array.isArray(data)) {
        // Search results
        return (
          <div>
            <div style={{ color: "green" }}>✅ Search Results:</div>
            {data.map((user: UserServiceState, index: number) => (
              <div key={index} style={{ marginLeft: "20px", fontSize: "14px" }}>
                • {user.name} ({user.email})
              </div>
            ))}
          </div>
        );
      } else if (typeof data === "boolean") {
        // Delete result
        return (
          <div style={{ color: data ? "green" : "red" }}>
            {data ? "✅ User deleted successfully" : "❌ Failed to delete user"}
          </div>
        );
      } else if (data && typeof data === "object" && "name" in data) {
        // User profile data
        return (
          <div>
            <div style={{ color: "green" }}>✅ User Profile:</div>
            <div style={{ marginLeft: "20px" }}>
              <div>
                <strong>Name:</strong> {data.name}
              </div>
              <div>
                <strong>Email:</strong> {data.email}
              </div>
            </div>
          </div>
        );
      }
    }
    return <div>Ready to fetch user data</div>;
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px" }}>
      <h3>Interface-Based Observable Service Demo</h3>

      {/* Service Type Information */}
      <div
        style={{
          marginBottom: "20px",
          padding: "10px",
          backgroundColor: "#e8f5e8",
          borderRadius: "5px",
          fontSize: "12px",
        }}
      >
        <div>
          <strong>🎯 Interface-Based DI:</strong>
        </div>
        <div>
          • API Service: <code>Inject&lt;ApiServiceType&gt;</code>
        </div>
        <div>
          • User Service: <code>Inject&lt;UserServiceType&gt;</code>
        </div>
        <div style={{ marginTop: "5px", fontStyle: "italic" }}>
          UserServiceType = AsyncState&lt;UserServiceState&gt; &
          UserServiceMethods
        </div>
      </div>

      {/* Global State Indicators */}
      <div
        style={{
          marginBottom: "20px",
          padding: "10px",
          backgroundColor: "#f5f5f5",
          borderRadius: "5px",
          fontSize: "12px",
        }}
      >
        <div>
          <strong>Global State:</strong>
        </div>
        <div>Any Loading: {multiState.isAnyLoading ? "🔄" : "✅"}</div>
        <div>Has Errors: {multiState.hasAnyError ? "❌" : "✅"}</div>
        <div>All Successful: {multiState.allSuccessful ? "✅" : "⏳"}</div>
        <button
          onClick={multiState.resetAll}
          style={{ marginTop: "5px", fontSize: "11px", padding: "2px 6px" }}
        >
          Reset All
        </button>
      </div>

      {/* API Service Section */}
      <div
        style={{
          marginBottom: "30px",
          border: "1px solid #ddd",
          padding: "15px",
          borderRadius: "5px",
        }}
      >
        <h4>API Service (ApiServiceType Interface)</h4>
        <div style={{ marginBottom: "10px" }}>
          <button onClick={handleApiCall} disabled={apiState.isLoading}>
            {apiState.isLoading ? "Loading..." : "Fetch API Data"}
          </button>
          <button
            onClick={apiState.reset}
            style={{ marginLeft: "10px" }}
            disabled={apiState.isLoading}
          >
            Reset
          </button>
        </div>
        {renderApiState()}
        {apiState.isStale && (
          <div style={{ fontSize: "11px", color: "#888", marginTop: "5px" }}>
            ⚠️ Data is stale (older than 5 minutes)
          </div>
        )}
      </div>

      {/* User Service Section */}
      <div
        style={{
          border: "1px solid #ddd",
          padding: "15px",
          borderRadius: "5px",
        }}
      >
        <h4>User Service (UserServiceType Interface)</h4>

        <div
          style={{
            marginBottom: "15px",
            padding: "8px",
            backgroundColor: "#f0f8ff",
            borderRadius: "3px",
            fontSize: "11px",
          }}
        >
          <strong>Available Methods from UserServiceType:</strong>
          <ul style={{ margin: "5px 0", paddingLeft: "20px" }}>
            <li>
              <code>
                getProfile(id: string): Promise&lt;UserServiceState&gt;
              </code>
            </li>
            <li>
              <code>
                updateProfile(id: string, updates:
                Partial&lt;UserServiceState&gt;):
                Promise&lt;UserServiceState&gt;
              </code>
            </li>
            <li>
              <code>deleteUser(id: string): Promise&lt;boolean&gt;</code>
            </li>
            <li>
              <code>
                searchUsers(query: string): Promise&lt;UserServiceState[]&gt;
              </code>
            </li>
            <li>
              <em>
                Plus all AsyncState&lt;UserServiceState&gt; properties (state,
                isLoading, etc.)
              </em>
            </li>
          </ul>
        </div>

        {/* User ID Input */}
        <div style={{ marginBottom: "15px" }}>
          <label
            style={{ display: "block", fontSize: "12px", marginBottom: "5px" }}
          >
            User ID:
          </label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            style={{ padding: "4px", marginRight: "10px", width: "100px" }}
          />
        </div>

        {/* Action Buttons */}
        <div
          style={{
            marginBottom: "15px",
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <button onClick={handleUserFetch} disabled={userState.isLoading}>
            Get Profile
          </button>
          <button onClick={handleUserDelete} disabled={userState.isLoading}>
            Delete User
          </button>
          <button onClick={userState.reset} disabled={userState.isLoading}>
            Reset
          </button>
        </div>

        {/* Update Form */}
        <div
          style={{
            marginBottom: "15px",
            padding: "10px",
            backgroundColor: "#f9f9f9",
            borderRadius: "3px",
          }}
        >
          <div style={{ fontSize: "12px", marginBottom: "5px" }}>
            <strong>Update Profile:</strong>
          </div>
          <div style={{ display: "flex", gap: "10px", marginBottom: "5px" }}>
            <input
              placeholder="New name"
              value={updateData.name || ""}
              onChange={(e) =>
                setUpdateData((prev) => ({ ...prev, name: e.target.value }))
              }
              style={{ padding: "2px", fontSize: "12px" }}
            />
            <input
              placeholder="New email"
              value={updateData.email || ""}
              onChange={(e) =>
                setUpdateData((prev) => ({ ...prev, email: e.target.value }))
              }
              style={{ padding: "2px", fontSize: "12px" }}
            />
          </div>
          <button
            onClick={handleUserUpdate}
            disabled={
              userState.isLoading || (!updateData.name && !updateData.email)
            }
            style={{ fontSize: "12px", padding: "4px 8px" }}
          >
            Update Profile
          </button>
        </div>

        {/* Search Form */}
        <div
          style={{
            marginBottom: "15px",
            padding: "10px",
            backgroundColor: "#f9f9f9",
            borderRadius: "3px",
          }}
        >
          <div style={{ fontSize: "12px", marginBottom: "5px" }}>
            <strong>Search Users:</strong>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              placeholder="Search query"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: "2px", fontSize: "12px" }}
            />
            <button
              onClick={handleUserSearch}
              disabled={userState.isLoading || !searchQuery.trim()}
              style={{ fontSize: "12px", padding: "4px 8px" }}
            >
              Search
            </button>
          </div>
        </div>

        {/* User State Display */}
        {renderUserState()}

        {userState.isStale && (
          <div style={{ fontSize: "11px", color: "#888", marginTop: "5px" }}>
            ⚠️ Data is stale (older than 5 minutes)
          </div>
        )}

        {/* Interface Information */}
        <div
          style={{
            marginTop: "15px",
            padding: "8px",
            backgroundColor: "#fffbf0",
            borderRadius: "3px",
            fontSize: "10px",
          }}
        >
          <strong>🔧 Interface Implementation Details:</strong>
          <div>
            Type: <code>{typeof services.userService}</code>
          </div>
          <div>
            Has getProfile:{" "}
            <code>
              {typeof services.userService.getProfile === "function"
                ? "Yes"
                : "No"}
            </code>
          </div>
          <div>
            Has state: <code>{services.userService.state ? "Yes" : "No"}</code>
          </div>
          <div>
            Has reset:{" "}
            <code>
              {typeof services.userService.reset === "function" ? "Yes" : "No"}
            </code>
          </div>
        </div>

        {/* Operation Count */}
        <div style={{ fontSize: "10px", color: "#666", marginTop: "10px" }}>
          Operations performed: {userState.operationCount}
          {userState.lastUpdated && (
            <span>
              {" "}
              | Last updated: {userState.lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
