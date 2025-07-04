# Service Patterns Guide
## Building Reactive Services for Enterprise React

---

## Core Service Structure

```typescript
interface ServiceInterface {
  state: {
    // All reactive state here
  };
  // Business methods here
}

@Service()
class MyService implements ServiceInterface {
  state = {
    // Initialize with defaults
  };

  constructor(
    @Inject() private dependency: SomeDependency
  ) {
    // Setup reactive subscriptions if needed
  }

  // Business logic methods
}
```

---

## Pattern 1: Data Management Service

**Perfect for: API data, CRUD operations, caching**

```typescript
interface UserServiceInterface {
  state: {
    users: User[];
    currentUser: User | null;
    loading: boolean;
    error: string | null;
  };
  loadUsers(): Promise<void>;
  loadUser(id: string): Promise<void>;
  createUser(userData: CreateUserRequest): Promise<void>;
  updateUser(id: string, updates: Partial<User>): Promise<void>;
  deleteUser(id: string): Promise<void>;
}

@Service()
class UserService implements UserServiceInterface {
  state = {
    users: [] as User[],
    currentUser: null as User | null,
    loading: false,
    error: null as string | null
  };

  constructor(
    @Inject() private userRepository: UserRepository,
    @Inject() private notificationService: NotificationService
  ) {}

  async loadUsers(): Promise<void> {
    this.state.loading = true;
    this.state.error = null;
    
    try {
      this.state.users = await this.userRepository.getUsers();
    } catch (error) {
      this.state.error = error.message;
      this.notificationService.showError('Failed to load users');
    } finally {
      this.state.loading = false;
    }
  }

  async createUser(userData: CreateUserRequest): Promise<void> {
    try {
      const newUser = await this.userRepository.createUser(userData);
      this.state.users.push(newUser);
      this.notificationService.showSuccess('User created successfully');
    } catch (error) {
      this.notificationService.showError('Failed to create user');
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    try {
      const updatedUser = await this.userRepository.updateUser(id, updates);
      
      // Update in list
      const index = this.state.users.findIndex(u => u.id === id);
      if (index !== -1) {
        this.state.users[index] = updatedUser;
      }
      
      // Update current user if it's the same
      if (this.state.currentUser?.id === id) {
        this.state.currentUser = updatedUser;
      }
      
      this.notificationService.showSuccess('User updated successfully');
    } catch (error) {
      this.notificationService.showError('Failed to update user');
      throw error;
    }
  }
}
```

---

## Pattern 2: Application State Service

**Perfect for: Global UI state, routing, theme, notifications**

```typescript
interface AppStateServiceInterface {
  state: {
    currentRoute: string;
    theme: 'light' | 'dark';
    sidebarOpen: boolean;
    notifications: Notification[];
    loading: boolean;
  };
  navigate(route: string): void;
  setTheme(theme: 'light' | 'dark'): void;
  toggleSidebar(): void;
  addNotification(notification: Notification): void;
  removeNotification(id: string): void;
  setGlobalLoading(loading: boolean): void;
}

@Service()
class AppStateService implements AppStateServiceInterface {
  state = {
    currentRoute: '/',
    theme: 'light' as 'light' | 'dark',
    sidebarOpen: false,
    notifications: [] as Notification[],
    loading: false
  };

  constructor() {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      this.state.theme = savedTheme;
    }
    
    // Listen to browser navigation
    this.setupRouterListener();
  }

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
    const id = Date.now().toString();
    this.state.notifications.push({ ...notification, id });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      this.removeNotification(id);
    }, 5000);
  }

  removeNotification(id: string): void {
    this.state.notifications = this.state.notifications.filter(n => n.id !== id);
  }

  private setupRouterListener(): void {
    window.addEventListener('popstate', () => {
      this.state.currentRoute = window.location.pathname;
    });
  }
}
```

---

## Pattern 3: Business Logic Service

**Perfect for: Complex calculations, business rules, workflows**

```typescript
interface OrderServiceInterface {
  state: {
    currentOrder: Order | null;
    calculatedTotals: OrderTotals | null;
    validationErrors: ValidationError[];
    canCheckout: boolean;
  };
  createOrder(): void;
  addItem(product: Product, quantity: number): void;
  removeItem(productId: string): void;
  updateQuantity(productId: string, quantity: number): void;
  applyDiscount(discountCode: string): Promise<void>;
  validateOrder(): boolean;
  checkout(): Promise<void>;
}

@Service()
class OrderService implements OrderServiceInterface {
  state = {
    currentOrder: null as Order | null,
    calculatedTotals: null as OrderTotals | null,
    validationErrors: [] as ValidationError[],
    canCheckout: false
  };

  constructor(
    @Inject() private orderRepository: OrderRepository,
    @Inject() private discountService: DiscountService,
    @Inject() private authService: AuthService
  ) {
    // Watch for auth changes
    this.watchAuthChanges();
  }

  createOrder(): void {
    this.state.currentOrder = {
      id: Date.now().toString(),
      userId: this.authService.state.currentUserId,
      items: [],
      discounts: [],
      createdAt: new Date()
    };
    this.recalculateOrder();
  }

  addItem(product: Product, quantity: number): void {
    if (!this.state.currentOrder) this.createOrder();
    
    const existingItem = this.state.currentOrder.items.find(
      item => item.productId === product.id
    );
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.state.currentOrder.items.push({
        productId: product.id,
        product,
        quantity,
        price: product.price
      });
    }
    
    this.recalculateOrder();
  }

  async applyDiscount(discountCode: string): Promise<void> {
    if (!this.state.currentOrder) return;
    
    try {
      const discount = await this.discountService.validateDiscount(
        discountCode, 
        this.state.currentOrder
      );
      
      this.state.currentOrder.discounts.push(discount);
      this.recalculateOrder();
    } catch (error) {
      throw new Error(`Invalid discount code: ${discountCode}`);
    }
  }

  validateOrder(): boolean {
    this.state.validationErrors = [];
    
    if (!this.state.currentOrder) {
      this.state.validationErrors.push({ field: 'order', message: 'No order exists' });
      return false;
    }
    
    if (this.state.currentOrder.items.length === 0) {
      this.state.validationErrors.push({ field: 'items', message: 'Order must have items' });
    }
    
    if (!this.authService.state.isAuthenticated) {
      this.state.validationErrors.push({ field: 'auth', message: 'Must be logged in' });
    }
    
    this.state.canCheckout = this.state.validationErrors.length === 0;
    return this.state.canCheckout;
  }

  private recalculateOrder(): void {
    if (!this.state.currentOrder) return;
    
    const subtotal = this.state.currentOrder.items.reduce(
      (sum, item) => sum + (item.price * item.quantity), 
      0
    );
    
    const discountAmount = this.state.currentOrder.discounts.reduce(
      (sum, discount) => sum + discount.amount, 
      0
    );
    
    const tax = (subtotal - discountAmount) * 0.08;
    const total = subtotal - discountAmount + tax;
    
    this.state.calculatedTotals = {
      subtotal,
      discountAmount,
      tax,
      total
    };
    
    this.validateOrder();
  }

  private watchAuthChanges(): void {
    subscribe(this.authService.state, () => {
      if (!this.authService.state.isAuthenticated) {
        this.state.currentOrder = null;
        this.state.calculatedTotals = null;
      }
      this.validateOrder();
    });
  }
}
```

---

## Pattern 4: Cross-Service Communication

**Services can react to each other automatically:**

```typescript
@Service()
class DashboardService {
  state = {
    widgets: [] as Widget[],
    refreshing: false
  };

  constructor(
    @Inject() private userService: UserServiceInterface,
    @Inject() private orderService: OrderServiceInterface,
    @Inject() private appState: AppStateServiceInterface
  ) {
    // Auto-refresh when user changes
    subscribe(this.userService.state, () => {
      if (this.userService.state.currentUser) {
        this.refreshDashboard();
      }
    });
    
    // Auto-update when orders change
    subscribe(this.orderService.state, () => {
      this.updateOrderWidgets();
    });
    
    // Only refresh when on dashboard route
    subscribe(this.appState.state, () => {
      if (this.appState.state.currentRoute === '/dashboard') {
        this.refreshDashboard();
      }
    });
  }

  private async refreshDashboard(): Promise<void> {
    this.state.refreshing = true;
    try {
      // Load fresh dashboard data
      await this.loadWidgets();
    } finally {
      this.state.refreshing = false;
    }
  }
}
```

---

## Pattern 5: Repository Interface

**Perfect for: Data access layer, API abstraction, testing**

```typescript
interface UserRepository {
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User>;
  createUser(userData: CreateUserRequest): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
}

// Production implementation
@Service()
@Profile('production')
class ApiUserRepository implements UserRepository {
  async getUsers(): Promise<User[]> {
    const response = await fetch('/api/users');
    return response.json();
  }
  
  async getUser(id: string): Promise<User> {
    const response = await fetch(`/api/users/${id}`);
    return response.json();
  }
  
  // ... other methods
}

// Development implementation with logging
@Service()
@Profile('development')
class DebugUserRepository implements UserRepository {
  constructor(@Inject() private apiRepo: ApiUserRepository) {}
  
  async getUsers(): Promise<User[]> {
    console.log('🔍 Loading users...');
    const users = await this.apiRepo.getUsers();
    console.log('✅ Loaded users:', users.length);
    return users;
  }
  
  // ... other methods with debugging
}

// Test implementation
@Service()
@Profile('test')
class MockUserRepository implements UserRepository {
  private users: User[] = [
    { id: '1', name: 'Test User', email: 'test@example.com' }
  ];
  
  async getUsers(): Promise<User[]> {
    return [...this.users];
  }
  
  async getUser(id: string): Promise<User> {
    const user = this.users.find(u => u.id === id);
    if (!user) throw new Error('User not found');
    return user;
  }
  
  // ... other methods with mock data
}
```

---

## Best Practices

### 1. State Structure
- Keep state flat and simple
- Use TypeScript interfaces for state shape
- Initialize with sensible defaults

### 2. Error Handling
- Always handle async errors
- Use notification service for user feedback
- Set error state for UI to respond

### 3. Performance
- Only subscribe to state you actually use
- Batch related state updates
- Use computed properties for derived state

### 4. Testing
- Create interface-based services
- Use profile-based implementations
- Mock at the service level, not component level

---

## Next Steps

- **[Component Guide](./Component-Guide.md)** - Transform components to use services
- **[Enterprise Implementation](./Enterprise-Implementation.md)** - Scale patterns to large teams
- **[Migration Strategy](./Migration-Strategy.md)** - Move existing apps to RSI