// src/App.tsx - Updated with Router and DI Dependency Viewer

import "./App.css";
import { Router } from "./components/Router";
import { DIExampleCard } from "./components/DIExampleCard";
import { DICardBody } from "./components/DICardBody";
import { SimpleTest } from "./components/SimpleTestComponent";
import {
  DataList,
  UserProfile,
} from "./components/EnhancedFunctionalComponent";
import { ExampleUseAsyncChain } from "./experimental-utils/async/ExampleUseAsyncChain";
import { ExampleObservableFC } from "./experimental-utils/observable/ExampleObservableFC";
import { TodoApp } from "./todo/components/TodoApp";
import DIDependencyViewer from "./components/di-dependency-viewer/DIDependencyViewer";

// Import the actual DI config
import { DI_CONFIG } from './.tdi2/di-config';

/** DI marker to prevent TypeScript errors */
const SERVICES = {} as any;

// Homepage component
function Homepage() {
  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: '#333', marginBottom: '16px' }}>
          Welcome to TDI2 Demo
        </h1>
        <p style={{ color: '#666', fontSize: '18px', maxWidth: '800px', margin: '0 auto' }}>
          Explore automatic interface-to-implementation resolution, class-based DI, 
          and functional component dependency injection patterns.
        </p>
      </div>

      {/* Quick Navigation Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '20px',
        marginBottom: '40px' 
      }}>
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px', 
          border: '2px solid #4CAF50',
          textAlign: 'center' 
        }}>
          <h3>🎯 Complete Todo App</h3>
          <p style={{ fontSize: '14px', color: '#666', margin: '8px 0' }}>
            Full-featured application with IndexedDB persistence and reactive state
          </p>
        </div>
        
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px', 
          border: '2px solid #2196F3',
          textAlign: 'center' 
        }}>
          <h3>🔌 Interface Examples</h3>
          <p style={{ fontSize: '14px', color: '#666', margin: '8px 0' }}>
            Interface-based dependency injection with automatic resolution
          </p>
        </div>
        
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px', 
          border: '2px solid #FF9800',
          textAlign: 'center' 
        }}>
          <h3>📊 Dependency Viewer</h3>
          <p style={{ fontSize: '14px', color: '#666', margin: '8px 0' }}>
            Interactive visualization of your DI dependency graph
          </p>
        </div>
      </div>

      {/* Features Overview */}
      <div style={{ 
        marginTop: '60px', 
        padding: '24px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '8px' 
      }}>
        <h3 style={{ color: '#333', marginBottom: '16px', textAlign: 'center' }}>
          🚀 TDI2 Features Demonstrated
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '16px',
          marginTop: '20px' 
        }}>
          <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <strong>🎯 Interface Resolution</strong>
            <p style={{ fontSize: '14px', color: '#666', margin: '8px 0 0 0' }}>
              Automatic mapping from TypeScript interfaces to implementations
            </p>
          </div>
          <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <strong>🏗️ Class-Based DI</strong>
            <p style={{ fontSize: '14px', color: '#666', margin: '8px 0 0 0' }}>
              Direct class registration without interface requirements
            </p>
          </div>
          <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <strong>⚡ Zero Configuration</strong>
            <p style={{ fontSize: '14px', color: '#666', margin: '8px 0 0 0' }}>
              No manual token management or container setup needed
            </p>
          </div>
          <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <strong>🔄 Hot Reload</strong>
            <p style={{ fontSize: '14px', color: '#666', margin: '8px 0 0 0' }}>
              Automatic retransformation during development
            </p>
          </div>
          <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <strong>💾 Persistence</strong>
            <p style={{ fontSize: '14px', color: '#666', margin: '8px 0 0 0' }}>
              IndexedDB integration with caching layer
            </p>
          </div>
          <div style={{ padding: '12px', backgroundColor: 'white', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <strong>🌊 Reactive State</strong>
            <p style={{ fontSize: '14px', color: '#666', margin: '8px 0 0 0' }}>
              AsyncState pattern for reactive UIs
            </p>
          </div>
        </div>
        
        <div style={{ marginTop: '24px', fontSize: '14px', color: '#666', textAlign: 'center' }}>
          <p>
            <strong>Debug URLs:</strong> 
            <a href="http://localhost:5173/_di_debug" style={{ marginLeft: '8px', color: '#4CAF50' }}>Debug Info</a> | 
            <a href="http://localhost:5173/_di_interfaces" style={{ marginLeft: '8px', color: '#4CAF50' }}>Interface Mappings</a> | 
            <a href="http://localhost:5173/_di_configs" style={{ marginLeft: '8px', color: '#4CAF50' }}>Configurations</a>
          </p>
        </div>
      </div>
    </div>
  );
}

// Todo App Page
function TodoAppPage() {
  return (
    <div style={{ padding: '20px' }}>
      <DIExampleCard
        title="Complete Todo Application"
        description="Full-featured todo app demonstrating TDI2 with IndexedDB persistence, AsyncState pattern, and interface-based DI"
        diPattern="Real-World Application"
        variant="interface"
      >
        <DICardBody
          pattern="TodoServiceType & TodoFormServiceType → Implementations"
          explanation="This is a complete todo application showcasing TDI2's capabilities. It uses interface-based dependency injection with AsyncState services for reactive state management. The app demonstrates TodoRepository (IndexedDB persistence), TodoCache (memory caching), TodoNotificationService, and reactive form handling. All services are automatically resolved without manual token mapping."
          dependencies={[
            { name: 'TodoServiceType', type: 'required', resolvedTo: 'TodoService' },
            { name: 'TodoFormServiceType', type: 'required', resolvedTo: 'TodoFormService' },
            { name: 'TodoRepositoryInterface', type: 'required', resolvedTo: 'TodoRepository' },
            { name: 'TodoCacheInterface', type: 'required', resolvedTo: 'TodoCache' },
            { name: 'TodoNotificationInterface', type: 'required', resolvedTo: 'TodoNotificationService' },
            { name: 'LoggerInterface', type: 'required', resolvedTo: 'TodoLogger' }
          ]}
          codeExample={`// Service interfaces combine AsyncState + Methods
export interface TodoServiceType 
  extends AsyncState<TodoServiceState>, TodoServiceMethods {}

// Implementation with dependency injection
@Service()
export class TodoService 
  extends AsyncState<TodoServiceState> 
  implements TodoServiceType {
  
  constructor(
    @Inject() private repository: TodoRepositoryInterface,
    @Inject() private cache: TodoCacheInterface,
    @Inject() private notifications: TodoNotificationInterface,
    @Inject() private logger: LoggerInterface
  ) { super(); }
  
  async addTodo(data: CreateTodoData): Promise<TodoServiceState> {
    return this.execute(async () => {
      const todo = await this.repository.create(data);
      this.cache.setTodo(todo);
      this.notifications.notifyTodoAdded(todo);
      return this.buildState(await this.repository.getAll());
    });
  }
}

// Usage in React component
function TodoApp(props: {
  services: {
    todoService: Inject<TodoServiceType>;
    formService: Inject<TodoFormServiceType>;
  };
}) {
  const todoState = useAsyncServiceInterface(props.services.todoService);
  const formState = useAsyncServiceInterface(props.services.formService);
  
  // Reactive state management with automatic DI
}`}
          variant="interface"
        >
          <TodoApp services={SERVICES} />
        </DICardBody>
      </DIExampleCard>
    </div>
  );
}

// Interface Examples Page
function InterfaceExamplesPage() {
  return (
    <div style={{ padding: '20px' }}>
      <DIExampleCard
        title="Interface-Based User Profile"
        description="Demonstrates automatic interface resolution with caching and logging dependencies"
        diPattern="Interface → Implementation"
        variant="interface"
      >
        <DICardBody
          pattern="ExampleApiInterface → UserApiServiceImpl"
          explanation="The component declares it needs ExampleApiInterface, LoggerInterface, and CacheInterface. TDI2 automatically resolves these to their implementations without manual token mapping. This showcases the core benefit of interface-based DI: clean separation between contract and implementation."
          dependencies={[
            { name: 'ExampleApiInterface', type: 'required', resolvedTo: 'UserApiServiceImpl' },
            { name: 'LoggerInterface', type: 'optional', resolvedTo: 'ConsoleLogger' },
            { name: 'CacheInterface<any>', type: 'optional', resolvedTo: 'MemoryCache' }
          ]}
          codeExample={`function UserProfile(props: {
  userId: string;
  services: {
    api: Inject<ExampleApiInterface>;
    logger?: InjectOptional<LoggerInterface>;
    cache?: InjectOptional<CacheInterface<any>>;
  };
}) {
  // TDI2 automatically injects:
  // - UserApiServiceImpl for ExampleApiInterface
  // - ConsoleLogger for LoggerInterface
  // - MemoryCache for CacheInterface
}`}
          variant="interface"
        >
          <UserProfile userId="user-123" title="Interface DI Example" services={SERVICES} />
        </DICardBody>
      </DIExampleCard>

      <DIExampleCard
        title="Multi-Service Data List"
        description="Shows dependency injection with multiple required and optional services"
        diPattern="Multi-Interface DI"
        variant="class"
      >
        <DICardBody
          pattern="Required + Optional Dependencies"
          explanation="Combines required API and Logger services with optional Cache service. Demonstrates how TDI2 handles optional dependencies gracefully - if the cache isn't available, the component continues to work without it. This pattern is ideal for progressive enhancement."
          dependencies={[
            { name: 'ExampleApiInterface', type: 'required', resolvedTo: 'ExampleApiService' },
            { name: 'LoggerInterface', type: 'required', resolvedTo: 'ConsoleLogger' },
            { name: 'CacheInterface<string[]>', type: 'optional', resolvedTo: 'MemoryCache' }
          ]}
          codeExample={`const DataList = (props: {
  category: string;
  services: {
    api: Inject<ExampleApiInterface>;      // Required
    logger: Inject<LoggerInterface>;       // Required  
    cache?: InjectOptional<CacheInterface<string[]>>; // Optional
  };
}) => {
  // If cache is available, use it for performance
  // If not available, continue without caching
}`}
          variant="class"
        >
          <DataList category="products" services={SERVICES} />
        </DICardBody>
      </DIExampleCard>

      <DIExampleCard
        title="Simple Token-Free Injection"
        description="Minimal example showing how easy DI becomes without manual token management"
        diPattern="Zero-Config DI"
        variant="interface"
      >
        <DICardBody
          pattern="Zero Configuration"
          explanation="Just declare the interface you need - no tokens, no manual registration, no container setup. TDI2 scans your codebase, finds the implementation, and wires everything up automatically. This is the ultimate developer experience for dependency injection."
          dependencies={[
            { name: 'ExampleApiInterface', type: 'required', resolvedTo: 'ExampleApiService' }
          ]}
          codeExample={`export function SimpleTest(props: {
  message: string;
  services: {
    api: Inject<ExampleApiInterface>; // That's it!
  };
}) {
  // TDI2 automatically finds ExampleApiService
  // No tokens, no manual wiring, no configuration
}`}
          variant="interface"
        >
          <SimpleTest message="Hello from automatic DI!" />
        </DICardBody>
      </DIExampleCard>
    </div>
  );
}

// Class-Based Examples Page
function ClassBasedExamplesPage() {
  return (
    <div style={{ padding: '20px' }}>
      <DIExampleCard
        title="Observable State Management"
        description="Class-based DI with reactive state management using AsyncState pattern"
        diPattern="Class → Class"
        variant="observable"
      >
        <DICardBody
          pattern="Direct Class Registration"
          explanation="Services extend AsyncState for reactive state management. Classes are registered directly as their own tokens - no interfaces needed. This pattern is perfect when you have concrete implementations that don't need abstraction, or when working with stateful services that manage their own lifecycle."
          dependencies={[
            { name: 'ApiService', type: 'required', resolvedTo: 'ApiService' },
            { name: 'AsyncState<UserServiceState>', type: 'required', resolvedTo: 'UserService' }
          ]}
          codeExample={`@Service()
export class ApiService extends AsyncState<string> {
  // Class acts as both interface and implementation
  async fetchData(): Promise<string> { ... }
}

// Usage in component:
function Component(props: {
  services: {
    apiService: Inject<ApiService>; // Direct class reference
  };
}) { ... }`}
          variant="observable"
        >
          <ExampleObservableFC services={SERVICES} />
        </DICardBody>
      </DIExampleCard>

      <DIExampleCard
        title="Async Chain Pattern"
        description="Demonstrates fluent async operations with error handling and state management"
        diPattern="Fluent Async API"
        variant="async"
      >
        <DICardBody
          pattern="Fluent Reactive Pattern"
          explanation="Chainable async operations with built-in loading, success, and error states. Shows how DI can work with complex async patterns and reactive programming. This pattern combines the power of async/await with reactive state management for smooth UX."
          dependencies={[]}
          codeExample={`const asyncState = useAsyncChain<string>();

// Fluent API with automatic state management
await asyncState
  .trigger(() => fetchData())
  .success(data => data.trim())
  .map(d => <button>{d}</button>)
  .error(error => error.message)
  .map(m => <div style={{color: 'red'}}>{m}</div>)
  .pending(() => <div>Loading...</div>)
  .idle(() => <div>Click to start</div>);`}
          variant="async"
        >
          <ExampleUseAsyncChain />
        </DICardBody>
      </DIExampleCard>
    </div>
  );
}

// Dependency Viewer Page
function DependencyViewerPage() {
  return (
    <div style={{ height: '100vh', padding: '0' }}>
      <DIDependencyViewer diConfig={DI_CONFIG} />
    </div>
  );
}

function App() {
  const routes = [
    {
      path: '/',
      component: <Homepage />,
      title: 'Home',
      description: 'Welcome to TDI2 - Interface-Based Dependency Injection Demo'
    },
    {
      path: '/todo-app',
      component: <TodoAppPage />,
      title: 'Todo App',
      description: 'Complete Todo Application with IndexedDB persistence and reactive state'
    },
    {
      path: '/interface-examples',
      component: <InterfaceExamplesPage />,
      title: 'Interface Examples',
      description: 'Interface-based dependency injection with automatic resolution'
    },
    {
      path: '/class-examples',
      component: <ClassBasedExamplesPage />,
      title: 'Class Examples',
      description: 'Class-based DI and reactive state management patterns'
    },
    {
      path: '/dependency-viewer',
      component: <DependencyViewerPage />,
      title: 'Dependency Viewer',
      description: 'Interactive visualization of your DI dependency graph'
    }
  ];

  return <Router routes={routes} defaultRoute="/" />;
}

export default App;