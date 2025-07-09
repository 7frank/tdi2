---
title: "Beyond Hooks Hell: How Service Injection Fixes React's Broken Architecture"
subtitle: "Leipzig.js Meetup - January 2025"
author: "7Frank"
date: "2025"
---

# Beyond Hooks Hell
## How Service Injection Fixes React's Broken Architecture

*Leipzig.js Meetup - January 2025*

**7Frank**  
*Building the future of React architecture*

Note: Welcome to Leipzig.js! Tonight we're going to challenge everything you think you know about React architecture. I'm going to show you how to eliminate useEffect and props from React components entirely.

---

## Opening Hook: Hooks Hell Survivors 🙋‍♀️🙋‍♂️

**"Hooks hell survivors - raise your hands!"**

**Follow-up polls:**
- Who likes hooks? 
- How many useEffects in your worst component? 1? 2? 3? 4? **5???**
- Who knows Spring Boot?
- Who's tired of React/hooks not providing structure besides hooks?

**Promise:** *"I'll show you the same functionality with zero hooks, zero props, and automatic synchronization"*

Note: Let's start with brutal honesty. How many of you have written components with 5+ useEffects? Don't be shy - we've all been there. Tonight I'm going to show you a way out of this madness.

---

# Act I: React's Scaling Crisis
## 📈💥 The Evidence

---

## React's Official useEffect Example

```typescript
// From React docs - "the right way" to fetch data
function Profile({ userId }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    
    fetchUser(userId).then(result => {
      if (!ignore) {
        setUser(result);
        setLoading(false);
      }
    }).catch(err => {
      if (!ignore) {
        setError(err);
        setLoading(false);
      }
    });

    return () => { ignore = true; };
  }, [userId]);

  // More useEffects for other concerns...
}
```

**This is the "simple" example!**

Note: This is straight from the React documentation. Look at this complexity for basic data fetching. Race conditions, cleanup functions, dependency arrays - and this is just the beginning.

---

## Props Hell in the Wild

```typescript
// 😰 Real production React component
function UserDashboard({ 
  userId, userRole, permissions, theme, sidebarOpen,
  currentRoute, notifications, onUpdateUser, onNavigate, 
  onThemeChange, loading, error, retryCount, lastUpdated,
  cartItems, preferences, locale, timezone, analyticsId,
  featureFlags, apiEndpoint, authToken
  // ... and 5 more props because why not? 😵
}: ComplexProps) {
  
  useEffect(() => { /* manual orchestration */ }, [userId, theme, retryCount]);
  useEffect(() => { /* more manual work */ }, [currentRoute, permissions]);
  useEffect(() => { /* even more coordination */ }, [notifications, locale]);
  
  return <div>Welcome to props and hooks hell!</div>;
}
```

**Testing this requires mocking 20+ props!**

Note: This is what we see every day in Leipzig's tech companies. The component is drowning in props and useEffects. Every change requires touching multiple files.

---

## Testing Nightmare

```typescript
// Traditional React testing - 50+ lines of setup
describe('UserDashboard', () => {
  const mockStore = createMockStore();
  const mockQueryClient = new QueryClient();
  
  const wrapper = ({ children }) => (
    <Provider store={mockStore}>
      <QueryClientProvider client={mockQueryClient}>
        <ThemeProvider theme={mockTheme}>
          <AuthProvider>
            <Router>
              <NotificationProvider>
                {children}
              </NotificationProvider>
            </Router>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  );
  
  beforeEach(() => {
    // 20+ lines of mock setup
    mockStore.dispatch = jest.fn();
    // ... more boilerplate
  });
  
  it('should render', () => {
    // Finally test something
  });
});
```

**Provider hell + props mocking = testing nightmare**

Note: Look at this test setup. Provider hell, complex mocking, brittle tests. And this is just to test if a component renders!

---

## The Root Cause Analysis

### Mixed Concerns Everywhere
- **UI components** contain business logic
- **Business logic** scattered across hooks
- **State management** manual and error-prone
- **Side effects** everywhere with useEffect

### No Architectural Boundaries
- Functional components become **God Objects**
- "Just put it in a hook" mentality
- No clear separation of responsibilities
- Every team invents their own patterns

### Architecture Debt Accumulation
- Each "solution" creates new problems
- Redux → Context → Zustand → Next solution
- Complexity compounds with each layer

Note: This is the fundamental problem. React doesn't provide architectural guidance, so we end up with chaos disguised as "flexibility."

---

# Act II: Side-by-Side Comparison
## 💻✨ Same Functionality, Different World

---

## Example 1: Data Fetching Transformation

### Traditional React (React Docs Pattern)
```typescript
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    
    fetchUser(userId).then(result => {
      if (!ignore) {
        setUser(result);
        setLoading(false);
      }
    }).catch(err => {
      if (!ignore) {
        setError(err);
        setLoading(false);
      }
    });

    return () => { ignore = true; };
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!user) return <div>No user found</div>;

  return <div>{user.name}</div>;
}
```

**Problems:** Manual state management, race conditions, cleanup complexity

Note: This is the official React pattern. Notice the complexity for basic data fetching - race conditions, cleanup, manual state coordination.

---

## Service Injection Alternative

### Clean Service Layer
```typescript
// 1. Service Interface
interface UserServiceInterface {
  state: { user: User | null; loading: boolean; error: string | null };
  loadUser(id: string): Promise<void>;
}

// 2. Service Implementation  
@Service()
class UserService implements UserServiceInterface {
  state = { user: null, loading: false, error: null };

  constructor(@Inject() private userRepository: UserRepository) {}

  async loadUser(id: string): Promise<void> {
    this.state.loading = true;
    this.state.error = null;
    
    try {
      this.state.user = await this.userRepository.getUser(id);
    } catch (error) {
      this.state.error = error.message;
    } finally {
      this.state.loading = false;
    }
  }
}
```

**Benefits:** Clean separation, no race conditions, automatic reactivity

Note: Look at this service. Clean, testable, no race conditions. The business logic is completely separated from the UI.

---

## Pure Template Component

```typescript
// 3. Component becomes pure template
function UserProfile({ userService }: {
  userService: Inject<UserServiceInterface>;
}) {
  // No useState, no useEffect - everything from service!
  const { user, loading, error } = userService.state;

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>No user found</div>;

  return <div>{user.name}</div>;
}
```

### After TDI2 Transformation:
```typescript
// What TDI2 generates - NO PROPS NEEDED!
function UserProfile() {
  const userService = useService('UserService'); // Auto-injected
  const { user, loading, error } = useSnapshot(userService.state);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>No user found</div>;

  return <div>{user.name}</div>;
}
```

**Result:** Pure template, automatic reactivity, zero props!

Note: The component becomes a pure template. No hooks, no manual state management, no props drilling. Just clean rendering logic.

---

## Example 2: Enterprise Forms

### Traditional React Form
```typescript
function HealthcareForm({ patientId, onSubmit, permissions }) {
  const [patient, setPatient] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPatient(patientId).then(setPatient);
  }, [patientId]);

  useEffect(() => {
    if (patient) {
      setFormData(patient.medicalRecord);
    }
  }, [patient]);

  const validateForm = (data) => {
    // Complex validation logic mixed with component
  };

  const handleSubmit = async (data) => {
    setSaving(true);
    const validationErrors = validateForm(data);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setSaving(false);
      return;
    }
    // More complex form logic...
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields with manual coordination */}
    </form>
  );
}
```

**Problems:** Mixed concerns, complex state coordination, testing nightmare

Note: Look at this healthcare form. Business logic mixed with UI, manual validation, complex state coordination. Every change touches multiple concerns.

---

## Service-Driven Form

```typescript
// Clean service architecture
@Service()
class PatientFormService implements PatientFormServiceInterface {
  state = {
    patient: null as Patient | null,
    formData: {} as MedicalRecord,
    errors: {} as ValidationErrors,
    loading: false,
    saving: false
  };

  constructor(
    @Inject() private patientRepository: PatientRepository,
    @Inject() private validationService: ValidationService,
    @Inject() private authService: AuthService
  ) {}

  async loadPatient(id: string): Promise<void> {
    this.state.loading = true;
    try {
      this.state.patient = await this.patientRepository.getPatient(id);
      this.state.formData = { ...this.state.patient.medicalRecord };
    } finally {
      this.state.loading = false;
    }
  }

  async saveForm(): Promise<void> {
    this.state.errors = this.validationService.validate(this.state.formData);
    
    if (Object.keys(this.state.errors).length > 0) return;

    this.state.saving = true;
    try {
      await this.patientRepository.updateMedicalRecord(
        this.state.patient.id, 
        this.state.formData
      );
    } finally {
      this.state.saving = false;
    }
  }

  updateField(field: string, value: any): void {
    this.state.formData[field] = value;
    // Real-time validation
    this.state.errors = this.validationService.validateField(field, value);
  }
}
```

Note: The service handles all business logic - validation, data access, state coordination. Clean, testable, reusable across different forms.

---

## Pure Form Template

```typescript
// Form becomes pure template
function HealthcareForm() {
  const patientForm = useService('PatientFormService');
  const auth = useService('AuthService');
  
  const formSnap = useSnapshot(patientForm.state);
  const authSnap = useSnapshot(auth.state);

  if (formSnap.loading) return <FormSkeleton />;
  if (!authSnap.permissions.includes('edit_medical')) {
    return <UnauthorizedMessage />;
  }

  return (
    <form onSubmit={() => patientForm.saveForm()}>
      <MedicalRecordFields 
        data={formSnap.formData}
        errors={formSnap.errors}
        onChange={(field, value) => patientForm.updateField(field, value)}
        disabled={formSnap.saving}
      />
      <SubmitButton loading={formSnap.saving} />
    </form>
  );
}
```

**Benefits:** Clean separation, reusable validation, automatic state sync

Note: The form component is now a pure template. Business logic is in services, validation is reusable, and state automatically syncs across components.

---

# Act III: Technology Deep Dive
## 🔧 How RSI Actually Works

---

## The Magic: Compile-Time Transformation

### What You Write (With DI Markers):
```typescript
interface UserProfileProps {
  services: {
    userService: Inject<UserServiceInterface>;
    appService: Inject<AppServiceInterface>;
  };
}

function UserProfile({ services: { userService, appService } }: UserProfileProps) {
  const user = userService.state.currentUser;
  const theme = appService.state.theme;
  
  return (
    <div className={`profile theme-${theme}`}>
      {user?.name}
    </div>
  );
}
```

### What TDI2 Generates (Autowired):
```typescript
function UserProfile() {
  // TDI2-TRANSFORMED: Auto-injected services like Spring Boot @Autowired
  const userService = useService('UserService');
  const appService = useService('AppService');
  
  // Valtio reactive snapshots - surgical re-rendering
  const userSnap = useSnapshot(userService.state);
  const appSnap = useSnapshot(appService.state);
  
  return (
    <div className={`profile theme-${appSnap.theme}`}>
      {userSnap.currentUser?.name}
    </div>
  );
}
```

Note: TDI2 analyzes your code at compile time and automatically generates the service injection code. Zero runtime overhead, perfect TypeScript integration.

---

## Spring Boot for React: Familiar Patterns

### If You Know Spring Boot, You Already Get RSI

```java
// Spring Boot - Familiar backend pattern
@RestController
public class UserController {
    
    @Autowired
    private UserService userService;
    
    @GetMapping("/users/{id}")
    public User getUser(@PathVariable String id) {
        return userService.findById(id);
    }
}
```

```typescript
// RSI - Same pattern for React
function UserProfile() {
    // Auto-injected like @Autowired
    const userService = useService('UserService');
    const userSnap = useSnapshot(userService.state);
    
    return <div>{userSnap.currentUser?.name}</div>;
}
```

**Same architectural thinking, React implementation**

Note: If you've worked with Spring Boot, RSI will feel immediately familiar. Same dependency injection patterns, same service-oriented thinking, but optimized for React.

---

## TypeScript-First Architecture

### Interface-Driven Development
```typescript
// 1. Define contracts with interfaces
interface UserServiceInterface {
  state: {
    currentUser: User | null;
    loading: boolean;
  };
  loadUser(id: string): Promise<void>;
  hasPermission(permission: string): boolean;
}

interface UserRepository {
  getUser(id: string): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
}

// 2. Services implement interfaces
@Service()
class UserService implements UserServiceInterface {
  constructor(@Inject() private userRepo: UserRepository) {}
  // Implementation...
}

// 3. Easy to swap implementations
@Service()
@Profile('test')
class MockUserService implements UserServiceInterface {
  // Test implementation
}
```

**Compile-time safety + runtime flexibility**

Note: Everything is built with TypeScript interfaces first. This gives you compile-time safety while maintaining the flexibility to swap implementations for testing or different environments.

---

## The Complete Stack

### TDI2: TypeScript Dependency Injection 2
- **Compile-time transformation** (zero runtime overhead)
- **Interface-based autowiring**
- **Spring Boot-style patterns**
- **Perfect TypeScript integration**

### Valtio: Reactive State Management
- **Proxy-based reactivity** (like Vue 3)
- **Surgical re-rendering** (only changed properties)
- **2.9kb gzipped** (vs 11kb Redux Toolkit)
- **No actions, reducers, or selectors needed**

### Architecture Layers
- **Services**: Business logic and state
- **Repositories**: Data access abstraction  
- **Interfaces**: Contracts between layers
- **Components**: Pure presentation templates

Note: This is a complete architectural stack that brings enterprise patterns to React without the complexity of frameworks like Angular.

---

# Act IV: Why This Matters
## 🏗️ Enterprise Benefits & Industry Context

---

## Enterprise Benefits

### Team Scalability
- **Parallel development**: Clear service boundaries prevent conflicts
- **Interface contracts**: Teams can work independently
- **Standardized patterns**: Consistent architecture across projects
- **Easy onboarding**: Familiar patterns for backend developers

### Testing Revolution
```typescript
// Service testing - Pure business logic
describe('UserService', () => {
  it('should load user correctly', async () => {
    const mockRepo = { getUser: jest.fn().mockResolvedValue(mockUser) };
    const service = new UserService(mockRepo);
    
    await service.loadUser('123');
    
    expect(service.state.currentUser).toBe(mockUser);
  });
});

// Component testing - Pure templates
describe('UserProfile', () => {
  it('should render user name', () => {
    const mockService = { state: { currentUser: mockUser } };
    render(<UserProfile userService={mockService} />);
    
    expect(screen.getByText(mockUser.name)).toBeInTheDocument();
  });
});
```

**Clean separation: Business logic ≠ UI testing**

Note: Finally, we can test business logic separately from UI rendering. Service tests are fast and focused, component tests are simple and reliable.

---

## SOLID Principles: Finally Achieved in React

### ✅ Single Responsibility
- Components: **Only rendering**
- Services: **Only business logic**
- Repositories: **Only data access**

### ✅ Open/Closed  
- Extend functionality via **new services**
- No component modification needed

### ✅ Liskov Substitution
- **Interface-based service swapping**
- Mock implementations for testing

### ✅ Interface Segregation
- **Eliminates prop drilling entirely**
- Focused, cohesive service interfaces

### ✅ Dependency Inversion
- Depend on **service abstractions**
- Not concrete implementations

**For the first time, React can achieve enterprise-grade architecture**

Note: This is huge. React has never been able to achieve proper SOLID compliance. RSI makes it natural and automatic.

---

## Learning from Angular: What React Missed

### Angular's Success in Enterprise
```typescript
// Angular - Dependency injection since day one
@Component({
  selector: 'user-profile',
  template: '<div>{{user.name}}</div>'
})
export class UserProfileComponent {
  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {}
}
```

### What React Lacked
- **No dependency injection** - manual imports everywhere
- **No service architecture** - business logic in components  
- **No architectural guidance** - every team invents patterns
- **No enterprise patterns** - hooks don't scale

### RSI Brings Angular's Best to React
- Dependency injection **without the complexity**
- Service architecture **without the opinions**
- Enterprise patterns **without the learning curve**

Note: Angular succeeded in enterprise because of its structured approach. React's flexibility became chaos at scale. RSI gives us structure without sacrificing React's simplicity.

---

## Backend Wisdom Applied to Frontend

### Repository Pattern
```typescript
interface UserRepository {
  getUser(id: string): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
}

@Service()
class ApiUserRepository implements UserRepository {
  async getUser(id: string): Promise<User> {
    return fetch(`/api/users/${id}`).then(r => r.json());
  }
}

@Service()
@Profile('test')  
class MockUserRepository implements UserRepository {
  async getUser(id: string): Promise<User> {
    return mockUsers[id];
  }
}
```

### Service Layer Pattern
```typescript
@Service()
class UserService {
  constructor(@Inject() private userRepo: UserRepository) {}
  
  async loadUser(id: string): Promise<void> {
    // Business logic here
    this.state.user = await this.userRepo.getUser(id);
  }
}
```

**Proven patterns from decades of backend development**

Note: These patterns have been proven in backend development for decades. Why should frontend be different? RSI brings this wisdom to React.

---

# Closing: The Call to Action
## 🚀 Community & Vision

---

## Start Experimenting Today

### GitHub Repository: **github.com/7frank/tdi2**
- **Complete examples** and documentation
- **Migration guides** for existing projects  
- **Open source** - contribute via PRs
- **Community support** - open issues for questions

### Getting Started
```bash
# Try it in your next project
npm install @tdi2/di-core @tdi2/vite-plugin-di valtio

# Add to vite.config.ts
import { diEnhancedPlugin } from '@tdi2/vite-plugin-di';

export default defineConfig({
  plugins: [
    react(),
    diEnhancedPlugin({
      enableFunctionalDI: true,
      enableInterfaceResolution: true
    })
  ]
});
```

### Migration Strategy
- **Start small**: Extract one service from a complex component
- **Incremental adoption**: Migrate component by component
- **Team learning**: Pair program during transformation
- **Measure impact**: Track props reduction and test simplification

Note: You don't need to rewrite everything. Start with your most painful component and see the difference RSI makes.

---

## The Vision: React's Evolution

### From View Library to Application Framework
- **Current React**: Component-centric chaos
- **Future React**: Service-centric clarity
- **Architecture**: Finally structured and scalable
- **Developer Experience**: From chaos to clarity

### Potential Ecosystem Impact
- **Redux/Zustand** → Replaced by reactive services
- **React Query** → Data fetching moves to services
- **Context API** → Eliminated by dependency injection  
- **Testing libraries** → Focus shifts to service testing
- **Component libraries** → Pure UI, no state concerns

### The Angular Moment
- **Hooks introduction**: Changed how we write components
- **RSI adoption**: Could change how we architect applications
- **Industry impact**: React becomes truly enterprise-ready

**This could be as significant as the introduction of hooks**

Note: We're potentially looking at React's next evolutionary leap. From view library to application framework, with proper architectural guidance.

---

## Community Call to Action

### For You Tonight
- **Try RSI** in a side project this weekend
- **Share your experience** - tweet, blog, discuss
- **Join the conversation** on GitHub and Discord
- **Contribute** with examples, docs, or code

### For Leipzig.js Community  
- **Discussion group**: Let's form a study group
- **Follow-up meetup**: Deep dive into implementation
- **Company adoption**: Share experiences from your teams
- **Open source contributions**: Help build the ecosystem

### For the React Ecosystem
- **Framework integration**: Next.js, Remix adoption
- **Library adaptation**: Component libraries supporting RSI
- **Educational content**: Tutorials, courses, workshops
- **Community standards**: Best practices and conventions

**The future of React architecture starts with early adopters like you**

Note: This is where movements begin - in meetups like this, with developers like you who are willing to try new approaches and share their experiences.

---

## Final Questions for Tonight

### Interactive Closing
1. **"Who's willing to try this in their next project?"** 🙋‍♀️🙋‍♂️
2. **"Who thinks this could actually fix React's scaling problems?"**
3. **"Any Spring Boot developers excited about familiar patterns in React?"**
4. **"What concerns do you have about adoption?"**

### Contact & Follow-up
- **GitHub**: github.com/7frank/tdi2
- **Questions**: Open issues or discussions
- **Examples**: Complete working demos available
- **Community**: Discord link in the repo

**Let's discuss how RSI could work for your team!**

Note: I want to hear from you. What resonates? What concerns you? How could this help your current projects? Let's start the discussion that could shape React's future.

---

## Thank You Leipzig.js! 

### The Revolution Starts Here

**React Service Injection could fundamentally transform how we build React applications**

- From hooks hell to **pure templates**
- From props drilling to **automatic synchronization**  
- From testing complexity to **service simplicity**
- From architectural chaos to **enterprise patterns**

**The future of React architecture is service-centric**

*Let's build it together! 🚀*

Note: Thank you for your attention and engagement tonight! The future of React architecture is in our hands. Every revolution starts with early adopters willing to try something new. Let's make React truly enterprise-ready, together!