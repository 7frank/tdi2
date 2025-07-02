# React Service Injection Framework

## React's Angular Moment: How TDI2 Could Make React Unrecognizable

### Abstract

We propose Service-First Architecture (SFA) as a revolutionary React development pattern that fundamentally transforms the ecosystem from component-centric to service-centric development. By combining TDI2's compile-time dependency injection with Valtio's reactive state management, this approach eliminates props entirely, turning React components into pure templates while centralizing all business logic in injectable services. This paradigm shift could disrupt parts of the React ecosystem, making traditional state management libraries obsolete and bringing Angular-style enterprise architecture to React without the complexity. The implications are profound: cleaner code, zero prop drilling, automatic cross-component synchronization, and a development experience that rivals backend frameworks in terms of modularity and testability.

---

## TL;DR

1. **Create service class** with your business logic and state
2. **Create React component** and inject the service
3. **Service automatically becomes reactive** through computer magic ✨

```typescript
// 1. Create interface & service

export interface UserServiceInterface {
  state: {
    user: any;
    loading: boolean;
  };
  loadUser(id: string): Promise<void>;
}

@Service()
class UserService implements UserServiceInterface{
  state = { user: null, loading: false };
  async loadUser(id) { /* logic */ }
}

// 2. Create component with injection

function UserProfile({userService}:{userService:Inject<UserServiceInterface>}) {

  return <div>{userService.user?.name}</div>;
}

// 3. Magic happens - no props, automatic updates across all components
```

## How It Works

### Vite Plugin: Spring Boot-Style Autowiring for React

TDI2 provides a **Vite transformer** that brings Spring Boot-like dependency injection to React:

```typescript
// What you write (with DI markers):
function UserProfile({ services: { userService: Inject<UserService> } }) {
  // Your component code
}

// What TDI2 generates (autowired):
function UserProfile() {
  const userService = useService('UserService'); // Auto-injected like @Autowired
  // Rest stays the same
}
```

**Just like Spring Boot's `@Autowired`** - but at compile-time with zero runtime overhead.

### Valtio: Reactive Injection Under the Hood

When services are injected, **Valtio automatically makes them reactive**:

```typescript
import { proxy, useSnapshot } from "valtio";

function useService(token: string | symbol) {
  const container = useDI();
  const [_] = React.useState(proxy(container.resolve(token)));
  useSnapshot(_);
  return _;
}
```

**🪄🪄🪄 magic**: Valtio tracks which properties you access and only re-renders when those specific properties change.
