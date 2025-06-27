// src/experimental-utils/observable/exampleServices.ts - Interface-based UserServiceType

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

// Enhanced UserService with injectable interface type
export interface UserServiceState {
  name: string;
  email: string;
}

export interface UserServiceMethods {
  getProfile(id: string): Promise<UserServiceState>;
  updateProfile(
    id: string,
    updates: Partial<UserServiceState>
  ): Promise<UserServiceState>;
  deleteUser(id: string): Promise<boolean>;
  searchUsers(query: string): Promise<UserServiceState[]>;
}

// CRITICAL: Create an interface that combines AsyncState and UserServiceMethods
export interface UserServiceType
  extends AsyncState<UserServiceState>,
    UserServiceMethods {
  // This interface can be used for DI injection
  // It represents the complete contract for the UserService
}

// ALTERNATIVE: You can also use a type alias if you prefer
// export type UserServiceType = AsyncState<UserServiceState> & UserServiceMethods;

@Service()
export class UserService
  extends AsyncState<UserServiceState>
  implements UserServiceType
{
  async getProfile(id: string): Promise<UserServiceState> {
    return this.execute(async () => {
      await delay(600);
      return {
        name: `User ${id}`,
        email: `user${id}@example.com`,
      };
    });
  }

  async updateProfile(
    id: string,
    updates: Partial<UserServiceState>
  ): Promise<UserServiceState> {
    return this.execute(async () => {
      await delay(500);

      // Get current profile first
      const currentProfile = await this.getProfile(id);

      const updatedProfile = {
        ...currentProfile,
        ...updates,
      };

      return updatedProfile;
    });
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.execute(async () => {
      await delay(400);

      // Simulate deletion logic
      if (Math.random() > 0.9) {
        throw new Error("Failed to delete user - server error");
      }

      return true;
    });
  }

  async searchUsers(query: string): Promise<UserServiceState[]> {
    return this.execute(async () => {
      await delay(800);

      // Simulate search results
      const mockUsers: UserServiceState[] = [
        {
          name: `${query} User 1`,
          email: `${query.toLowerCase()}1@example.com`,
        },
        {
          name: `${query} User 2`,
          email: `${query.toLowerCase()}2@example.com`,
        },
        {
          name: `${query} User 3`,
          email: `${query.toLowerCase()}3@example.com`,
        },
      ];

      return mockUsers.slice(0, Math.floor(Math.random() * 3) + 1); // Return 1-3 results
    });
  }
}

// Additional example: Generic async service interface pattern
export interface ApiServiceState {
  data: string;
  timestamp: Date;
}

export interface ApiServiceMethods {
  fetchData(): Promise<string>;
  fetchUserData(userId: string): Promise<string>;
  clearCache(): void;
}

// Generic interface for API service
export interface ApiServiceType extends AsyncState<string>, ApiServiceMethods {
  // Complete API service contract
}

// You could create multiple implementations of UserServiceType
@Service()
export class MockUserService
  extends AsyncState<UserServiceState>
  implements UserServiceType
{
  async getProfile(id: string): Promise<UserServiceState> {
    return this.execute(async () => {
      await delay(100); // Faster for testing
      return {
        name: `Mock User ${id}`,
        email: `mock${id}@test.com`,
      };
    });
  }

  async updateProfile(
    id: string,
    updates: Partial<UserServiceState>
  ): Promise<UserServiceState> {
    return this.execute(async () => {
      await delay(50);
      return {
        name: updates.name || `Mock User ${id}`,
        email: updates.email || `mock${id}@test.com`,
      };
    });
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.execute(async () => {
      await delay(50);
      return true; // Always succeed in mock
    });
  }

  async searchUsers(query: string): Promise<UserServiceState[]> {
    return this.execute(async () => {
      await delay(100);
      return [
        { name: `Mock ${query}`, email: `mock${query.toLowerCase()}@test.com` },
      ];
    });
  }
}

// Example of a more complex service interface
export interface UserPreferencesState {
  theme: "light" | "dark";
  language: string;
  notifications: boolean;
}

export interface UserPreferencesMethods {
  getPreferences(userId: string): Promise<UserPreferencesState>;
  updatePreferences(
    userId: string,
    prefs: Partial<UserPreferencesState>
  ): Promise<UserPreferencesState>;
  resetToDefaults(userId: string): Promise<UserPreferencesState>;
}

export interface UserPreferencesServiceType
  extends AsyncState<UserPreferencesState>,
    UserPreferencesMethods {
  // Complete preferences service contract
}

@Service()
export class UserPreferencesService
  extends AsyncState<UserPreferencesState>
  implements UserPreferencesServiceType
{
  async getPreferences(userId: string): Promise<UserPreferencesState> {
    return this.execute(async () => {
      await delay(300);
      return {
        theme: "light",
        language: "en",
        notifications: true,
      };
    });
  }

  async updatePreferences(
    userId: string,
    prefs: Partial<UserPreferencesState>
  ): Promise<UserPreferencesState> {
    return this.execute(async () => {
      await delay(400);

      const currentPrefs = await this.getPreferences(userId);
      return {
        ...currentPrefs,
        ...prefs,
      };
    });
  }

  async resetToDefaults(userId: string): Promise<UserPreferencesState> {
    return this.execute(async () => {
      await delay(200);
      return {
        theme: "light",
        language: "en",
        notifications: true,
      };
    });
  }
}
