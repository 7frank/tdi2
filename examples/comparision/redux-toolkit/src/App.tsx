// https://github.com/7frank/tdi2/tree/main/examples/comparision/redux-toolkit
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { increment, decrement, reset, setMessage } from "./store/counterSlice";

function Counter() {
  // Access Redux store via typed hooks
  const count = useAppSelector((state) => state.counter.count);
  const message = useAppSelector((state) => state.counter.message);
  const dispatch = useAppDispatch();

  return (
    <div>
      <h1>Simple Counter (Redux Toolkit)</h1>

      <p>{message}</p>

      <div>
        <h2>{count}</h2>
        <button onClick={() => dispatch(decrement())}>- Decrease</button>
        <br />
        <button onClick={() => dispatch(reset())}>Reset</button>
        <br />
        <button onClick={() => dispatch(increment())}>+ Increase</button>
      </div>

      <input
        type="text"
        placeholder="Enter custom message"
        onChange={(e) => dispatch(setMessage(e.target.value))}
      />
    </div>
  );
}

export default function App() {
  return <Counter />;
}
