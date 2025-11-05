import { Service } from "@tdi2/di-core";
import { AnimalInterface } from "../interfaces/AnimalInterface";

@Service()
export class DogService implements AnimalInterface {
  name: string = "unnamed-doggo";

  // FIXME must have a constructor to work but we dont want this
  constructor() {}

  assignName(n: string) {
    this.name = n;
  }

  speak() {
    return "bark";
  }
}
