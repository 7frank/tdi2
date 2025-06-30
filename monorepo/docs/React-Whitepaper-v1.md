# TDI2 + Valtio: The Complete Transformation of React Architecture

## Executive Summary

TDI2 (TypeScript Dependency Injection 2) combined with Valtio represents the most significant architectural evolution in React since hooks. By providing interface-based dependency injection at compile-time with reactive state management, this approach **eliminates props entirely** from React components, transforming them into pure templates while moving all state and business logic into injectable, reactive services.

This whitepaper demonstrates how TDI2's compile-time transformation, when integrated with Valtio's proxy-based reactivity, creates a new architectural foundation that rivals backend frameworks like Spring Boot in terms of modularity and testability, while achieving something impossible in traditional React: **zero-prop components that are automatically reactive**.

---

## The React Props Crisis

### The Fundamental Problem: Props Are an Anti-Pattern at Scale

React's component model, while elegant for small applications, creates insurmountable problems as applications grow:

```typescript
// Traditional React - The Props Explosion
function UserProfile({ 
  userId,                    // Business identifier
  userRole,                  // Authorization data
  permissions,               // Security context
  theme,                     // UI state
  sidebarOpen,              // Global UI state
  currentRoute,             // Router state
  notifications,            // Global notifications# TDI2 + Valtio: A Balanced Approach to React Service Architecture

## Executive Summary

TDI2 (TypeScript Dependency Injection 2) combined with Valtio represents a significant architectural advancement for React applications, particularly those with complex business logic and deep component hierarchies. Rather than eliminating all props, this approach strategically uses **compile-time dependency injection** to provide services where they add the most value, while preserving props for component configuration and presentation concerns.

This whitepaper presents a realistic assessment of when and how to apply service-oriented architecture in React, addressing both the benefits and limitations of the TDI2 + Valtio approach.

---

## The Real Problem: Selective Prop Drilling, Not All Props

### Props Serve Different Purposes

Not all props are created equal. The React ecosystem has conflated several distinct concerns under the umbrella of "props":

```typescript
// CONFIGURATION PROPS - These are good and should remain
function DataTable({ 
  columns,           // Component structure
  pageSize = 20,     // Behavior configuration  
  sortable = true,   // Feature toggles
  variant = 'default' // Presentation style
}) {
  // This component should be reusable with different configurations
}

// BUSINESS DATA PROPS - These cause prop drilling pain
function UserProfile({ 
  userId,            // Business identifier
  userPermissions,   // Authorization context
  currentUser,       // Domain entity
  organizationSettings, // Cross-cutting business rules
  onUserUpdate       // Business operation
}) {
  // This is where services shine
}
```

### The Actual Problem: Business Logic Prop Drilling

The pain point isn't props themselves, but **business context propagation**:

```typescript
// This is the real problem - business context drilling
function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [organization, setOrganization] = useState(null);
  
  return (
    <Layout 
      currentUser={currentUser}
      permissions={permissions}
      organization={organization}
    >
      <Dashboard 
        currentUser={currentUser}
        permissions={permissions}
        organization={organization}
        onUserUpdate={setCurrentUser}
      >
        <UserSection 
          currentUser={currentUser}
          permissions={permissions}
          onUserUpdate={setCurrentUser}
        >
          <UserProfile 
            currentUser={currentUser}
            permissions={permissions}
            onUserUpdate={setCurrentUser}
          />
        </UserSection>
      </Dashboard>
    </Layout>
  );
}
```

**This is where service injection provides clear value.**

---

## TDI2 + Valtio: The Technical Innovation

### Compile-Time Dependency Injection

TDI2's core innovation is **compile-time service injection** that eliminates runtime DI container overhead:

```typescript
// Development code with injection markers
interface UserProfileProps {
  services: {
    userService: Inject<UserServiceInterface>;
    authService: Inject<AuthServiceInterface>;
  };
  // Configuration props remain
  layout?: 'compact' | 'detailed';
  showAvatar?: boolean;
}

function UserProfile({ 
  services: { userService, authService },
  layout = 'detailed',
  showAvatar = true 
}: UserProfileProps) {
  const user = userService.state.currentUser;
  const permissions = authService.state.permissions;
  
  if (!user) return <LoginPrompt />;
  
  return (
    <div className={`profile-${layout}`}>
      {showAvatar && <Avatar src={user.avatar} />}
      <UserDetails user={user} permissions={permissions} />
    </div>
  );
}

// Production code after TDI2 transformation
function UserProfile({ 
  layout = 'detailed',
  showAvatar = true 
}: Omit<UserProfileProps, 'services'>) {
  // TDI2-TRANSFORMED: Auto-injected services with Valtio snapshots
  const userService = useService<UserServiceInterface>('UserService');
  const authService = useService<AuthServiceInterface>('AuthService');
  
  const userSnap = useSnapshot(userService.state);
  const authSnap = useSnapshot(authService.state);
  
  if (!userSnap.currentUser) return <LoginPrompt />;
  
  return (
    <div className={`profile-${layout}`}>
      {showAvatar && <Avatar src={userSnap.currentUser.avatar} />}
      <UserDetails user={userSnap.currentUser} permissions={authSnap.permissions} />
    </div>
  );
}
```

### Service Interface Design

Services should encapsulate **business domains**, not UI concerns:

```typescript
// Good: Domain-focused service
interface UserServiceInterface {
  state: {
    currentUser: User | null;
    profile: UserProfile | null;
    loading: boolean;
    lastUpdated: Date | null;
  };
  
  loadUser(userId: string): Promise<void>;
  updateProfile(updates: Partial<UserProfile>): Promise<void>;
  refreshCurrentUser(): Promise<void>;
  getCurrentUser(): User | null;
  hasLoadedUser(userId: string): boolean;
}

// Bad: UI-focused service (use props instead)
interface UIStateService {
  state: {
    modalOpen: boolean;
    sidebarCollapsed: boolean;
    tooltipVisible: boolean;
    buttonLoading: boolean;
  };
}
```

---

## Strategic Application: When to Use Services vs Props

### Use Services For:

**1. Cross-Component Business Logic**
```typescript
@Service()
class ShoppingCartService {
  state = {
    items: [] as CartItem[],
    total: 0,
    isLoading: false
  };
  
  addItem(product: Product): void {
    // Business logic that affects multiple components
    const existingItem = this.state.items.find(item => item.productId === product.id);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.state.items.push({ productId: product.id, quantity: 1, product });
    }
    this.recalculateTotal();
    this.persistToStorage();
  }
}

// Multiple components benefit without prop drilling
function CartIcon() {
  const cart = useService<ShoppingCartService>('ShoppingCartService');
  const cartSnap = useSnapshot(cart.state);
  return <Badge count={cartSnap.items.length} />;
}

function ProductCard({ product }: { product: Product }) {
  const cart = useService<ShoppingCartService>('ShoppingCartService');
  return (
    <button onClick={() => cart.addItem(product)}>
      Add to Cart
    </button>
  );
}
```

**2. Authentication and Authorization**
```typescript
@Service()
class AuthService implements AuthServiceInterface {
  state = {
    currentUser: null as User | null,
    permissions: [] as string[],
    isAuthenticated: false,
    loading: false
  };
  
  async login(credentials: LoginCredentials): Promise<void> {
    this.state.loading = true;
    try {
      const { user, token } = await this.authRepository.login(credentials);
      this.state.currentUser = user;
      this.state.permissions = user.roles.flatMap(role => role.permissions);
      this.state.isAuthenticated = true;
      this.tokenStorage.setToken(token);
    } finally {
      this.state.loading = false;
    }
  }
}
```

**3. Global Application State**
```typescript
@Service()
class AppStateService {
  state = {
    currentRoute: '/' as string,
    theme: 'light' as 'light' | 'dark',
    locale: 'en' as string,
    online: true
  };
  
  setTheme(theme: 'light' | 'dark'): void {
    this.state.theme = theme;
    document.body.className = `theme-${theme}`;
    localStorage.setItem('theme', theme);
  }
}
```

### Use Props For:

**1. Component Configuration**
```typescript
// Props are perfect for component behavior configuration
function DataTable({
  data,
  columns,
  pageSize = 20,
  sortable = true,
  filterable = false,
  variant = 'default',
  onRowClick
}: DataTableProps) {
  // This component should be reusable with different configurations
}
```

**2. Presentation and Styling**
```typescript
function Button({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  onClick
}: ButtonProps) {
  // These props define the button's appearance and behavior
}
```

**3. Event Handlers and Callbacks**
```typescript
function Modal({
  isOpen,
  onClose,
  title,
  children
}: ModalProps) {
  // Modal behavior is determined by props, not global state
}
```

---

## Addressing Service State Pollution

### The Problem: Monolithic Services

```typescript
// ANTI-PATTERN: Everything in one service
@Service()
class UIService {
  state = {
    // This violates separation of concerns
    userModalOpen: false,
    deleteModalOpen: false,
    settingsModalOpen: false,
    loadingButtonStates: {} as Record<string, boolean>,
    tooltipVisibility: {} as Record<string, boolean>,
    sidebarCollapsed: false,
    // ... 50 more UI states
  };
}
```

### Solution 1: Service Composition with Factories

```typescript
// Service factory for modal management
interface ModalServiceInterface {
  state: {
    isOpen: boolean;
    data: any;
  };
  open(data?: any): void;
  close(): void;
}

@ServiceFactory()
class ModalServiceFactory {
  createModalService(modalId: string): ModalServiceInterface {
    return new ModalService(modalId);
  }
}

@Service()
class ModalService implements ModalServiceInterface {
  state = {
    isOpen: false,
    data: null
  };
  
  constructor(private modalId: string) {}
  
  open(data?: any): void {
    this.state.isOpen = true;
    this.state.data = data;
  }
  
  close(): void {
    this.state.isOpen = false;
    this.state.data = null;
  }
}

// Usage with scoped injection
interface DeleteUserModalProps {
  services: {
    deleteModal: InjectScoped<ModalServiceInterface, 'deleteUserModal'>;
    userService: Inject<UserServiceInterface>;
  };
  user: User;
}

function DeleteUserModal({ 
  services: { deleteModal, userService },
  user 
}: DeleteUserModalProps) {
  const modalSnap = useSnapshot(deleteModal.state);
  
  if (!modalSnap.isOpen) return null;
  
  return (
    <Modal onClose={() => deleteModal.close()}>
      <p>Delete user {user.name}?</p>
      <button onClick={() => {
        userService.deleteUser(user.id);
        deleteModal.close();
      }}>
        Confirm Delete
      </button>
    </Modal>
  );
}
```

### Solution 2: Hierarchical Services

```typescript
// Domain-specific service hierarchies
@Service()
class UserManagementService {
  constructor(
    @Inject() private userService: UserServiceInterface,
    @Inject() private modalFactory: ModalServiceFactory
  ) {}
  
  private deleteModal = this.modalFactory.createModalService('userDelete');
  private editModal = this.modalFactory.createModalService('userEdit');
  
  openDeleteModal(user: User): void {
    this.deleteModal.open({ user });
  }
  
  openEditModal(user: User): void {
    this.editModal.open({ user });
  }
}
```

---

## Testing Strategy: Integration Over Isolation

### The Testing Reality

The original claim that "testing becomes easier" oversimplifies the testing landscape. The real benefit is **better separation of concerns for testing**:

**Service Testing (Business Logic)**
```typescript
describe('ShoppingCartService', () => {
  let cartService: ShoppingCartService;
  let mockRepository: MockCartRepository;
  
  beforeEach(() => {
    mockRepository = new MockCartRepository();
    cartService = new ShoppingCartService(mockRepository);
  });
  
  it('should calculate total correctly when adding items', async () => {
    const product = { id: '1', price: 10.99, name: 'Test Product' };
    
    cartService.addItem(product);
    cartService.addItem(product);
    
    expect(cartService.state.total).toBe(21.98);
    expect(cartService.state.items).toHaveLength(1);
    expect(cartService.state.items[0].quantity).toBe(2);
  });
});
```

**Component Testing (Presentation Logic)**
```typescript
describe('UserProfile', () => {
  it('should render user information with custom layout', () => {
    const mockUserService = createMockService<UserServiceInterface>({
      state: { 
        currentUser: mockUser,
        loading: false 
      }
    });
    
    render(
      <ServiceProvider services={{ userService: mockUserService }}>
        <UserProfile layout="compact" showAvatar={false} />
      </ServiceProvider>
    );
    
    expect(screen.getByText(mockUser.name)).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument(); // No avatar
    expect(screen.getByTestId('profile')).toHaveClass('profile-compact');
  });
});
```

**Integration Testing (The Real Value)**
```typescript
describe('User Management Flow', () => {
  it('should handle complete user editing workflow', async () => {
    const realUserService = new UserService(new MockUserRepository());
    const realAuthService = new AuthService(new MockAuthRepository());
    
    render(
      <ServiceProvider services={{ 
        userService: realUserService,
        authService: realAuthService 
      }}>
        <UserManagementPage />
      </ServiceProvider>
    );
    
    // Test the complete workflow with real service interactions
    await realAuthService.login({ email: 'test@example.com', password: 'password' });
    
    const editButton = screen.getByText('Edit Profile');
    fireEvent.click(editButton);
    
    const nameInput = screen.getByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: 'New Name' } });
    
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText('New Name')).toBeInTheDocument();
    });
    
    // Verify service state was updated
    expect(realUserService.state.currentUser?.name).toBe('New Name');
  });
});
```

---

## Server-Side Rendering Considerations

### The SSR Challenge

TDI2 + Valtio requires careful consideration for SSR environments:

```typescript
// Service state hydration strategy
interface ServiceHydrationData {
  userService: {
    currentUser: User | null;
    permissions: string[];
  };
  appState: {
    theme: 'light' | 'dark';
    locale: string;
  };
}

// Server-side service state extraction
export function extractServiceState(): ServiceHydrationData {
  const userService = getService<UserServiceInterface>('UserService');
  const appState = getService<AppStateService>('AppStateService');
  
  return {
    userService: {
      currentUser: userService.state.currentUser,
      permissions: userService.state.permissions
    },
    appState: {
      theme: appState.state.theme,
      locale: appState.state.locale
    }
  };
}

// Client-side hydration
export function hydrateServices(data: ServiceHydrationData): void {
  const userService = getService<UserServiceInterface>('UserService');
  const appState = getService<AppStateService>('AppStateService');
  
  // Hydrate service states
  Object.assign(userService.state, data.userService);
  Object.assign(appState.state, data.appState);
}
```

### Next.js Integration Example

```typescript
// pages/_app.tsx
function MyApp({ Component, pageProps, serviceData }: AppProps & { 
  serviceData: ServiceHydrationData 
}) {
  useEffect(() => {
    if (serviceData && typeof window !== 'undefined') {
      hydrateServices(serviceData);
    }
  }, [serviceData]);
  
  return (
    <ServiceProvider>
      <Component {...pageProps} />
    </ServiceProvider>
  );
}

// pages/profile.tsx
export async function getServerSideProps(context: GetServerSidePropsContext) {
  // Initialize services on server
  const userService = new UserService(new UserRepository());
  await userService.loadUser(context.params.userId);
  
  return {
    props: {
      serviceData: extractServiceState()
    }
  };
}
```

---

## Performance Analysis

### Bundle Size Impact

**Realistic Bundle Analysis:**
- TDI2 transformer: 0 bytes (compile-time only)
- Valtio runtime: ~2.9kb gzipped
- Service infrastructure: ~1-2kb gzipped
- Reduced Redux/Context boilerplate: -8-15kb
- **Net impact: Neutral to slightly positive for medium+ apps**

### Runtime Performance

**Rendering Optimization:**
```typescript
// Fine-grained reactivity with Valtio
function UserName() {
  const userService = useService<UserServiceInterface>('UserService');
  const userSnap = useSnapshot(userService.state);
  
  // Only re-renders when currentUser.name changes
  // Not when other user properties or loading state changes
  return <h1>{userSnap.currentUser?.name}</h1>;
}

function UserAvatar() {
  const userService = useService<UserServiceInterface>('UserService');
  const userSnap = useSnapshot(userService.state);
  
  // Independent re-rendering from UserName component
  return <img src={userSnap.currentUser?.avatar} alt="Avatar" />;
}
```

**Memory Considerations:**
- Services are singletons by default (shared across component instances)
- Valtio uses efficient proxy tracking with minimal overhead
- Automatic cleanup when no components subscribe to service state
- Potential memory leaks in poorly designed service event listeners

### Performance Recommendations

1. **Keep service state granular** - Use separate services for independent concerns
2. **Implement service cleanup** - Dispose of event listeners and subscriptions
3. **Use selective snapshots** - Only subscribe to needed state slices
4. **Monitor service state size** - Large objects in reactive state can impact performance

---

## Migration Strategy

### Phase 1: Identify Service Candidates (1-2 weeks)

Audit existing codebase for prop drilling patterns:

```typescript
// Look for these patterns:
// 1. Props passed through 3+ component levels unchanged
// 2. Multiple components needing the same business data
// 3. Complex useEffect chains for data fetching
// 4. State that affects components across different parts of the app

// Good candidates for service extraction:
- User authentication and profile data
- Shopping cart or selection state
- Application theme and preferences
- Real-time data that updates across components
- Form data that spans multiple steps/components
```

### Phase 2: Create Service Interfaces (1-2 weeks)

Design service contracts before implementation:

```typescript
// Define interfaces first
interface UserServiceInterface {
  state: {
    currentUser: User | null;
    loading: boolean;
    error: string | null;
  };
  
  loadUser(userId: string): Promise<void>;
  updateUser(updates: Partial<User>): Promise<void>;
  clearUser(): void;
}

// Implement with existing data layer
@Service()
class UserService implements UserServiceInterface {
  state = {
    currentUser: null as User | null,
    loading: false,
    error: null as string | null
  };
  
  constructor(@Inject() private userApi: UserApiService) {}
  
  async loadUser(userId: string): Promise<void> {
    this.state.loading = true;
    this.state.error = null;
    try {
      this.state.currentUser = await this.userApi.getUser(userId);
    } catch (error) {
      this.state.error = error.message;
    } finally {
      this.state.loading = false;
    }
  }
}
```

### Phase 3: Component Transformation (2-3 weeks)

Transform components incrementally:

```typescript
// Before: Props-heavy component
function UserProfile({ 
  userId, 
  user, 
  loading, 
  onUpdate,
  theme,
  permissions 
}: UserProfileProps) {
  // Component logic
}

// After: Service-injected component (keeping relevant props)
interface UserProfileProps {
  services: {
    userService: Inject<UserServiceInterface>;
    appState: Inject<AppStateService>;
  };
  layout?: 'compact' | 'detailed';  // Keep configuration props
  className?: string;               // Keep styling props
}

function UserProfile({ 
  services: { userService, appState },
  layout = 'detailed',
  className 
}: UserProfileProps) {
  const userSnap = useSnapshot(userService.state);
  const appSnap = useSnapshot(appState.state);
  
  if (userSnap.loading) return <ProfileSkeleton />;
  
  return (
    <div className={`profile-${layout} ${className} theme-${appSnap.theme}`}>
      <UserDetails user={userSnap.currentUser} />
      <ProfileActions onUpdate={(data) => userService.updateUser(data)} />
    </div>
  );
}
```

### Phase 4: Build Integration (1 week)

Configure TDI2 transformer:

```typescript
// vite.config.ts
import { tdi2Transformer } from '@tdi2/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    tdi2Transformer({
      srcDir: './src',
      enableValtioIntegration: true,
      serviceDiscoveryPatterns: ['**/*.service.ts'],
      generateDebugFiles: process.env.NODE_ENV === 'development'
    })
  ]
});
```

---

## Limitations and Trade-offs

### When NOT to Use This Approach

**1. Simple Applications**
- Static sites with minimal interactivity
- Basic CRUD apps without complex business logic
- Prototypes and proof-of-concepts

**2. Component Libraries**
- Reusable UI components should remain prop-based
- Libraries that need to work in different contexts
- Components that don't have business logic dependencies

**3. Performance-Critical Rendering**
- Real-time data visualization requiring 60fps updates
- Large lists with thousands of items
- Games or animations with tight render loops

### Technical Limitations

**1. Learning Curve**
- Teams need to understand dependency injection concepts
- Service design requires architectural thinking
- Debugging can be more complex with service interactions

**2. Tooling Maturity**
- TDI2 transformer needs comprehensive IDE support
- Debugging tools for service state inspection
- Hot module reloading with service state preservation

**3. Framework Lock-in**
- Applications become dependent on TDI2 + Valtio ecosystem
- Migration to other state management solutions becomes harder
- Custom transformer means build pipeline dependency

### Organizational Considerations

**1. Team Expertise**
- Requires developers comfortable with advanced TypeScript
- Service-oriented thinking may be new to frontend teams
- Testing strategies need to evolve

**2. Codebase Size**
- Benefits most apparent in medium to large applications
- Small teams might find it over-engineered
- Maintenance overhead of service interfaces

---

## Conclusion

TDI2 + Valtio represents a meaningful evolution in React architecture, but it's not a silver bullet. The approach provides the most value when applied strategically:

### Use Services For:
- Cross-component business logic and state
- Authentication and authorization
- Global application state
- Complex domain logic with multiple dependencies

### Keep Props For:
- Component configuration and presentation
- Event handlers and callbacks  
- Reusable UI component APIs
- Local component state

### The Real Innovation

The compile-time dependency injection combined with Valtio's reactivity creates a new architectural pattern that:

1. **Reduces prop drilling** where it causes real pain
2. **Centralizes business logic** in testable services
3. **Maintains component reusability** through configuration props
4. **Provides fine-grained reactivity** without manual optimization

This isn't about eliminating props entirely—it's about **using the right tool for the right job**. Services excel at managing business logic and cross-component state, while props remain perfect for component configuration and presentation concerns.

The future of React architecture likely involves this kind of hybrid approach: service-oriented for business concerns, component-oriented for presentation, with clear boundaries between the two domains.

---

## Further Reading

- [TDI2 Documentation](https://github.com/tdi2/docs)
- [Valtio Performance Guide](https://valtio.pmnd.rs/)
- [Service-Oriented Frontend Architecture Patterns](https://example.com)
- [React Testing Strategies with Services](https://example.com)
  onUpdateUser,             // Callback for updates
  onDeleteUser,             // Callback for deletion
  onNavigate,               // Navigation callback
  onThemeChange,            // Theme callback
  loading,                  // Async state
  error,                    // Error state
  retryCount,               // Retry logic
  lastUpdated               // Cache invalidation
}: UserProfileProps) {
  // Component drowning in props and state management
  const [localLoading, setLocalLoading] = useState(false);
  
  useEffect(() => {
    setLocalLoading(true);
    fetch(`/api/users/${userId}`)
      .then(handleSuccess)
      .catch(handleError)
      .finally(() => setLocalLoading(false));
  }, [userId, retryCount]);

  // Hundreds of lines of logic that should be in services...
}
```

**The cascading problems:**
- **Prop drilling hell** - Every level passes down unused props
- **Component coupling** - Deep dependency on parent component structure  
- **Testing nightmares** - Mocking 15+ props for each test
- **State synchronization** - Manual coordination between sibling components
- **Performance issues** - Over-rendering due to prop changes
- **Refactoring paralysis** - Moving components breaks prop chains

### The Context/Redux Partial Solution Still Fails

Even modern patterns like Context API and Redux don't solve the fundamental issue:

```typescript
// Redux/Context approach - Still coupled to React patterns
function UserProfile() {
  const dispatch = useDispatch();
  const userId = useSelector(state => state.auth.userId);
  const user = useSelector(state => state.users.currentUser);
  const loading = useSelector(state => state.users.loading);
  const theme = useSelector(state => state.ui.theme);
  
  useEffect(() => {
    if (userId) {
      dispatch(loadUser(userId)); // Still manual orchestration
    }
  }, [userId, dispatch]);

  // Component still manages state coordination logic
}
```

**Remaining issues:**
- Components still orchestrate business logic
- Manual dependency on global store shape
- Action creators spread throughout components  
- No real service boundaries or interfaces
- Testing still requires complex store mocking

---

## The TDI2 + Valtio Revolution: Services as Single Source of Truth

### The Paradigm Shift: From Props to Pure Templates

TDI2 + Valtio enables a radical architectural transformation where:

1. **All state lives in services** - No component state or props
2. **Services are automatically reactive** - Valtio proxies enable fine-grained updates
3. **Components become pure templates** - Only rendering logic remains
4. **Dependency injection is compile-time** - Zero runtime overhead
5. **Interface-based development** - Clean abstractions and easy testing

```typescript
// The New Architecture: Service-Centric, Zero Props

// 1. Domain interfaces define contracts
interface UserServiceInterface {
  state: {
    currentUser: User | null;
    loading: boolean;
    permissions: string[];
    profile: UserProfile | null;
  };
  loadUser(userId: string): Promise<void>;
  updateProfile(updates: Partial<UserProfile>): Promise<void>;
  hasPermission(permission: string): boolean;
}

interface AppStateService {
  state: {
    currentUserId: string | null;
    theme: 'light' | 'dark';
    sidebarOpen: boolean;
    currentRoute: string;
  };
  setCurrentUser(userId: string): void;
  setTheme(theme: 'light' | 'dark'): void;
  navigate(route: string): void;
}

// 2. Services implement interfaces with reactive state
@Service()
class UserService implements UserServiceInterface {
  state = {
    currentUser: null as User | null,
    loading: false,
    permissions: [] as string[],
    profile: null as UserProfile | null,
  };

  constructor(
    @Inject() private userRepository: UserRepository,
    @Inject() private appState: AppStateService
  ) {
    // Auto-react to app state changes - no useEffect needed!
    this.watchForUserChanges();
  }

  private watchForUserChanges(): void {
    subscribe(this.appState.state, () => {
      const userId = this.appState.state.currentUserId;
      if (userId) {
        this.loadUser(userId);
      } else {
        this.clearUser();
      }
    });
  }

  async loadUser(userId: string): Promise<void> {
    if (this.state.currentUser?.id === userId) return; // Smart caching
    
    this.state.loading = true;
    try {
      const [user, profile] = await Promise.all([
        this.userRepository.getUser(userId),
        this.userRepository.getProfile(userId)
      ]);
      
      this.state.currentUser = user;
      this.state.profile = profile;
      this.state.permissions = user.roles.flatMap(role => role.permissions);
    } finally {
      this.state.loading = false;
    }
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<void> {
    if (!this.state.currentUser) return;
    
    await this.userRepository.updateProfile(this.state.currentUser.id, updates);
    this.state.profile = { ...this.state.profile, ...updates };
  }

  hasPermission(permission: string): boolean {
    return this.state.permissions.includes(permission);
  }

  private clearUser(): void {
    this.state.currentUser = null;
    this.state.profile = null;
    this.state.permissions = [];
  }
}
```

### Component Transformation: From Complex Logic to Pure Templates

```typescript
// BEFORE TDI2: Component with props and complex logic
function UserProfile({ 
  userId, 
  userRole, 
  permissions, 
  theme, 
  onUpdate 
}: ComplexProps) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    setLoading(true);
    fetch(`/api/users/${userId}`)
      .then(response => response.json())
      .then(setUser)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [userId]);

  const handleUpdate = (updates) => {
    setLoading(true);
    updateUser(userId, updates)
      .then(updatedUser => {
        setUser(updatedUser);
        onUpdate(updatedUser);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div className={`profile theme-${theme}`}>
      <h1>{user?.name}</h1>
      <ProfileEditor user={user} onSave={handleUpdate} />
    </div>
  );
}

// AFTER TDI2 TRANSFORMATION: Pure template - NO PROPS!
export function UserProfile() {
  // TDI2-TRANSFORMED: UserProfile - Generated: 2025-06-30T10:30:00.000Z
  const userService = useService('UserService');     // Auto-injected service
  const appState = useService('AppStateService');    // Auto-injected service
  
  // Valtio automatically tracks state access for optimal re-rendering
  const userSnap = useSnapshot(userService.state);
  const appSnap = useSnapshot(appState.state);
  
  if (userSnap.loading) return <ProfileSkeleton />;
  if (!userSnap.currentUser) return <LoginPrompt />;
  
  return (
    <div className={`profile theme-${appSnap.theme}`}>
      <h1>{userSnap.currentUser.name}</h1>
      <ProfileEditor 
        profile={userSnap.profile}
        onSave={(updates) => userService.updateProfile(updates)}
        canEdit={userService.hasPermission('edit_profile')}
      />
    </div>
  );
}
```

### The Magic: Compile-Time Service Injection

TDI2's transformer analyzes your code and automatically:

1. **Detects service dependencies** from type annotations
2. **Generates injection hooks** with proper service tokens  
3. **Adds Valtio snapshots** for reactive state access
4. **Removes service props** from component interfaces
5. **Optimizes re-rendering** through fine-grained subscriptions

```typescript
// What you write (with DI markers):
interface UserProfileProps {
  services: {
    userService: Inject<UserServiceInterface>;
    appState: Inject<AppStateService>;
  };
}

export function UserProfile({ services: { userService, appState } }: UserProfileProps) {
  const user = userService.state.currentUser;
  const theme = appState.state.theme;
  
  return <div className={`profile theme-${theme}`}>{user?.name}</div>;
}

// What TDI2 generates (completely transformed):
export function UserProfile() {
  // Auto-generated DI hooks with Valtio integration
  const userService = useService('UserService');
  const appState = useService('AppStateService');
  
  // Auto-generated reactive snapshots
  const userSnap = useSnapshot(userService.state);
  const appSnap = useSnapshot(appState.state);
  
  return <div className={`profile theme-${appSnap.theme}`}>{userSnap.currentUser?.name}</div>;
}
```

---

## Complete Architecture Example: E-Commerce Without Props

### Service Layer: All Business Logic and State

```typescript
// Authentication and session management
@Service()
class AuthService {
  state = {
    currentUserId: null as string | null,
    isAuthenticated: false,
    user: null as User | null,
    permissions: [] as string[]
  };

  async login(credentials: LoginCredentials): Promise<void> {
    const { user, token } = await this.authRepository.login(credentials);
    this.state.currentUserId = user.id;
    this.state.isAuthenticated = true;
    this.state.user = user;
    this.state.permissions = user.roles.flatMap(role => role.permissions);
    
    // Other services automatically react to this change
  }

  logout(): void {
    this.state.currentUserId = null;
    this.state.isAuthenticated = false;
    this.state.user = null;
    this.state.permissions = [];
  }
}

// Product catalog with filtering and search
@Service()
class ProductCatalogService {
  state = {
    products: [] as Product[],
    categories: [] as Category[],
    currentCategory: null as string | null,
    searchQuery: '',
    filters: {} as ProductFilters,
    loading: false
  };

  constructor(@Inject() private productRepository: ProductRepository) {
    this.loadCategories();
    this.loadProducts();
  }

  setCategory(categoryId: string): void {
    this.state.currentCategory = categoryId;
    this.loadProducts(); // Automatically refresh
  }

  setSearch(query: string): void {
    this.state.searchQuery = query;
    this.debounceSearch(); // Auto-debounced search
  }

  async loadProducts(): Promise<void> {
    this.state.loading = true;
    try {
      const products = await this.productRepository.getProducts({
        category: this.state.currentCategory,
        search: this.state.searchQuery,
        filters: this.state.filters
      });
      this.state.products = products;
    } finally {
      this.state.loading = false;
    }
  }
}

// Shopping cart with persistence
@Service()
class ShoppingCartService {
  state = {
    items: [] as CartItem[],
    total: 0,
    itemCount: 0,
    loading: false
  };

  constructor(
    @Inject() private cartRepository: CartRepository,
    @Inject() private authService: AuthService
  ) {
    this.watchAuthChanges();
  }

  private watchAuthChanges(): void {
    subscribe(this.authService.state, () => {
      if (this.authService.state.currentUserId) {
        this.loadCart();
      } else {
        this.clearCart();
      }
    });
  }

  addProduct(product: Product, quantity: number = 1): void {
    const existing = this.state.items.find(item => item.productId === product.id);
    
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.state.items.push({
        productId: product.id,
        product,
        quantity,
        price: product.price
      });
    }
    
    this.recalculateTotal();
    this.persistCart(); // Auto-save
  }

  removeProduct(productId: string): void {
    this.state.items = this.state.items.filter(item => item.productId !== productId);
    this.recalculateTotal();
    this.persistCart();
  }

  private recalculateTotal(): void {
    this.state.total = this.state.items.reduce(
      (sum, item) => sum + (item.price * item.quantity), 
      0
    );
    this.state.itemCount = this.state.items.reduce(
      (sum, item) => sum + item.quantity, 
      0
    );
  }
}

// Application state and navigation
@Service()
class AppStateService {
  state = {
    currentRoute: '/' as string,
    theme: 'light' as 'light' | 'dark',
    sidebarOpen: false,
    notifications: [] as Notification[]
  };

  navigate(route: string): void {
    this.state.currentRoute = route;
    window.history.pushState({}, '', route);
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.state.theme = theme;
    document.body.className = `theme-${theme}`;
    localStorage.setItem('theme', theme);
  }

  toggleSidebar(): void {
    this.state.sidebarOpen = !this.state.sidebarOpen;
  }

  addNotification(notification: Notification): void {
    this.state.notifications.push({
      ...notification,
      id: Date.now().toString()
    });
  }
}
```

### Component Layer: Pure Templates with Zero Props

```typescript
// Root application - manages routing only
function App() {
  // TDI2 auto-generates these service injections
  const appState = useService('AppStateService');
  const auth = useService('AuthService');
  
  const appSnap = useSnapshot(appState.state);
  const authSnap = useSnapshot(auth.state);
  
  if (!authSnap.isAuthenticated) {
    return <LoginPage />;
  }
  
  return (
    <div className={`app theme-${appSnap.theme}`}>
      <Header />
      <Sidebar />
      <main className="app__content">
        {appSnap.currentRoute === '/' && <HomePage />}
        {appSnap.currentRoute === '/products' && <ProductCatalog />}
        {appSnap.currentRoute === '/cart' && <ShoppingCart />}
        {appSnap.currentRoute === '/profile' && <UserProfile />}
      </main>
      <Notifications />
    </div>
  );
}

// Header with cart indicator - no props needed
function Header() {
  const appState = useService('AppStateService');
  const cart = useService('ShoppingCartService');
  const auth = useService('AuthService');
  
  const appSnap = useSnapshot(appState.state);
  const cartSnap = useSnapshot(cart.state);
  const authSnap = useSnapshot(auth.state);
  
  return (
    <header className="header">
      <Logo onClick={() => appState.navigate('/')} />
      
      <SearchBar 
        onSearch={(query) => {
          appState.navigate('/products');
          // ProductCatalog will automatically use the search
        }}
      />
      
      <nav className="header__nav">
        <CartIcon 
          itemCount={cartSnap.itemCount}
          onClick={() => appState.navigate('/cart')}
        />
        
        <UserMenu 
          user={authSnap.user}
          onProfile={() => appState.navigate('/profile')}
          onLogout={() => auth.logout()}
        />
        
        <ThemeToggle 
          theme={appSnap.theme}
          onChange={(theme) => appState.setTheme(theme)}
        />
      </nav>
    </header>
  );
}

// Product catalog - automatically reactive to service state
function ProductCatalog() {
  const catalog = useService('ProductCatalogService');
  const cart = useService('ShoppingCartService');
  
  const catalogSnap = useSnapshot(catalog.state);
  
  return (
    <div className="product-catalog">
      <CategoryFilter 
        categories={catalogSnap.categories}
        currentCategory={catalogSnap.currentCategory}
        onSelectCategory={(id) => catalog.setCategory(id)}
      />
      
      <SearchInput 
        value={catalogSnap.searchQuery}
        onChange={(query) => catalog.setSearch(query)}
      />
      
      {catalogSnap.loading ? (
        <ProductGridSkeleton />
      ) : (
        <ProductGrid 
          products={catalogSnap.products}
          onAddToCart={(product) => cart.addProduct(product)}
        />
      )}
    </div>
  );
}

// Shopping cart - automatically synced across all components
function ShoppingCart() {
  const cart = useService('ShoppingCartService');
  const appState = useService('AppStateService');
  
  const cartSnap = useSnapshot(cart.state);
  
  if (cartSnap.items.length === 0) {
    return (
      <EmptyCart 
        onContinueShopping={() => appState.navigate('/products')}
      />
    );
  }
  
  return (
    <div className="shopping-cart">
      <CartItemList 
        items={cartSnap.items}
        onUpdateQuantity={(id, qty) => cart.updateQuantity(id, qty)}
        onRemoveItem={(id) => cart.removeProduct(id)}
      />
      
      <CartSummary 
        total={cartSnap.total}
        itemCount={cartSnap.itemCount}
        onCheckout={() => appState.navigate('/checkout')}
      />
    </div>
  );
}

// User profile - no userId prop needed!
function UserProfile() {
  const auth = useService('AuthService');
  const appState = useService('AppStateService');
  
  const authSnap = useSnapshot(auth.state);
  const appSnap = useSnapshot(appState.state);
  
  return (
    <div className={`user-profile theme-${appSnap.theme}`}>
      <ProfileHeader user={authSnap.user} />
      
      <ProfileTabs>
        <PersonalInfo user={authSnap.user} />
        <OrderHistory userId={authSnap.currentUserId} />
        <AccountSettings />
      </ProfileTabs>
    </div>
  );
}
```

---

## Revolutionary Benefits

### 1. Complete Elimination of Props Hell

**Before TDI2:**
```typescript
// 15+ props to manage
<UserProfile 
  userId={userId}
  userRole={userRole}
  permissions={permissions}
  theme={theme}
  sidebarOpen={sidebarOpen}
  currentRoute={currentRoute}
  onUpdateUser={onUpdateUser}
  onNavigate={onNavigate}
  onThemeChange={onThemeChange}
  loading={loading}
  error={error}
  retryCount={retryCount}
  // ... 8 more props
/>
```

**After TDI2:**
```typescript
// Zero props - everything comes from services
<UserProfile />
```

### 2. Automatic Cross-Component State Synchronization

```typescript
// Multiple components automatically stay in sync - no manual coordination
function CartIcon() {
  const cart = useService('ShoppingCartService');
  const cartSnap = useSnapshot(cart.state);
  return <Badge count={cartSnap.itemCount} />;
}

function ProductCard({ product }) {
  const cart = useService('ShoppingCartService');
  // When this runs, CartIcon automatically updates!
  return <button onClick={() => cart.addProduct(product)}>Add to Cart</button>;
}

function CartPage() {
  const cart = useService('ShoppingCartService');
  const cartSnap = useSnapshot(cart.state);
  // All three components automatically sync when cart changes
  return <div>Total: ${cartSnap.total}</div>;
}
```

### 3. Revolutionary Testing Experience

**Service Testing (Pure Business Logic):**
```typescript
describe('ShoppingCartService', () => {
  it('should add products correctly', () => {
    const cartRepo = new MockCartRepository();
    const authService = new MockAuthService();
    const cartService = new ShoppingCartService(cartRepo, authService);
    
    cartService.addProduct(mockProduct, 2);
    
    expect(cartService.state.itemCount).toBe(2);
    expect(cartService.state.total).toBe(mockProduct.price * 2);
  });
});
```

**Component Testing (Pure Templates):**
```typescript
describe('UserProfile', () => {
  it('should render user information', () => {
    const mockAuth = createMockService<AuthService>({
      state: { user: mockUser, isAuthenticated: true }
    });
    
    render(
      <DIProvider services={{ authService: mockAuth }}>
        <UserProfile />
      </DIProvider>
    );
    
    expect(screen.getByText(mockUser.name)).toBeInTheDocument();
  });
});
```

### 4. Environment-Based Service Configuration

```typescript
// Development services with debugging
@Service()
@Profile('development')
class DebugUserService implements UserServiceInterface {
  async loadUser(userId: string) {
    console.log(`🔍 Loading user: ${userId}`);
    const user = await this.userRepository.getUser(userId);
    console.log(`✅ Loaded user:`, user);
    return user;
  }
}

// Production services optimized for performance
@Service()
@Profile('production')
class OptimizedUserService implements UserServiceInterface {
  private cache = new Map();
  
  async loadUser(userId: string) {
    if (this.cache.has(userId)) {
      return this.cache.get(userId);
    }
    // ... optimized implementation
  }
}

// Test services with mocked data
@Service()
@Profile('test')
class MockUserService implements UserServiceInterface {
  state = { currentUser: mockUser, loading: false };
  async loadUser() { /* no-op */ }
}
```

### 5. Performance: Surgical Re-rendering

```typescript
// Valtio tracks exactly which properties are accessed
function UserName() {
  const auth = useService('AuthService');
  const authSnap = useSnapshot(auth.state);
  
  // Only re-renders when user.name changes, not other user properties
  return <h1>{authSnap.user?.name}</h1>;
}

function UserEmail() {
  const auth = useService('AuthService');
  const authSnap = useSnapshot(auth.state);
  
  // Only re-renders when user.email changes
  return <span>{authSnap.user?.email}</span>;
}

function UserAvatar() {
  const auth = useService('AuthService');
  const authSnap = useSnapshot(auth.state);
  
  // Only re-renders when user.avatar changes
  return <img src={authSnap.user?.avatar} />;
}
```

---

## Migration Strategy: From Props Hell to Pure Templates

### Phase 1: Service Extraction (1-2 sprints)

Extract business logic from components into services:

```typescript
// Before: Logic embedded in component
function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState(null);
  
  useEffect(() => {
    setLoading(true);
    fetch(`/api/products?category=${category}`)
      .then(r => r.json())
      .then(setProducts)
      .finally(() => setLoading(false));
  }, [category]);
  
  return <div>{products.map(p => <ProductCard key={p.id} product={p} />)}</div>;
}

// After: Logic moved to service
@Service()
class ProductCatalogService {
  state = {
    products: [] as Product[],
    loading: false,
    currentCategory: null as string | null
  };

  setCategory(categoryId: string): void {
    this.state.currentCategory = categoryId;
    this.loadProducts();
  }

  async loadProducts(): Promise<void> {
    this.state.loading = true;
    try {
      const products = await this.productRepository.getProducts({
        category: this.state.currentCategory
      });
      this.state.products = products;
    } finally {
      this.state.loading = false;
    }
  }
}
```

### Phase 2: Component Transformation (2-3 sprints)

Transform components to use dependency injection:

```typescript
// Add TDI2 markers to existing components
interface ProductListProps {
  services: {
    productCatalog: Inject<ProductCatalogService>;
  };
}

function ProductList({ services: { productCatalog } }: ProductListProps) {
  const catalogSnap = useSnapshot(productCatalog.state);
  
  return (
    <div>
      <CategoryFilter onSelect={(id) => productCatalog.setCategory(id)} />
      {catalogSnap.loading ? (
        <Spinner />
      ) : (
        catalogSnap.products.map(p => <ProductCard key={p.id} product={p} />)
      )}
    </div>
  );
}
```

### Phase 3: Build Integration (1 sprint)

Configure TDI2 transformer in build pipeline:

```typescript
// vite.config.ts
import { functionalDITransformer } from '@tdi2/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    functionalDITransformer({
      srcDir: './src',
      enableValtioIntegration: true,
      enableInterfaceResolution: true,
      generateDebugFiles: true
    })
  ]
});
```

### Phase 4: Props Elimination (2-3 sprints)

Remove all data props - components become pure templates:

```typescript
// Final result: Zero props, pure template
function ProductList() {
  // TDI2 auto-generates service injection
  const productCatalog = useService('ProductCatalogService');
  const catalogSnap = useSnapshot(productCatalog.state);
  
  return (
    <div>
      <CategoryFilter onSelect={(id) => productCatalog.setCategory(id)} />
      {catalogSnap.loading ? (
        <Spinner />
      ) : (
        catalogSnap.products.map(p => <ProductCard key={p.id} product={p} />)
      )}
    </div>
  );
}
```

---

## Performance and Scalability

### Build-Time Optimization

**Compile-Time Benefits:**
- Zero runtime DI container overhead
- Automatic dead code elimination
- Static analysis of dependency graphs
- Early detection of circular dependencies

**Bundle Impact:**
- TDI2 transformation: 0 bytes (compile-time only)
- Valtio runtime: ~2.9kb gzipped
- Eliminated dependencies: Redux (~11kb), Context boilerplate (~3kb), manual state logic (~5-10kb)
- **Net reduction: 15-20kb for typical applications**

### Runtime Performance

**Rendering Optimization:**
```typescript
// Before: Over-rendering due to prop changes
function Dashboard({ userId, theme, notifications, ... }) {
  // Re-renders when ANY prop changes, even unrelated ones
}

// After: Surgical re-rendering with Valtio tracking
function Dashboard() {
  const auth = useService('AuthService');
  const app = useService('AppStateService');
  
  // Only re-renders when specific accessed properties change
  const userSnap = useSnapshot(auth.state);    // Tracks: auth.state.user
  const appSnap = useSnapshot(app.state);      // Tracks: app.state.theme
  
  return <div className={`dashboard theme-${appSnap.theme}`}>{userSnap.user?.name}</div>;
}
```

**Memory Efficiency:**
- Services are singletons by default (shared across all components)
- Valtio uses WeakMap for minimal memory tracking overhead
- No prop drilling means less object creation in render cycles
- Automatic cleanup when components unmount

### Scalability Characteristics

**Team Scaling:**
- Clear service boundaries enable parallel development
- Interface-based development allows easy team coordination
- Service mocking enables independent feature development
- No prop drilling means refactoring doesn't break component trees

**Application Scaling:**
- Adding new features requires only new services
- Components automatically inherit new service capabilities
- No cascading prop changes when adding functionality
- Service composition enables complex feature interactions

---

## Comparison with Other Architectures

### vs. Traditional React + Redux

| Aspect | Traditional React + Redux | TDI2 + Valtio |
|--------|---------------------------|----------------|
| **Component Props** | 5-15 props per component | 0 props (pure templates) |
| **State Management** | Manual actions/reducers | Automatic reactive services |
| **Business Logic** | Scattered across components | Centralized in services |
| **Testing Complexity** | High (mock stores + props) | Low (inject service mocks) |
| **Refactoring Impact** | High (prop chain changes) | Minimal (service interfaces) |
| **Bundle Size** | +15-20kb (Redux + boilerplate) | +3kb (Valtio only) |
| **Learning Curve** | High (Redux patterns) | Medium (DI concepts) |
| **Type Safety** | Partial (action types) | Complete (interface-based) |

### vs. Vue 3 Composition API

**TDI2 + Valtio Advantages:**
- True dependency injection vs manual composable imports