---
title: "React for Enterprise: How Service Injection might fix one of Reacts greatest issues"
subtitle: "Leipzig.js Meetup - August 2025"
author: "7Frank"
date: "2025"
---

# React for Enterprise

## How Service Injection might fix one of Reacts greatest issues

_Leipzig.js Meetup - August 2025_

**Frank Reimann M.Sc.** Software Engineer @ Jambit

**github.com/7frank**

**Follow along with slides**

![https://github.com/7frank/tdi2/blob/main/docs/SlideDecks/slides/Meetup-Leipzig.js/slides2.md](./frame.png)

Note: Hey everyone! Great to have you here on the stream today - we'll start shortly, just getting everything set up. For those joining us live at Leipzig.js, welcome! And for everyone watching the stream, thanks for tuning in. </br></br> Welcome again, tonight we'll explore how coupling is one of the root causes of React's scaling problems and demonstrate a service injection solution that has the potential of bringing enterprise-grade architecture to React. We've got some really exciting examples to show you, and there will be live coding after the presentation where we can build something together.

---

## WHOAMI

- developing software since 2003 privately or in companies
- currently employed at [jambit.com](https://www.jambit.com/)
  - doing fullstack,architecture and ai
- collecting tech skills like others collect pokemon
  - [roadmap.sh/u/7frank](https://roadmap.sh/u/7frank)

> but for this presentation important infos are

- jquery 2011-2017
- react since 2018 on and off
- angular, vue, java
  - current favorite is svelte 5 with runes api

Note: Companies: Frelancing, public german televion ARD/MDR, Check24 <br/><br/> I'll try to talk in english for the mayority of the time but might switch back to german in case i need to explain certain more complex details

---

## Try It Yourself Right Now!

**Basic Example - Get started in 2 minutes:**

```bash
npx degit 7frank/tdi2/examples/tdi2-basic-example di-react-example
cd di-react-example
npm i
npm run dev
```

**Enterprise Example:**  
https://github.com/7frank/tdi2/tree/main/examples/tdi2-enterprise-forms-example

**Features advanced patterns:**

- Services for business logic
- Controllers for view state logic
- Real-world enterprise forms

**Try these examples after the presentation - we'll do live coding together!**

Note: I'll show you how to get started, and after the presentation we can do some live coding together. The basic example shows the core concepts, while the enterprise example demonstrates how this scales to complex business applications with proper separation between business logic and view state.

---

## Agenda

**Tonight's Journey:**

1. **The Problem** - React's scaling challenges
2. **Proven Solutions** - How backend & Angular solved this
3. **Service Injection** - The React solution
4. **Benefits** - Testing, architecture, SOLID principles
5. **Getting Started** - Migration & examples
6. **Live Coding** - After the presentation

Note: This is our roadmap for tonight. We'll start with the fundamental problems, show proven solutions from other frameworks, then demonstrate how to bring those patterns to React.

---

## The Problem: React at Scale

**6 years of React development led to this realization:**

_Hooks and props are fundamentally incompatible with enterprise architecture_

- 🔥 **Component complexity** grows exponentially
- 🔥 **Testing becomes nightmare** with mixed concerns
- 🔥 **Team coordination** breaks down due to coupling

**Tonight's thesis:** _Coupling is the root cause, dependency injection is the proven solution_

Note: (show of hands) Who likes react hooks. Let's start with the core problem. After years of React development, the same patterns keep breaking down at scale.

---

## Example: The UserProfile Problem

```typescript
// Typical React component - looks simple at first
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    setLoading(true);
    fetchUser(userId).then(user => {
      setUser(user);
      setLoading(false);
      // Load related data
      fetchNotifications(user.id).then(setNotifications);
    });
  }, [userId]);

  // Component handles UI AND business logic
  return (
    <div>
      {loading ? <Spinner /> : <div>{user?.name}</div>}
      <NotificationsList notifications={notifications} />
    </div>
  );
}
```

**Problems:** Mixed concerns, testing complexity, coupling

Note: This looks innocent, but it's where the problems start. The component handles both UI rendering and business logic, making it hard to test and maintain.

---

## As It Grows: Hooks and Props

```typescript
// Real-world component after 6 months
function UserProfile({
  userId,
  theme,
  permissions,
  onUserUpdate,
  onNotificationDismiss,
  showEditButton,
  editMode,
  // ... 20+ more props
}) {
  const { user, loading, error } = useUser(userId);
  const { notifications } = useNotifications(userId);
  const { themeClass } = useTheme(theme);
  const { canEdit } = usePermissions(permissions, user);
  const [editing, setEditing] = useState(editMode);

  // Component coordinates multiple custom hooks
  // Still tightly coupled to all these concerns
}
```

**Result:** Everytime someone touches the code base either your view or one of your hooks imports another hook

> Because we are only using the mechanism react introduced for a problem react created in the first place

Note: This is the inevitable evolution. Every new requirement adds more props, more hooks, more complexity. 

---

## Backend Solved This: Spring Boot

```java
// Clean separation of concerns
@RestController
public class UserController {
    @Autowired
    private UserService userService;

    @GetMapping("/users/{id}")
    public User getUser(@PathVariable String id) {
        return userService.findById(id); // Pure delegation
    }
}

@Service
public class UserService {
    @Autowired
    private UserRepository repository;

    public User findById(String id) {
        return repository.findById(id); // Pure business logic
    }
}
```

**Benefits:** Single responsibility, easy testing, loose coupling

Note: Backend development solved this decades ago with dependency injection. Controllers handle HTTP, services handle business logic. Although Type erasure requires @Qualifier Annotation

---

## Angular Also Solved This: Dependency Injection

```typescript
// Angular service
@Injectable({ providedIn: "root" })
export class UserService {
  constructor(private http: HttpClient) {}

  getUser(id: string): Observable<User> {
    return this.http.get<User>(`/api/users/${id}`);
  }
}

// Angular component
@Component({
  selector: "user-profile",
  template: `<div>{{ (user$ | async)?.name }}</div>`,
})
export class UserProfileComponent {
  user$: Observable<User>;

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.user$ = this.userService.getUser(this.userId);
  }
}
```

**Angular got it right:** Services injected, components focus on templates

Note: Angular solved this from day one with dependency injection. Services handle business logic, components handle templates. React missed this architectural lesson. Although Angular uses token and class based injection.

---

## The Solution: Service Injection for React

**Core Concept:** Components depend on services, not implementations

```typescript
// 1. Define what the component needs
interface UserServiceInterface {
  state: { user: User | null; loading: boolean };
  loadUser(id: string): Promise<void>;
}

// 2. Component becomes pure template
function UserProfile({ userService }: { userService: Inject<UserServiceInterface> }) {
  const { user, loading } = userService.state;

  return loading ? <Spinner /> : <div>{user?.name}</div>;
}

// 3. Service handles all business logic
@Service()
class UserService implements UserServiceInterface {
  state = { user: null, loading: false };

  async loadUser(id: string): Promise<void> {
    this.state.loading = true;
    this.state.user = await fetch(`/api/users/${id}`).then(r => r.json());
    this.state.loading = false;
  }
}
```

Note: This is the core insight - separate UI from business logic using service injection, just like backend frameworks do.

---

## Key Advantage: Services Work Everywhere

**Services are framework-agnostic and composable through DI:**

```typescript
// UserService can inject other services and work outside React
@Service()
class UserService implements UserServiceInterface {
  constructor(
    @Inject() private apiClient: ApiClientInterface,
    @Inject() private logger: LoggerInterface,
    @Inject() private cache: CacheInterface
  ) {}

  async loadUser(id: string): Promise<void> {
    this.logger.info(`Loading user ${id}`);

    // Check cache first
    const cached = this.cache.get(`user-${id}`);
    if (cached) {
      this.state.user = cached;
      return;
    }

    // Load from API
    this.state.loading = true;
    this.state.user = await this.apiClient.get(`/users/${id}`);
    this.cache.set(`user-${id}`, this.state.user);
    this.state.loading = false;
  }
}

// Use in React, Node.js, testing, anywhere!
const userService = container.get<UserServiceInterface>("UserService");
```

**Benefits:** Testable, reusable, composable business logic independent of React

Note: This is huge - your business logic becomes completely portable. Same service works in React components, Node.js scripts, tests, CLI tools. True separation of concerns through dependency injection. A sign for good architecture is that you can replace parts easily.

---

## SOLID Principles: React vs Service Injection

| **SOLID Principle**       | **Traditional React**                                       | **Service Injection**                                     |
| ------------------------- | ----------------------------------------------------------- | --------------------------------------------------------- |
| **S**ingle Responsibility | ❌ Components handle UI + business logic + state management | ✅ Components = UI, Services = business logic             |
| **O**pen/Closed           | ❌ Adding features requires modifying components            | ✅ Extend through new services, modify through interfaces |
| **L**iskov Substitution   | ❌ No clear contracts, prop drilling breaks substitution    | ✅ Interface-based injection enables true substitution    |
| **I**nterface Segregation | ❌ Components depend on everything via props                | ✅ Components depend only on needed service interfaces    |
| **Dependency Inversion**  | ❌ Components depend on concrete implementations            | ✅ Components depend on abstractions (interfaces)         |

**Traditional React violates every SOLID principle. Service injection follows them all.**

```typescript
// SOLID compliance example
interface UserServiceInterface {
  /* minimal interface */
}
interface NotificationServiceInterface {
  /* focused interface */
}

function UserProfile({
  userService,
}: {
  userService: Inject<UserServiceInterface>;
}) {
  // Single responsibility: just UI rendering
  // Depends on abstraction, not implementation
}
```

Note: (show of hands) who Knows SOLID. This is why React feels chaotic at scale - it fundamentally violates established software engineering principles. Service injection brings SOLID principles to React development.

---

## The Magic: Compile-Time Transformation

**You write this:**

```typescript
function UserProfile({ userService }: { userService: Inject<UserServiceInterface> }) {
  return <div>{userService.state.user?.name}</div>;
}
```

**TDI2 transforms it to this:**

```typescript
function UserProfile() {
  const userService = useService('UserService');        // Auto-injected
  const userSnap = useSnapshot(userService.state);      // Reactive state
  return <div>{userSnap.user?.name}</div>;
}
```

**Result:** Less props, automatic reactivity, surgical re-rendering

Note: The transformation happens at build time. You write clean code, the framework handles the plumbing.

---

## Testing Becomes Trivial

**Service Testing:** Pure business logic

```typescript
it("should load user correctly", async () => {
  const mockRepo = { getUser: jest.fn().mockResolvedValue(mockUser) };
  const userService = new UserService(mockRepo);

  await userService.loadUser("123");

  expect(userService.state.user).toBe(mockUser);
  expect(mockRepo.getUser).toHaveBeenCalledWith("123");
});
```

**Component Testing:** Pure UI

```typescript
it('should render user name', () => {
  const mockService = { state: { user: { name: 'John' }, loading: false } };

  render(<UserProfile userService={mockService} />);

  expect(screen.getByText('John')).toBeInTheDocument();
});
```

**Result:** Fast, isolated, comprehensive testing

**Coming Soon:** `@tdi2/di-testing` package with:

- DI-aware testing utilities
- Service-focused component testing helpers
- Behavior-driven testing patterns for services

Note: Testing becomes simple - mock the service for components, mock dependencies for services. No React complexity. We're also working on specialized testing utilities to make this even easier.

---

## Key Benefits

### 🎯 **Less Props Drama**

Components get exactly what they need via injection

### 🧪 **Easier Testing**

Separate UI tests from business logic tests

### 🔧 **Flexibility Through Decoupling**

Less code touched per change reduces merge conflicts

### 🚀 **Familiar Patterns**

If you know Spring Boot, you already understand TDI2

Note: These are the core benefits that make service injection compelling for React development.

---

## Before: Traditional React UserProfile

**Traditional React:**

```typescript
function UserProfile({
  userId, theme, permissions, onUserUpdate,
  onNotificationDismiss, showEditButton, editMode, // ... 20+ more props
}) {
  const { user, loading, error } = useUser(userId);
  const { notifications } = useNotifications(userId);
  const { themeClass } = useTheme(theme);
  const { canEdit } = usePermissions(permissions, user);
  const [editing, setEditing] = useState(editMode);

  if (loading) return <div className="spinner">Loading...</div>;
  if (error) return <div className="error">{error.message}</div>;

  return (
    <div className={`user-profile ${themeClass}`}>
      <h2>{user?.name}</h2>
      <p>{user?.email}</p>
      {canEdit && showEditButton && (
        <button onClick={() => setEditing(!editing)}>Edit</button>
      )}
      <NotificationList
        notifications={notifications}
        onDismiss={onNotificationDismiss}
      />
    </div>
  );
}
```

Note: This shows the reality - complex props management, multiple hooks coordination, and business logic mixed with UI rendering.

---

## After: Service Injection UserProfile

**Service Injection:**

```typescript
function UserProfile({
  userService,
  notificationService,
  themeService,
  permissionService
}: {
  userService: Inject<UserServiceInterface>;
  notificationService: Inject<NotificationServiceInterface>;
  themeService: Inject<ThemeServiceInterface>;
  permissionService: Inject<PermissionServiceInterface>;
}) {
  const { user, loading, error } = userService.state;
  const { notifications } = notificationService.state;
  const { currentTheme } = themeService.state;
  const { canEdit } = permissionService.state;

  if (loading) return <div className="spinner">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className={`user-profile ${currentTheme}`}>
      <h2>{user?.name}</h2>
      <p>{user?.email}</p>
      {canEdit && (
        <button onClick={() => userService.toggleEditMode()}>Edit</button>
      )}
      <NotificationList
        notifications={notifications}
        onDismiss={(id) => notificationService.dismiss(id)}
      />
    </div>
  );
}
```

Note: Same UI, but now the component is a pure template. Services handle all coordination and business logic. The component just renders what services provide.

---

## How TDI2 Works

**Built on proven technologies:**

- **Vite Plugin** - Compile-time code transformation
- **Valtio** - Reactive state (2.9kb, faster than Redux)
- **TypeScript** - Interface-based dependency resolution
- **Decorators** - Familiar Spring Boot patterns

**Zero runtime overhead** - transformation happens at build time

Note: TDI2 combines mature technologies in a new way to solve React's architectural problems.

---

## Getting Started

> Already setup for you in the code examples mentioned earlier

**1. Install TDI2**

```bash
npm install @tdi2/di-core @tdi2/vite-plugin-di valtio
```

**2. Configure Vite**

```typescript
import { diEnhancedPlugin } from "@tdi2/vite-plugin-di";

export default defineConfig({
  plugins: [diEnhancedPlugin(), react()],
});
```

**3. Create your first service**

```typescript
interface MyServiceInterface {
  state: { count: number };
  increment(): void;
}

@Service()
class MyService implements MyServiceInterface {
  state = { count: 0 };
  
  increment() {
    this.state.count++;
  }
}
```

**4. Use it in components**

```typescript
function MyComponent({ myService }: { myService: Inject<MyServiceInterface> }) {
  return (
    <div>
      Count: {myService.state.count}
      <button onClick={() => myService.increment()}>+</button>
    </div>
  );
}
```

Note: Getting started is straightforward. Add the plugin, create services, use them in components. You don't need to rewrite your entire app. Start with your most painful component, extract one service, see the benefits immediately. Then gradually expand the pattern.

---

## Ready to Try?

**🚀 Resources:**

- **GitHub:** github.com/7frank/tdi2
- **Examples:** Working demos you can run today
- **Documentation:** Step-by-step guides

**🎯 Next Steps:**

1. Try the basic example
2. Extract one service from your most complex component
3. Experience the difference

Note: The framework is ready for experimentation. Start small, see the benefits, then expand usage.

---

## Q&A: Your React Challenges

<img src="./frame.png" alt="QR Code" style="position: absolute; top: 50px; right: 50px; width: 250px; height: 250px;">

**Common questions:**

- "How does this work with our existing state management?"
- "Can we migrate incrementally?"
- "What about server-side rendering?"
- "How do we convince the team?"

**Let's discuss your specific React pain points and how service injection could help**

**After Q&A: Live coding session**

**Contact:** github.com/7frank - Questions and collaboration welcome!

Note: I want to hear about your React challenges and discuss how service injection could solve them.

---

## Thank You Leipzig.js!

### Ready to Escape Props Hell?

**The future of React architecture starts with conversations like this**

_Let's make React truly enterprise-ready together!_

**🔗 github.com/7frank/tdi2**

**Next: Live coding session**

Note: Thank you for your attention. I'm excited to discuss this further and hear your thoughts on bringing enterprise architecture patterns to React.
