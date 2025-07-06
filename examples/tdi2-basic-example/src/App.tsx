// 3. Component - Pure template, no hooks, no props!
import type { Inject } from "@tdi2/di-core/markers";
import type { CounterServiceInterface } from "./services/CounterService";

interface CounterProps {
  services: { counterService: Inject<CounterServiceInterface> };
}
/**
 *
 *
 *
 *
 *
 */
export function Counter(props: CounterProps) {
  const {
    services: { counterService },
  } = props;

  // No useState, no useEffect - everything comes from service!
  const count = counterService.state.count;
  const message = counterService.state.message;

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>Simple Counter</h1>
      <h2>{count}</h2>
      <p>{message}</p>

      <div style={{ gap: "10px", display: "flex", justifyContent: "center" }}>
        <button onClick={() => counterService.decrement()}>- Decrease</button>
        <button onClick={() => counterService.reset()}>Reset</button>
        <button onClick={() => counterService.increment()}>+ Increase</button>
      </div>

      <div style={{ marginTop: "20px" }}>
        <input
          type="text"
          placeholder="Enter custom message"
          onChange={(e) => counterService.setMessage(e.target.value)}
        />
      </div>
    </div>
  );
}

// 4. App Component - Also no props needed
interface AppProps {
  services: { counterService: Inject<CounterServiceInterface> };
}

export default function App(props: AppProps) {
  const {
    services: { counterService },
  } = props;
  return (
    <div>
      <h1>TDI2 + Valtio Demo</h1>
      <Counter />

      {/* Multiple components automatically sync! */}
      <div
        style={{ marginTop: "30px", padding: "10px", border: "1px solid #ccc" }}
      >
        <h3>Count Display (auto-synced)</h3>
        <p>Current count: {counterService.state.count}</p>
        <small>This updates automatically when Counter changes!</small>
      </div>
    </div>
  );
}

// 5. What TDI2 generates after transformation:
//
// export function Counter() {
//   // TDI2-TRANSFORMED: Auto-injected service
//   const counterService = useService('CounterService');
//
//   // Valtio: Auto-reactive snapshots
//   const counterSnap = useSnapshot(counterService.state);
//
//   return (
//     <div>
//       <h2>{counterSnap.count}</h2>
//       <p>{counterSnap.message}</p>
//       <button onClick={() => counterService.increment()}>+</button>
//     </div>
//   );
// }
