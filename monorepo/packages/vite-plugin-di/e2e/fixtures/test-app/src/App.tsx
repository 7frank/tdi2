import type { Inject } from "@tdi2/di-core/markers";
import type { CounterServiceInterface } from "./types/interfaces";

interface AppProps {
  services: {
    counterService: Inject<CounterServiceInterface>;
  };
}

export function App(props: AppProps) {
  const {
    services: { counterService },
  } = props;

  const { count, message } = counterService.state;

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Hello World</h1>

      <div
        style={{ marginTop: "20px", padding: "20px", border: "1px solid #ccc" }}
      >
        <h2>Counter: {count}</h2>
        <p data-testid="counter-message">{message}</p>

        <div style={{ marginTop: "10px" }}>
          <button
            data-testid="increment-btn"
            onClick={() => counterService.increment()}
            style={{ marginRight: "10px", padding: "8px 16px" }}
          >
            Increment
          </button>
          <button
            data-testid="decrement-btn"
            onClick={() => counterService.decrement()}
            style={{ marginRight: "10px", padding: "8px 16px" }}
          >
            Decrement
          </button>
          <button
            data-testid="reset-btn"
            onClick={() => counterService.reset()}
            style={{ padding: "8px 16px" }}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
