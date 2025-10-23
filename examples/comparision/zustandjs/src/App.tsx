// https://github.com/7frank/tdi2/tree/main/examples/comparision/zustandjs
import { useCounterStore } from "./store/counterStore";

function Counter() {
  // Access Zustand store - component subscribes to state changes automatically
  const { count, message, increment, decrement, reset, setMessage } =
    useCounterStore();

  return (
    <div>
      <h1>Simple Counter (Zustand)</h1>

      <p>{message}</p>

      <div>
        <h2>{count}</h2>
        <button onClick={decrement}>- Decrease</button>
        <br />
        <button onClick={reset}>Reset</button>
        <br />
        <button onClick={increment}>+ Increase</button>
      </div>

      <input
        type="text"
        placeholder="Enter custom message"
        onChange={(e) => setMessage(e.target.value)}
      />
    </div>
  );
}

export default function App() {
  return <Counter />;
}
