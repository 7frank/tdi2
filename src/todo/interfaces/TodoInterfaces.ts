// src/todo/interfaces/TodoInterfaces.ts - Interface definitions for Todo app

export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  tags: string[];
}

export interface TodoFilter {
  status?: 'all' | 'pending' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  search?: string;
  tags?: string[];
}

export interface TodoStats {
  total: number;
  completed: number;
  pending: number;
  byPriority: {
    low: number;
    medium: number;
    high: number;
  };
  overdue: number;
}

// Service interfaces following TDI2 pattern
export interface TodoRepositoryInterface {
  getAll(): Promise<Todo[]>;
  getById(id: string): Promise<Todo | null>;
  create(todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>): Promise<Todo>;
  update(id: string, updates: Partial<Todo>): Promise<Todo>;
  delete(id: string): Promise<boolean>;
  search(query: string): Promise<Todo[]>;
  getByFilter(filter: TodoFilter): Promise<Todo[]>;
  clearCompleted(): Promise<number>; // Returns number of deleted todos
}

export interface TodoCacheInterface {
  getTodos(): Todo[] | null;
  setTodos(todos: Todo[]): void;
  getTodo(id: string): Todo | null;
  setTodo(todo: Todo): void;
  removeTodo(id: string): void;
  clear(): void;
  getStats(): TodoStats | null;
  setStats(stats: TodoStats): void;
}

export interface TodoNotificationInterface {
  notifyTodoAdded(todo: Todo): void;
  notifyTodoCompleted(todo: Todo): void;
  notifyTodoDeleted(todo: Todo): void;
  notifyTodoUpdated(todo: Todo): void;
  notifyBulkAction(action: string, count: number): void;
}

export interface LoggerInterface {
  log(message: string, data?: any): void;
  error(message: string, error?: any): void;
  warn(message: string, data?: any): void;
  debug(message: string, data?: any): void;
}

// State types for AsyncState services
export interface TodoServiceState {
  todos: Todo[];
  filteredTodos: Todo[];
  currentFilter: TodoFilter;
  stats: TodoStats;
  isLoading: boolean;
  selectedTodo: Todo | null;
}

export interface TodoFormState {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  tags: string[];
  isValid: boolean;
  errors: Record<string, string>;
}

// Service method interfaces
export interface TodoServiceMethods {
  loadTodos(): Promise<TodoServiceState>;
  addTodo(todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>): Promise<TodoServiceState>;
  updateTodo(id: string, updates: Partial<Todo>): Promise<TodoServiceState>;
  deleteTodo(id: string): Promise<TodoServiceState>;
  toggleTodo(id: string): Promise<TodoServiceState>;
  setFilter(filter: TodoFilter): Promise<TodoServiceState>;
  clearCompleted(): Promise<TodoServiceState>;
  selectTodo(id: string | null): Promise<TodoServiceState>;
  searchTodos(query: string): Promise<TodoServiceState>;
  refreshStats(): Promise<TodoServiceState>;
}

export interface TodoFormMethods {
  setTitle(title: string): Promise<TodoFormState>;
  setDescription(description: string): Promise<TodoFormState>;
  setPriority(priority: 'low' | 'medium' | 'high'): Promise<TodoFormState>;
  setDueDate(date: string): Promise<TodoFormState>;
  addTag(tag: string): Promise<TodoFormState>;
  removeTag(tag: string): Promise<TodoFormState>;
  setTags(tags: string[]): Promise<TodoFormState>;
  validate(): Promise<TodoFormState>;
  reset(): Promise<TodoFormState>;
  loadTodo(todo: Todo): Promise<TodoFormState>;
  submit(): Promise<{ isValid: boolean; todo?: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'> }>;
}

// Combined service interfaces for DI (AsyncState + Methods)
export interface TodoServiceType extends AsyncState<TodoServiceState>, TodoServiceMethods {
  // This interface represents the complete TodoService contract
}

export interface TodoFormServiceType extends AsyncState<TodoFormState>, TodoFormMethods {
  // This interface represents the complete TodoFormService contract
}

// Import AsyncState from the experimental utils
import { AsyncState } from '../../experimental-utils/observable/useObservableState';