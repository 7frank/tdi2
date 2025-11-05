import type { Inject } from "@tdi2/di-core/markers";
import { AnimalInterface } from "../interfaces/AnimalInterface";


export function SimpleAnimalComponent(props: {
  services: {
    animal: Inject<AnimalInterface>;
  };
}) {
  const { services } = props;

  const handleClick = () => {
    alert(services.animal.speak());
  };

  return (
    <div>
      <p>{services.animal.constructor.name}</p>
      <p>Animal Name: "{services.animal.name}"</p>
      <input onChange={(e) => services.animal.assignName(e.target.value)} />
      <br />
      <button onClick={handleClick}>Make Sound</button>
    </div>
  );
}
