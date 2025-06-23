import "./App.css";

import { UserProfile,DataList } from "./components/NewFunctionalComponent";
import { SimpleTest } from "./components/SimpleTestComponent";



function App() {
  return (
    <div
      style={{
        marginTop: "20px",
        padding: "10px",
        border: "2px solid #ff6b6b",
        borderRadius: "5px",
      }}
    >
      <h3>🎯 Functional DI Example</h3>
      <UserProfile userId="foo1" title="it works" />
      <DataList category="bar"/>
      <SimpleTest message="baz"/>
      <div
        style={{
          padding: "10px",
          backgroundColor: "#f0f0f0",
          margin: "10px",
        }}
      >
        <h4>🔮 POC: Marker Interface Components</h4>
        <p>
          <em>These would be auto-transformed by the enhanced transformer:</em>
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
  );
}

export default App;
