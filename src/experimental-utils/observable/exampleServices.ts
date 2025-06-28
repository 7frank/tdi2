import { Service } from "../../di";
import { AsyncState } from "./useObservableState";

// Utility for delay
const delay = async (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Example Service Implementation
@Service()
export class ApiService extends AsyncState<string> {
  async fetchData(): Promise<string> {
    return this.execute(async () => {
      await delay(1000); // Simulate network delay
      if (Math.random() > 0.7) {
        throw new Error("Random API failure");
      }
      return "Successfully fetched data from API";
    });
  }

  async fetchUserData(userId: string): Promise<string> {
    return this.execute(async () => {
      await delay(800);
      return `User data for ID: ${userId}`;
    });
  }
}

@Service()
export class UserService extends AsyncState<{ name: string; email: string }> {
  async getProfile(id: string): Promise<{ name: string; email: string }> {
    return this.execute(async () => {
      await delay(600);
      return {
        name: `User ${id}`,
        email: `user${id}@example.com`,
      };
    });
  }
}
