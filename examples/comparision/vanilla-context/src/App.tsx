import { useCounter } from "./context/CounterContext";

function Counter() {
  // Access context via custom hook
  const { count, message, increment, decrement, reset, setMessage } =
    useCounter();

  return (
    <div>
      <h1>Simple Counter (Context API)</h1>

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
