import type { Inject } from "@tdi2/di-core/markers";
import { AnimalInterface } from "../interfaces/AnimalInterface";

type Props = {
  services: {
    animal: Inject<AnimalInterface>;
  };
};

// TODO implement example properly as soon as we can isolate it
export function DestructuredKeysExample({ services }: Props) {

  const handleClick = () => {
    alert(services.animal.speak());
  };

  return (
    <div>
      <p>{services.animal.constructor.name}</p>
      <p>Animal Name: "{services.animal.name}"</p>
      <input onChange={(e) => services.animal.assignName(e.target.value)} /><br/>
      <button onClick={handleClick}>Make Sound</button>
    </div>
  );
}
