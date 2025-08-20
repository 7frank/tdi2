export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface UserProfile extends User {
  addresses: Address[];
  preferences: UserPreferences;
}

export interface Address {
  id: string;
  type: 'billing' | 'shipping';
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export interface UserPreferences {
  newsletter: boolean;
  notifications: boolean;
  preferredCategories: string[];
}