import type { Inject } from "@tdi2/di-core/markers";
import { AnimalInterface } from "../interfaces/AnimalInterface";
import { ErrorBoundary } from "../utils/ErrorBoundary";

type Props = {
  services: {
    animal: Inject<AnimalInterface>;
  };
};

// TODO implement example properly as soon as we can isolate it
export function DestructuredKeysExample(props: Props) {
  const { services } = props;
  console.log(services);
  const handleClick = () => {
    console.log(services.animal.speak());
  };

  return (
    <div>
      <p>Animal Name: "{services.animal.name}"</p>
      <input onChange={(e) => services.animal.assignName(e.target.value)} />
      <button onClick={handleClick}>Make Sound</button>
    </div>
  );
}
