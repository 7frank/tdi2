# Quick Start Guide
## Get RSI Running in 15 Minutes

---

## Installation

```bash
npm install @tdi2/core @tdi2/vite-plugin valtio
```

---

## 1. Configure Build Pipeline

```typescript
// vite.config.ts
import { functionalDITransformer } from '@tdi2/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    functionalDITransformer({
      srcDir: './src',
      enableValtioIntegration: true,
      enableInterfaceResolution: true
    })
  ]
});
```

---

## 2. Create Your First Service

```typescript
// services/UserService.ts
import { Service, Inject } from '@tdi2/core';

interface UserServiceInterface {
  state: {
    currentUser: User | null;
    loading: boolean;
  };
  loadUser(id: string): Promise<void>;
  updateUser(updates: Partial<User>): Promise<void>;
}

@Service()
class UserService implements UserServiceInterface {
  state = {
    currentUser: null as User | null,
    loading: false
  };

  constructor(
    @Inject() private userRepository: UserRepository
  ) {}

  async loadUser(id: string): Promise<void> {
    this.state.loading = true;
    try {
      this.state.currentUser = await this.userRepository.getUser(id);
    } finally {
      this.state.loading = false;
    }
  }

  async updateUser(updates: Partial<User>): Promise<void> {
    if (!this.state.currentUser) return;
    
    const updated = await this.userRepository.updateUser(
      this.state.currentUser.id, 
      updates
    );
    this.state.currentUser = updated;
  }
}
```

---

## 3. Create Repository (Data Layer)

```typescript
// repositories/UserRepository.ts
interface UserRepository {
  getUser(id: string): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
}

@Service()
class ApiUserRepository implements UserRepository {
  async getUser(id: string): Promise<User> {
    const response = await fetch(`/api/users/${id}`);
    return response.json();
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const response = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return response.json();
  }
}
```

---

## 4. Transform Your Component

```typescript
// components/UserProfile.tsx
interface UserProfileProps {
  userService: Inject<UserServiceInterface>;
}

function UserProfile({ userService }: UserProfileProps) {
  const user = userService.state.currentUser;
  const loading = userService.state.loading;

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>No user found</div>;

  return (
    <div className="user-profile">
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      <button 
        onClick={() => userService.updateUser({ name: 'New Name' })}
      >
        Update Name
      </button>
    </div>
  );
}

export default UserProfile;
```

---

## 5. Setup DI Provider

```typescript
// App.tsx
import { DIProvider } from '@tdi2/react';

function App() {
  return (
    <DIProvider>
      <UserProfile />  {/* No props needed - DI handles it */}
    </DIProvider>
  );
}
```

---

## What Happens Next

1. **TDI2 transformer** automatically converts your component
2. **Services get injected** using compile-time magic
3. **Valtio makes state reactive** - components auto-update when service state changes
4. **Zero props** - components become pure templates

---

## Your Component After Transformation

```typescript
// What TDI2 generates (you don't write this):
function UserProfile() {
  // Auto-generated service injection
  const userService = useService('UserService');
  
  // Auto-generated reactive snapshots
  const userSnap = useSnapshot(userService.state);
  
  if (userSnap.loading) return <div>Loading...</div>;
  if (!userSnap.currentUser) return <div>No user found</div>;

  return (
    <div className="user-profile">
      <h1>{userSnap.currentUser.name}</h1>
      <p>{userSnap.currentUser.email}</p>
      <button 
        onClick={() => userService.updateUser({ name: 'New Name' })}
      >
        Update Name
      </button>
    </div>
  );
}
```

---

## Next Steps

- **[Service Patterns](./Service-Patterns.md)** - Learn advanced service patterns
- **[Component Guide](./Component-Guide.md)** - Transform existing components  
- **[Enterprise Implementation](./Enterprise-Implementation.md)** - Scale to large teams

---

## Common Issues

**Build errors?** Check your tsconfig.json includes decorator support:
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

**Services not injecting?** Ensure your component uses the `Inject<>` type annotation.

**State not updating?** Verify Valtio integration is enabled in your config.