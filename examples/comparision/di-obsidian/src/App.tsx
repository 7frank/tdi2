import {
  type DependenciesOf,
  injectComponent,
  useObserver,
} from "react-obsidian";
import { ApplicationGraph } from "./graph/ApplicationGraph";

// 1. Declare which dependencies should be injected.
type Props = DependenciesOf<ApplicationGraph, "counterService">;

// 2. Implement the component.
const AppComponent = ({ counterService }: Props) => {
  const [count] = useObserver(counterService.count);

  return (
    <>
      <h1>React Obsidian DI</h1>
      <div>
        <p>count is {count}</p>
        <div>
          <button onClick={() => counterService.increment()}>Increment</button>
          <button onClick={() => counterService.decrement()}>Decrement</button>
          <button onClick={() => counterService.reset()}>Reset</button>
        </div>
      </div>
    </>
  );
};

// 3. Export the injected component.
export default injectComponent(AppComponent, ApplicationGraph);
