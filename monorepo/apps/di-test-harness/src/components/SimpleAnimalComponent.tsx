import type { Inject } from "@tdi2/di-core/markers";
import { AnimalInterface } from "../interfaces/AnimalInterface";
import { ErrorBoundary } from "../utils/ErrorBoundary";

export function SimpleAnimalComponent(props: {
  name: string;
  services: {
    animal: Inject<AnimalInterface>;
  };
}) {
  const { name, services } = props;

  const handleClick = () => {
    console.log(services.animal.speak());
  };

  return (
    <ErrorBoundary>
      <h1>{name}</h1>
      <p>Animal: {services.animal.getName()}</p>
      <button onClick={handleClick}>Make Sound</button>
    </ErrorBoundary>
  );
}
