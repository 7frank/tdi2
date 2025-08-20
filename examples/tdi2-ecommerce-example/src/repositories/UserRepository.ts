import { User, UserProfile } from '../types/User';
import { Service } from '@tdi2/di-core';

export interface UserRepositoryInterface {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  createUser(user: Omit<User, 'id'>): Promise<User>;
  updateProfile(id: string, profile: Partial<UserProfile>): Promise<UserProfile>;
}

@Service()
export class UserRepository implements UserRepositoryInterface {
  private users: Map<string, User> = new Map([
    ['1', {
      id: '1',
      email: 'demo@example.com',
      name: 'Demo User',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop'
    }]
  ]);

  async findById(id: string): Promise<User | null> {
    await this.delay(100);
    return this.users.get(id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    await this.delay(150);
    const user = Array.from(this.users.values()).find(u => u.email === email);
    return user || null;
  }

  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    await this.delay(200);
    const id = Date.now().toString();
    const user: User = { id, ...userData };
    this.users.set(id, user);
    return user;
  }

  async updateProfile(id: string, profileData: Partial<UserProfile>): Promise<UserProfile> {
    await this.delay(150);
    const user = this.users.get(id);
    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = { ...user, ...profileData };
    this.users.set(id, updatedUser);
    
    return updatedUser as UserProfile;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}