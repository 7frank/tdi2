import "./App.css";

import { SimpleTest } from "./components/SimpleTestComponent";
import {
  DataList,
  UserProfile,
} from "./components/EnhancedFunctionalComponent";
import { ExampleUseAsyncChain } from "./experimental-utils/async/ExampleUseAsyncChain";
import { ExampleObservableFC } from "./experimental-utils/observable/ExampleObservableFC";
function Foo() {
  return (
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
  const api = useService('ExampleApiService');
  // Original component logic with injected services
}`}
      </code>
    </div>
  );
}

/** DI marker to prevent squigly lines
 * TODO we should have a linter rule that detects that services has Inject markers
 */
const SERVICES = {} as any;

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
      <UserProfile userId="foo1" title="it works" services={SERVICES} />
      <DataList category="bar" services={SERVICES} />
      <SimpleTest message="baz" />
      <ExampleUseAsyncChain />
      <ExampleObservableFC services={SERVICES}/>
      <Foo />
    </div>
  );
}

export default App;
