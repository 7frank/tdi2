import type { Inject } from "@tdi2/di-core/markers";
import { AnimalInterface } from "../interfaces/AnimalInterface";
import { ErrorBoundary } from "../utils/ErrorBoundary";

export function DestructuredKeysExample(props: {
  services: {
    animal: Inject<AnimalInterface>;
  };
}) {
  const {  services } = props;
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
