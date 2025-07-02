// Domain Types
export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TodoFilter {
  status: 'all' | 'active' | 'completed';
  search: string;
}

export interface CreateTodoRequest {
  title: string;
}

export interface UpdateTodoRequest {
  id: string;
  title?: string;
  completed?: boolean;
}

// Service Interfaces
export interface TodoServiceInterface {
  state: {
    todos: Todo[];
    loading: boolean;
    filter: TodoFilter;
    stats: {
      total: number;
      active: number;
      completed: number;
    };
  };
  
  // Actions
  addTodo(request: CreateTodoRequest): Promise<void>;
  updateTodo(request: UpdateTodoRequest): Promise<void>;
  deleteTodo(id: string): Promise<void>;
  toggleTodo(id: string): Promise<void>;
  clearCompleted(): Promise<void>;
  
  // Filters
  setFilter(status: 'all' | 'active' | 'completed'): void;
  setSearch(search: string): void;
  
  // Computed
  getFilteredTodos(): Todo[];
  hasCompletedTodos(): boolean;
}

export interface NotificationServiceInterface {
  state: {
    notifications: Array<{
      id: string;
      message: string;
      type: 'success' | 'error' | 'info';
      timestamp: Date;
    }>;
  };
  
  showSuccess(message: string): void;
  showError(message: string): void;
  showInfo(message: string): void;
  dismiss(id: string): void;
  clear(): void;
}

export interface AppStateServiceInterface {
  state: {
    theme: 'light' | 'dark';
    sidebarOpen: boolean;
    currentView: 'list' | 'kanban';
  };
  
  setTheme(theme: 'light' | 'dark'): void;
  toggleSidebar(): void;
  setView(view: 'list' | 'kanban'): void;
}

// Repository Interface
export interface TodoRepositoryInterface2 {
  getAll(): Promise<Todo[]>;
  create(request: CreateTodoRequest): Promise<Todo>;
  update(request: UpdateTodoRequest): Promise<Todo>;
  delete(id: string): Promise<void>;
}