// 3. Component - Pure template, no hooks, no props!
import type { Inject } from "@tdi2/di-core/markers";
import type { CounterServiceInterface } from "./services/CounterService";

interface CounterProps {
  counterService: Inject<CounterServiceInterface>;
}

export function Counter({ counterService }: CounterProps) {
  // No useState, no useEffect - everything comes from service!
  const { count, message } = counterService;

  return (
    <div>
      <h1>Simple Counter</h1>

      <p>{message}</p>

      <div>
        <h2>{count}</h2>
        <button onClick={() => counterService.decrement()}>- Decrease</button>
        <button onClick={() => counterService.reset()}>Reset</button>
        <button onClick={() => counterService.increment()}>+ Increase</button>
      </div>

      <input
        type="text"
        placeholder="Enter custom message"
        onChange={(e) => counterService.setMessage(e.target.value)}
      />
    </div>
  );
}

export default function App() {
  return (
    <>
      <Counter />
    </>
  );
}
