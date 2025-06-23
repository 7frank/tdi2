// src/App.tsx - Updated with functional DI examples

import { useState, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

import { useService } from "./di/context";

import type { ExampleApiInterface } from "./services/ExampleApiInterface";

import { EXAMPLE_API_TOKEN } from "./services/ExampleApiInterface";
import { UserProfile } from "./components/NewFunctionalComponent";

// Traditional DI approach (current working approach)
interface AppWithDIProps {
  services?: {
    appService: ExampleApiInterface;
  };
}

function App({ services }: AppWithDIProps) {
  const [count, setCount] = useState(0);
  const [data, setData] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);

  // Traditional DI approach - use DI to get the API service
  const apiService =
    services?.appService || useService<ExampleApiInterface>(EXAMPLE_API_TOKEN);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await apiService.getData();
      setData(result);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserInfo = async () => {
    try {
      const user = await apiService.getUserInfo("123");
      setUserInfo(user);
    } catch (error) {
      console.error("Failed to fetch user info:", error);
    }
  };

  const postSampleData = async () => {
    try {
      const success = await apiService.postData({
        message: "Hello from DI!",
        count,
      });
      if (success) {
        console.log("Data posted successfully");
      }
    } catch (error) {
      console.error("Failed to post data:", error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchUserInfo();
  }, []);

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React + Functional DI</h1>

      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>

        <div
          style={{
            marginTop: "20px",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "5px",
          }}
        >
          <h3>Traditional DI Demo</h3>
          <p>
            <strong>Service Source:</strong>{" "}
            {services?.appService ? "Injected via Props" : "DI Container"}
          </p>

          <div style={{ marginBottom: "10px" }}>
            <button onClick={fetchData} disabled={loading}>
              {loading ? "Loading..." : "Fetch Data"}
            </button>
            {data.length > 0 && (
              <ul style={{ textAlign: "left", marginTop: "10px" }}>
                {data.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ marginBottom: "10px" }}>
            <button onClick={postSampleData}>Post Data</button>
          </div>

          {userInfo && (
            <div style={{ marginTop: "10px", textAlign: "left" }}>
              <h4>User Info:</h4>
              <p>ID: {userInfo.id}</p>
              <p>Name: {userInfo.name}</p>
              <p>Email: {userInfo.email}</p>
            </div>
          )}
        </div>

        {/* Functional DI Examples */}
        <div
          style={{
            marginTop: "20px",
            padding: "10px",
            border: "2px solid #ff6b6b",
            borderRadius: "5px",
          }}
        >
          <h3>🎯 Functional DI Examples</h3>
<UserProfile userId="foo1" title="it works"/>
          <div
            style={{
              padding: "10px",
              backgroundColor: "#f0f0f0",
              margin: "10px",
            }}
          >
            <h4>🔮 POC: Marker Interface Components</h4>
            <p>
              <em>
                These would be auto-transformed by the enhanced transformer:
              </em>
            </p>
            <code
              style={{
                display: "block",
                padding: "10px",
                backgroundColor: "#fff",
                fontSize: "12px",
              }}
            >
              {`function UserCard(props: { 
  userId: string; 
  services: { api: Inject<ExampleApiInterface> } 
}) { ... }`}
            </code>
            <p>
              <em>↓ Transformed to ↓</em>
            </p>
            <code
              style={{
                display: "block",
                padding: "10px",
                backgroundColor: "#fff",
                fontSize: "12px",
              }}
            >
              {`function UserCard({ userId }: { userId: string }) {
  const api = useService('EXAMPLE_API_TOKEN');
  // Original component logic with injected services
}`}
            </code>
          </div>
        </div>
      </div>

      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
