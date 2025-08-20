# Live Demo Plan

## Demo Strategy: "Show, Don't Tell"

### Overall Approach
- **Two parallel implementations** of the same todo app
- **Side-by-side comparison** highlighting key differences
- **Live transformation** from traditional to RSI
- **Interactive audience participation** with polls and questions

---

## Demo 1: The Pain Point (Opening Hook - 5 minutes)

### Traditional React Todo App
**Repository**: `react-conf-demo/traditional-react`

```typescript
// TodoApp.tsx - The Props Monster
interface TodoAppProps {
  // Data props
  todos: Todo[];
  loading: boolean;
  error: string | null;
  filter: FilterType;
  
  // Event handlers
  onAddTodo: (text: string) => void;
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  onFilterChange: (filter: FilterType) => void;
  
  // Context props
  user: User;
  permissions: Permission[];
  theme: Theme;
  locale: string;
  
  // Analytics & logging
  analytics: AnalyticsService;
  logger: Logger;
  notifications: NotificationService;
}

function TodoApp(props: TodoAppProps) {
  // Component logic mixed with UI
  useEffect(() => {
    props.analytics.track('todo_app_viewed');
  }, []);

  const handleAddTodo = useCallback((text: string) => {
    if (props.permissions.includes('CREATE_TODO')) {
      props.onAddTodo(text);
      props.logger.info(`Todo created: ${text}`);
      props.notifications.success('Todo added!');
    }
  }, [props.onAddTodo, props.permissions, props.logger, props.notifications]);

  // ... more mixed logic
}
```

**Live Demonstration Points**:
1. **Count the props**: "15+ props and growing"
2. **Show testing complexity**: Multiple providers, mock setup
3. **Highlight coupling**: Component knows too much about business logic

### Audience Interaction
**Poll**: "What's the maximum number of props you've seen in a component?"
- 0-5 props
- 6-10 props  
- 11-20 props
- 20+ props (props hell!)

---

## Demo 2: RSI Transformation (Main Demo - 8 minutes)

### Step 1: Extract Services (3 minutes)
**Live coding**: Convert hooks and logic to services

```typescript
// services/TodoService.ts
export interface TodoServiceInterface {
  state: {
    todos: Todo[];
    loading: boolean;
    error: string | null;
  };
  addTodo(text: string): Promise<void>;
  updateTodo(id: string, updates: Partial<Todo>): Promise<void>;
  deleteTodo(id: string): Promise<void>;
}

class TodoServiceImpl implements TodoServiceInterface {
  state = proxy({
    todos: [] as Todo[],
    loading: false,
    error: null as string | null,
  });

  async addTodo(text: string): Promise<void> {
    this.state.loading = true;
    try {
      // API call simulation
      await mockApiCall();
      const newTodo = { id: uuid(), text, completed: false };
      this.state.todos.push(newTodo);
    } catch (error) {
      this.state.error = 'Failed to add todo';
    } finally {
      this.state.loading = false;
    }
  }
  
  // ... other methods
}
```

**Highlight**: "Business logic is now isolated and testable"

### Step 2: Transform Component (3 minutes)
**Live coding**: Convert component to service consumer

```typescript
// components/TodoApp.tsx - The Clean Version
interface TodoAppProps {
  todoService: Inject<TodoServiceInterface>;
  filterService: Inject<FilterServiceInterface>;
  notificationService: Inject<NotificationServiceInterface>;
}

function TodoApp({ 
  todoService, 
  filterService, 
  notificationService 
}: TodoAppProps) {
  const todoState = useSnapshot(todoService.state);
  const filterState = useSnapshot(filterService.state);

  const handleAddTodo = async (text: string) => {
    try {
      await todoService.addTodo(text);
      notificationService.showSuccess('Todo added!');
    } catch (error) {
      notificationService.showError('Failed to add todo');
    }
  };

  return (
    <div className="todo-app">
      <AddTodoForm onSubmit={handleAddTodo} />
      <TodoFilter service={filterService} />
      <TodoList 
        todos={filterService.getFilteredTodos(todoState.todos)}
        onToggle={todoService.updateTodo}
        onDelete={todoService.deleteTodo}
      />
    </div>
  );
}
```

**Highlight**: "3 service props vs 15+ data props"

### Step 3: Show Service Wiring (2 minutes)
**Live coding**: Demonstrate automatic dependency injection

```typescript
// App.tsx - The Magic
export function App() {
  return (
    <TodoApp
      todoService={TodoService}
      filterService={FilterService}
      notificationService={NotificationService}
    />
  );
}
```

**Audience Reaction**: "That's it? Where's the provider setup?"

---

## Demo 3: Testing Revolution (5 minutes)

### Before: Traditional Testing Complexity
```typescript
// Traditional test setup
describe('TodoApp', () => {
  beforeEach(() => {
    const mockStore = configureStore([thunk])({
      todos: { items: [], loading: false, error: null },
      filter: { current: 'all' },
    });
    
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });

    wrapper = ({ children }) => (
      <Provider store={mockStore}>
        <QueryClientProvider client={queryClient}>
          <NotificationProvider>
            <ThemeProvider theme={defaultTheme}>
              {children}
            </ThemeProvider>
          </NotificationProvider>
        </QueryClientProvider>
      </Provider>
    );
  });

  it('should add todo', async () => {
    // Complex test setup...
  });
});
```

### After: RSI Testing Simplicity
```typescript
// RSI test setup
describe('TodoApp', () => {
  it('should add todo', async () => {
    const mockTodoService = {
      state: { todos: [], loading: false, error: null },
      addTodo: vi.fn().mockResolvedValue(undefined),
      updateTodo: vi.fn(),
      deleteTodo: vi.fn(),
    };

    const mockNotificationService = {
      showSuccess: vi.fn(),
      showError: vi.fn(),
    };

    render(
      <TodoApp
        todoService={mockTodoService}
        filterService={mockFilterService}
        notificationService={mockNotificationService}
      />
    );

    // Test logic...
    expect(mockTodoService.addTodo).toHaveBeenCalledWith('New todo');
  });
});
```

**Live demonstration**: Run both test suites and compare:
- Lines of setup code
- Execution time
- Clarity of test intent

### Audience Interaction
**Challenge**: "Who wants to volunteer to write a test for the traditional version?"

---

## Demo 4: Performance Comparison (3 minutes)

### React DevTools Profiler Demo
**Live profiling**: Show re-render patterns

1. **Traditional App**:
   - Add todo → Multiple components re-render
   - Filter change → Entire component tree updates
   - Loading state → Provider triggers cascade

2. **RSI App**:
   - Add todo → Only todo list re-renders
   - Filter change → Only affected components update
   - Loading state → Granular updates via Valtio

### Bundle Size Analysis
**Live webpack-bundle-analyzer**:
```bash
# Traditional app
npm run analyze:traditional
# RSI app  
npm run analyze:rsi
```

**Results comparison**:
- Bundle size differences
- Code splitting opportunities
- Runtime performance metrics

---

## Demo 5: Migration Path (2 minutes)

### Live Refactoring Exercise
**Interactive**: Ask audience to choose a component to refactor

```typescript
// Starting point: Hook-heavy component
function UserProfile() {
  const { data: user } = useUser();
  const { data: posts } = usePosts(user?.id);
  const [editing, setEditing] = useState(false);
  const updateUser = useUpdateUser();
  
  // ... complex logic
}

// End point: Service-driven component  
function UserProfile({
  userService,
  postService,
  editingService
}: UserProfileProps) {
  // Clean template
}
```

**Live transformation**: 2-minute refactor with audience input

---

## Technical Requirements

### Setup Prerequisites
1. **Dual monitor setup** for side-by-side comparison
2. **Pre-built demo repositories** with git branches for each stage
3. **Live reload configured** for instant feedback
4. **Testing environment** ready with pre-run results
5. **Bundle analyzer** pre-configured for quick demonstrations

### Backup Plans
1. **Recorded demo segments** in case of technical issues
2. **Static screenshots** for key comparison points
3. **Code snippets** prepared for manual typing if needed
4. **Offline development environment** as fallback

### Audience Participation Tools
1. **Live polling** via conference app or web tool
2. **GitHub repository** shared in real-time
3. **QR codes** for easy access to demo code
4. **Discord/Slack channel** for follow-up questions

---

## Success Metrics

### During Demo
- **Audience engagement**: Visible reactions, questions, note-taking
- **Interactive participation**: Poll responses, volunteer participation
- **Technical execution**: Smooth demo flow, no major issues

### Post-Demo
- **GitHub stars** on demo repository
- **Social media mentions** with demo screenshots
- **Follow-up questions** indicating genuine interest
- **Requests for blog posts** or additional resources

---

## Repository Structure

```
react-conf-demo/
├── traditional-react/          # Before: Props hell
│   ├── src/components/        
│   ├── src/hooks/            
│   ├── src/tests/            
│   └── package.json          
├── rsi-react/                 # After: Service heaven
│   ├── src/components/       
│   ├── src/services/         
│   ├── src/tests/            
│   └── package.json          
├── migration-steps/           # Step-by-step transformation
│   ├── step-1-extract-services/
│   ├── step-2-convert-components/
│   └── step-3-wire-dependencies/
└── benchmarks/               # Performance comparisons
    ├── bundle-analysis/      
    ├── runtime-performance/  
    └── test-execution-times/ 
```