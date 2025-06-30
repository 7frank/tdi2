import { useAsyncChain } from "./useAsyncChain";

export function ExampleUseAsyncChain() {
  const asyncState = useAsyncChain<string>();

  const handleClick = async () => {
    (
      await asyncState.trigger(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve("Hello World!"), 1000)
          )
      )
    )
      .success((data: string) => data.trim())
      .map((d) => <button key="success">{d}</button>)
      .error((error: Error) => error.message)
      .map((m) => (
        <div key="error" style={{ color: "red" }}>
          {m}
        </div>
      ))
      .pending(() => <div key="loading">Loading...</div>)
      .idle(() => <div key="idle">Click to start</div>);
  };

  return (
    <div>
      <button onClick={handleClick}>Trigger Success</button>

      <div style={{ marginTop: "10px" }}>{asyncState.render}</div>
      <div style={{ marginTop: "10px", fontSize: "12px", color: "#666" }}>
        State: {JSON.stringify(asyncState.state)}
      </div>
    </div>
  );
}
