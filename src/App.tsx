// src/App.tsx - Updated with functional DI examples

import { useState, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

import { useService, withServices } from "./di/context";
import { createDIComponent, useInjectServices } from "./di/functional-utils";
import type { ExampleApiInterface } from "./services/ExampleApiInterface";
import { LOGGER_TOKEN, type LoggerService } from "./services/ExampleApiService";
import { EXAMPLE_API_TOKEN } from "./services/ExampleApiInterface";

// Traditional DI approach (current working approach)
interface AppWithDIProps {
  services?: {
    appService: ExampleApiInterface;
  };
}

// Example of HOC-based functional DI
const EnhancedUserCard = withServices({
  api: EXAMPLE_API_TOKEN,
  logger: LOGGER_TOKEN
})(({ userId, services }: { userId: string; services: { api: ExampleApiInterface; logger: LoggerService } }) => {
  const [userInfo, setUserInfo] = useState<any>(null);
  
  useEffect(() => {
    services.logger.log(`Loading user ${userId} via HOC`);
    services.api.getUserInfo(userId).then(setUserInfo);
  }, [userId]);

  return (
    <div style={{ border: '2px solid #007acc', padding: '10px', margin: '10px' }}>
      <h4>HOC-Enhanced User Card</h4>
      {userInfo ? (
        <p>{userInfo.name} - {userInfo.email}</p>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
});

// Example of manual hook-based DI
function ManualDIComponent({ title }: { title: string }) {
  const services = useInjectServices({
    api: EXAMPLE_API_TOKEN,
    logger: LOGGER_TOKEN
  });
  
  const [data, setData] = useState<string[]>([]);

  useEffect(() => {
    services.logger.log(`Manual DI component loading data for: ${title}`);
    services.api.getData().then(setData);
  }, [title]);

  return (
    <div style={{ border: '2px solid #28a745', padding: '10px', margin: '10px' }}>
      <h4>Manual DI: {title}</h4>
      <ul>
        {data.slice(0, 2).map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
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
  const apiService = services?.appService || useService<ExampleApiInterface>(EXAMPLE_API_TOKEN);

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
          
          {/* HOC-based DI */}
          <EnhancedUserCard userId="456" />
          
          {/* Manual hook-based DI */}
          <ManualDIComponent title="Products" />
          
          {/* Future: Marker interface-based components */}
          <div style={{ padding: '10px', backgroundColor: '#f0f0f0', margin: '10px' }}>
            <h4>🔮 Future: Marker Interface Components</h4>
            <p><em>These would be auto-transformed by the enhanced transformer:</em></p>
            <code style={{ display: 'block', padding: '10px', backgroundColor: '#fff', fontSize: '12px' }}>
              {`function UserCard(props: { 
  userId: string; 
  services: { api: Inject<ExampleApiInterface> } 
}) { ... }`}
            </code>
            <p><em>↓ Transformed to ↓</em></p>
            <code style={{ display: 'block', padding: '10px', backgroundColor: '#fff', fontSize: '12px' }}>
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