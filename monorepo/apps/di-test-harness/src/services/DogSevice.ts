import { Service } from "@tdi2/di-core";
import { AnimalInterface } from "../interfaces/AnimalInterface";

@Service()
export class DogService implements AnimalInterface {
  getName() {
    return "Doggo";
  }

  speak() {
    return "bark";
  }
}
