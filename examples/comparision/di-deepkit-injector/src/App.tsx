// https://github.com/7frank/tdi2/tree/main/examples/comparision/di-deepkit-injector
import { useEffect, useState } from "react";
import { CounterService } from "./services/CounterService";

// Component receives injected service via function parameters
function Counter(props: object, counterService: CounterService) {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const unsubscribe = counterService.subscribe(() => {
      forceUpdate({});
    });
    return unsubscribe;
  }, [counterService]);

  return (
    <div>
      <h1>Simple Counter (Deepkit DI)</h1>

      <p>{counterService.message}</p>

      <div>
        <h2>{counterService.count}</h2>
        <button onClick={() => counterService.decrement()}>- Decrease</button>
        <br />
        <button onClick={() => counterService.reset()}>Reset</button>
        <br />
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
  return <Counter />;
}
