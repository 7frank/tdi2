import { Service, Inject } from '@tdi2/di-core/decorators';
import { User, UserProfile, Address } from '../types/User';
import { UserRepositoryInterface } from '../repositories/UserRepository';

export interface UserServiceInterface {
  state: {
    currentUser: User | null;
    isAuthenticated: boolean;
    profile: UserProfile | null;
    loading: boolean;
    error: string | null;
  };
  login(email: string, password: string): Promise<boolean>;
  logout(): void;
  register(userData: Omit<User, 'id'>): Promise<boolean>;
  updateProfile(profileData: Partial<UserProfile>): Promise<void>;
  addAddress(address: Omit<Address, 'id'>): Promise<void>;
  removeAddress(addressId: string): void;
  setDefaultAddress(addressId: string): void;
}

@Service()
export class UserService implements UserServiceInterface {
  state = {
    currentUser: null as User | null,
    isAuthenticated: false,
    profile: null as UserProfile | null,
    loading: false,
    error: null as string | null
  };

  constructor(
    @Inject() private userRepository: UserRepositoryInterface
  ) {
    this.initializeAuth();
  }

  private async initializeAuth(): Promise<void> {
    // Check for existing session (in real app, validate token)
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      try {
        const user = await this.userRepository.findById(storedUserId);
        if (user) {
          this.setAuthenticatedUser(user);
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        localStorage.removeItem('userId');
      }
    }
  }

  async login(email: string, password: string): Promise<boolean> {
    this.state.loading = true;
    this.state.error = null;

    try {
      // Simple demo authentication (in real app, validate against API)
      const user = await this.userRepository.findByEmail(email);
      
      if (user && (email === 'demo@example.com' || password === 'password')) {
        this.setAuthenticatedUser(user);
        localStorage.setItem('userId', user.id);
        return true;
      } else {
        this.state.error = 'Invalid email or password';
        return false;
      }
    } catch (error) {
      this.state.error = 'Login failed. Please try again.';
      console.error('Login error:', error);
      return false;
    } finally {
      this.state.loading = false;
    }
  }

  logout(): void {
    this.state.currentUser = null;
    this.state.isAuthenticated = false;
    this.state.profile = null;
    this.state.error = null;
    localStorage.removeItem('userId');
  }

  async register(userData: Omit<User, 'id'>): Promise<boolean> {
    this.state.loading = true;
    this.state.error = null;

    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(userData.email);
      if (existingUser) {
        this.state.error = 'User with this email already exists';
        return false;
      }

      const newUser = await this.userRepository.createUser(userData);
      this.setAuthenticatedUser(newUser);
      localStorage.setItem('userId', newUser.id);
      return true;
    } catch (error) {
      this.state.error = 'Registration failed. Please try again.';
      console.error('Registration error:', error);
      return false;
    } finally {
      this.state.loading = false;
    }
  }

  async updateProfile(profileData: Partial<UserProfile>): Promise<void> {
    if (!this.state.currentUser) {
      throw new Error('User not authenticated');
    }

    this.state.loading = true;
    this.state.error = null;

    try {
      const updatedProfile = await this.userRepository.updateProfile(
        this.state.currentUser.id,
        profileData
      );
      
      this.state.profile = updatedProfile;
      
      // Update current user if basic info changed
      if (profileData.name || profileData.email) {
        this.state.currentUser = {
          ...this.state.currentUser,
          name: profileData.name || this.state.currentUser.name,
          email: profileData.email || this.state.currentUser.email
        };
      }
    } catch (error) {
      this.state.error = 'Failed to update profile';
      console.error('Profile update error:', error);
      throw error;
    } finally {
      this.state.loading = false;
    }
  }

  async addAddress(addressData: Omit<Address, 'id'>): Promise<void> {
    if (!this.state.profile) {
      throw new Error('User profile not loaded');
    }

    const newAddress: Address = {
      ...addressData,
      id: Date.now().toString(),
      isDefault: this.state.profile.addresses.length === 0 // First address is default
    };

    // If this is set as default, unset others
    if (newAddress.isDefault) {
      this.state.profile.addresses.forEach(addr => addr.isDefault = false);
    }

    this.state.profile.addresses.push(newAddress);
    
    // Update in repository
    await this.updateProfile({ addresses: this.state.profile.addresses });
  }

  removeAddress(addressId: string): void {
    if (!this.state.profile) return;

    const addressIndex = this.state.profile.addresses.findIndex(addr => addr.id === addressId);
    if (addressIndex === -1) return;

    const wasDefault = this.state.profile.addresses[addressIndex].isDefault;
    this.state.profile.addresses.splice(addressIndex, 1);

    // If we removed the default address, make the first remaining address default
    if (wasDefault && this.state.profile.addresses.length > 0) {
      this.state.profile.addresses[0].isDefault = true;
    }
  }

  setDefaultAddress(addressId: string): void {
    if (!this.state.profile) return;

    this.state.profile.addresses.forEach(addr => {
      addr.isDefault = addr.id === addressId;
    });
  }

  private setAuthenticatedUser(user: User): void {
    this.state.currentUser = user;
    this.state.isAuthenticated = true;
    
    // Initialize profile with default values
    this.state.profile = {
      ...user,
      addresses: [],
      preferences: {
        newsletter: true,
        notifications: true,
        preferredCategories: []
      }
    };
  }

  get defaultShippingAddress(): Address | null {
    if (!this.state.profile) return null;
    return this.state.profile.addresses.find(addr => 
      addr.type === 'shipping' && addr.isDefault
    ) || this.state.profile.addresses.find(addr => addr.isDefault) || null;
  }

  get defaultBillingAddress(): Address | null {
    if (!this.state.profile) return null;
    return this.state.profile.addresses.find(addr => 
      addr.type === 'billing' && addr.isDefault
    ) || this.state.profile.addresses.find(addr => addr.isDefault) || null;
  }
}