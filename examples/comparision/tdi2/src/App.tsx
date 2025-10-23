// 3. Component - Pure template, no hooks, no props!
import type { Inject } from "@tdi2/di-core/markers";
import type { CounterServiceInterface } from "./services/CounterService";

interface CounterProps {
  services: { counterService: Inject<CounterServiceInterface> };
}

export function Counter(props: CounterProps) {
  const {
    services: { counterService },
  } = props;

  // No useState, no useEffect - everything comes from service!
  const count = counterService.count;
  const message = counterService.message;

  return (
    <div>
      <h1>Simple Counter</h1>

      <p>{message}</p>

      <div>
        {" "}
        <h2>{count}</h2>
        <button onClick={() => counterService.decrement()}>- Decrease</button>
        <br />
        <button onClick={() => counterService.reset()}>Reset</button>
        <br />
        <button onClick={() => counterService.increment()}>+ Increase</button>
        <br />
        <button onClick={() => counterService.count++}>+5 Increase</button>
        You also can mutate state directly, for simpler cases this is convenient,
        for chases with side effects a setter will result in better DX
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
