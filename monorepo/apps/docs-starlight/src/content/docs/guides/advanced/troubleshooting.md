---
title: 'Troubleshooting & Architectural Considerations'
description: Comprehensive guide to React DI architectural challenges, potential problems, and production-ready solutions for enterprise applications.
---

This guide addresses the architectural challenges and potential problems when introducing Dependency Injection to React applications, with concrete solutions for enterprise teams.

## Problem Classification

- 🟢 **Solved** - Already addressed in current implementation
- 🟡 **Partially Solved** - Some aspects addressed, requires additional work  
- 🔴 **Not Solved** - Requires significant implementation effort
- ⚪ **Future Consideration** - May become relevant as system matures

## Production Readiness Quick Assessment

### ✅ **Production Ready Today**
- Core DI functionality, performance, type safety
- `useService` hook and component transformation  
- Testing framework and service mocking
- Interface-based resolution and container management

### 🔴 **Production Blockers** (4-6 days to resolve)
1. **@PostConstruct/@PreDestroy lifecycle** (3-5 days)
2. **State ownership guidelines** (1 day documentation)

### 🟡 **Nice-to-Have Enhancements**
- Enhanced debugging tools, React DevTools integration
- Advanced scoping models, SSR support

## Core Architectural Challenges

### 1. Hidden Dependencies 🟡 **Partially Solved**

**Problem**: Data flow becomes less explicit than traditional React props. Debugging requires DI graph introspection.

**Current State**:
- ✅ Interface-based resolution provides clear dependency contracts
- ✅ Compile-time validation catches missing implementations  
- ❌ Runtime dependency graph introspection is limited

**Solutions**:
```typescript
// ✅ Current debugging capability
container.debugContainer(); // Shows registered services

// 🔄 Planned enhancement
container.getDependencyGraph(); // Returns full dependency tree with visualization

// 🔄 React DevTools integration
<ServiceProvider container={container} debug={true}>
  <App />
</ServiceProvider>
```

**Enterprise Mitigation**:
- Document service interfaces clearly
- Use descriptive service and interface names
- Implement container debugging in development mode
- Create service dependency diagrams for complex applications

---

### 2. Render-Purity Pressure 🟢 **Solved**

**Problem**: React rendering must be pure. DI lookups must be referentially stable and side-effect-free.

**✅ Solution Implemented**:
```typescript
// ✅ Services resolved at container boundary, not during render
const userService = container.resolve<UserServiceInterface>("UserServiceInterface");

// ✅ Functional components get stable service references
function UserProfile({ userService }: { userService: Inject<UserServiceInterface> }) {
  // userService is stable across re-renders - no side effects
  const { currentUser } = userService.state;
  return <div>{currentUser?.name}</div>;
}
```

**Key Safeguards**:
- Services pre-registered at application startup
- No service creation during render cycle
- Stable references via singleton management
- Valtio handles reactive updates safely

---

### 3. State Ownership Conflict 🟡 **Partially Solved** 

**Problem**: Two parallel state models emerge - hooks vs services. Teams need guidance on state placement decisions.

**Current State**:
- ✅ Services use Valtio for reactive state management
- ✅ Clear separation: services for business logic, hooks for UI state
- ❌ No formal guidelines for state ownership decisions

**✅ Recommended Patterns**:
```typescript
// ✅ Service state: Business logic, cross-component concerns
@Service()
class UserService {
  state = { 
    currentUser: null as User | null, 
    isLoading: false 
  }; // Valtio reactive state
  
  async login(email: string, password: string) {
    // Business logic in services
  }
}

// ✅ Hook state: UI-specific, component-local concerns  
function UserForm() {
  const [formData, setFormData] = useState({}); // UI form state
  const userService = useService(UserServiceToken); // Business state
  
  return (
    <form onSubmit={() => userService.login(formData.email, formData.password)}>
      {/* Form UI */}
    </form>
  );
}
```

**Enterprise Guidelines**:
- **Services**: Authentication, API calls, cross-component state, business rules
- **Hooks**: Form input state, modal visibility, UI-specific toggles, animations
- **Rule**: If multiple components need it → Service. If only one component needs it → Hook.

---

### 4. Testing Model Change 🟡 **Partially Solved**

**Problem**: Unit tests shift from "render with props" to "render with container". 

**Current State**:
- ✅ Container-based testing patterns established
- ✅ Service mocking utilities available
- ❌ Migration guides for existing test suites incomplete

**✅ Testing Patterns**:
```typescript
// ✅ Service unit testing - Pure business logic
describe('UserService', () => {
  let userService: UserService;
  let mockApi: jest.Mocked<ApiServiceInterface>;

  beforeEach(() => {
    mockApi = { login: jest.fn(), logout: jest.fn() };
    userService = new UserService(mockApi);
  });

  it('should login successfully', async () => {
    mockApi.login.mockResolvedValue({ id: '1', name: 'John' });
    
    await userService.login('john@example.com', 'password');
    
    expect(userService.state.currentUser).toEqual({ id: '1', name: 'John' });
    expect(userService.state.isLoading).toBe(false);
  });
});

// ✅ Component testing with service mocks
describe('UserProfile', () => {
  it('should display user name', () => {
    const mockUserService = {
      state: { currentUser: { name: 'John Doe' }, isLoading: false },
      login: jest.fn(),
      logout: jest.fn()
    };

    render(<UserProfile userService={mockUserService} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});

// ✅ Integration testing with real container
describe('Login Flow Integration', () => {
  let container: DIContainer;

  beforeEach(() => {
    container = createTestContainer();
    container.register(ApiServiceInterface, () => new MockApiService());
  });

  it('should complete login flow', async () => {
    render(
      <DIProvider container={container}>
        <LoginForm />
      </DIProvider>
    );

    // Test full integration with real services
    const emailInput = screen.getByLabelText('Email');
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    
    const loginButton = screen.getByRole('button', { name: 'Login' });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText('Welcome, John')).toBeInTheDocument();
    });
  });
});
```

---

## Performance Considerations

### 5. Lookup Cost 🟢 **Solved**

**Problem**: Service resolution must be O(1), not O(n) reflection walks.

**✅ Solution**:
- O(1) token-based lookups implemented
- Compile-time resolution eliminates runtime overhead
- Pre-computed service registry with Map-based lookups

### 6. StrictMode Compatibility 🟢 **Solved**

**Problem**: React StrictMode double-invokes effects and constructors.

**✅ Solution**:
- Services created outside render cycle (at container level)
- No side effects in service constructors
- Idempotent service initialization patterns

### 7. Memory Management 🟢 **Solved**

**Problem**: Service references must be stable to prevent memory leaks.

**✅ Solution**:
- Singleton services provide stable references
- Automatic cleanup via container lifecycle management  
- Valtio proxy cleanup when services destroyed

---

## Advanced Scoping Challenges

### 8. Tree Scope 🔴 **Not Solved** (Medium Priority)

**Problem**: Need per-provider subtree scoping for multi-tenant or A/B variants.

**🔄 Planned Solution**:
```typescript
// Proposed tree scope implementation
<ServiceProvider overrides={[
  { provide: PaymentServiceInterface, useClass: StripePaymentService }
]}>
  <CheckoutFlow />
</ServiceProvider>

<ServiceProvider overrides={[
  { provide: PaymentServiceInterface, useClass: PayPalPaymentService }  
]}>
  <AlternateCheckoutFlow />
</ServiceProvider>
```

**Enterprise Workaround**:
- Use @Qualifier decorators for service variants
- Manual service factory pattern for tenant-specific services
- Configuration-driven service selection

### 9. Request Scope (SSR) 🔴 **Not Solved** (High Priority for SSR)

**Problem**: Server containers must never reuse mutable singletons across requests.

**🔄 Planned Solution**:
```typescript
// Proposed request-scoped containers
@Service()
@Scope("request")
class RequestContextService {
  constructor(private requestId: string) {}
}

// SSR-safe container per request  
const requestContainer = createRequestScopedContainer(httpRequest);
```

**Current SSR Recommendation**: 
- Use static generation instead of server-side rendering
- Client-side rendering with initial data loading
- Avoid server-side DI until request scoping implemented

---

## Common Failure Modes & Prevention

### 10. Service Creation During Render ⚠️ **Must Avoid**

**Risk**: Side effects doubled under StrictMode, performance degradation.

**✅ Prevention Implemented**:
```typescript
// ✅ Correct: Services created at container level
const container = new DIContainer();
container.loadConfiguration(DI_CONFIG);

function App() {
  return (
    <DIProvider container={container}>
      <UserProfile /> {/* Service injected, not created */}
    </DIProvider>
  );
}

// ❌ Wrong: Service creation in render
function UserProfile() {
  const userService = new UserService(); // Violates React purity
  return <div>{userService.state.user.name}</div>;
}
```

### 11. Circular Dependencies ⚠️ **Partially Addressed**

**Risk**: Runtime deadlocks or undefined initialization order.

**Current State**:
- ✅ Basic circular dependency detection with clear error messages
- ❌ Advanced dependency cycle resolution needed

**✅ Prevention Patterns**:
```typescript
// ✅ Good: Interface segregation prevents cycles
interface UserServiceInterface {
  getCurrentUser(): User | null;
}

interface AuthServiceInterface {
  login(email: string, password: string): Promise<void>;
}

// Services depend on interfaces, not concrete classes
@Service()
class UserService implements UserServiceInterface {
  constructor(@Inject() private auth: AuthServiceInterface) {}
}

@Service()  
class AuthService implements AuthServiceInterface {
  constructor(@Inject() private userRepo: UserRepositoryInterface) {}
  // No direct dependency on UserService
}
```

### 12. Token Collisions ⚠️ **Prevented**

**Risk**: Hard-to-debug service overrides from naming conflicts.

**✅ Prevention**:
- Interface-based tokens prevent string collisions
- Compile-time validation catches duplicate registrations
- TypeScript ensures type safety at resolution

---

## Enterprise Production Checklist

### Before Deployment

**✅ Architecture Review**:
- [ ] Service interfaces clearly defined with documentation
- [ ] Dependency graph documented and reviewed for cycles
- [ ] State ownership patterns documented and consistent
- [ ] Testing strategy covers services, components, and integration

**✅ Performance Review**:
- [ ] Bundle size impact measured and acceptable
- [ ] Service initialization profiled for performance
- [ ] Memory usage patterns verified in production scenarios
- [ ] Hot reload performance acceptable in development

**✅ Team Readiness**:
- [ ] Team trained on DI patterns and service design principles  
- [ ] Code review guidelines updated for service architecture
- [ ] Debugging workflows established for DI-specific issues
- [ ] Migration plan documented for existing components

### Monitoring & Operations

**✅ Production Monitoring**:
```typescript
// Service health monitoring
@Service()
class HealthService {
  @PostConstruct
  initialize() {
    // Register health checks for critical services
    this.healthRegistry.register('database', () => this.databaseService.isHealthy());
    this.healthRegistry.register('api', () => this.apiService.isHealthy());
  }
}

// Performance monitoring
container.onServiceResolution((serviceName, duration) => {
  if (duration > 100) {
    console.warn(`Slow service resolution: ${serviceName} took ${duration}ms`);
  }
});
```

**🔄 Debugging Tools (Planned)**:
- Service dependency visualization
- Runtime performance metrics
- Memory leak detection for service lifecycle
- Hot reload impact analysis

---

## Migration Risk Mitigation

### Gradual Adoption Strategy

**Phase 1**: Start with new features
```typescript
// New features use TDI2 patterns  
@Service()
class NewFeatureService {
  // Clean DI implementation
}

// Existing components remain unchanged during transition
function ExistingComplexComponent() {
  // Keep current patterns temporarily
  const [state, setState] = useState();
  // ... existing logic
}
```

**Phase 2**: Refactor complex components gradually
```typescript
// Before: Complex component with mixed concerns
function ComplexComponent(props) {
  // 100+ lines of state management, API calls, business logic
}

// After: Simple template with service injection  
function ComplexComponent({ 
  dataService, 
  uiService 
}: {
  dataService: Inject<DataServiceInterface>;
  uiService: Inject<UIServiceInterface>;
}) {
  const { data, loading } = dataService.state;
  return loading ? <Spinner /> : <DataView data={data} />;
}
```

**Phase 3**: Enterprise-wide adoption with full team buy-in

### Risk Assessment Matrix

| Risk Category | Probability | Impact | Mitigation Strategy |
|--------------|-------------|---------|-------------------|
| **Team Learning Curve** | High | Medium | Training, documentation, gradual rollout |
| **Performance Regression** | Low | High | Profiling, monitoring, performance testing |
| **Bundle Size Growth** | Medium | Low | Tree-shaking analysis, code splitting |
| **Testing Complexity** | Medium | Medium | Clear testing patterns, utility libraries |
| **SSR Complications** | High | High | Avoid SSR initially, plan request scoping |

The key to successful TDI2 adoption is understanding these architectural trade-offs and implementing appropriate safeguards for your specific enterprise requirements.