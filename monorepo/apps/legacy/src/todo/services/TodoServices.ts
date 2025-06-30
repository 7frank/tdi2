// src/todo/services/TodoServices.ts - AsyncState-based services following TDI2 pattern

import { Service, Inject } from '../../di/decorators';
import { AsyncState } from '../../experimental-utils/observable/useObservableState';
import type {
  Todo,
  TodoFilter,
  TodoStats,
  TodoServiceState,
  TodoFormState,
  TodoServiceType,
  TodoFormServiceType,
  TodoRepositoryInterface,
  TodoNotificationInterface,
  LoggerInterface
} from '../interfaces/TodoInterfaces';

// Helper function for delay simulation
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Logger implementation
@Service()
export class TodoLogger implements LoggerInterface {
  private prefix = '[TODO]';

  log(message: string, data?: any): void {
    console.log(`${this.prefix} ${new Date().toISOString()}: ${message}`, data || '');
  }

  error(message: string, error?: any): void {
    console.error(`${this.prefix} ERROR ${new Date().toISOString()}: ${message}`, error || '');
  }

  warn(message: string, data?: any): void {
    console.warn(`${this.prefix} WARN ${new Date().toISOString()}: ${message}`, data || '');
  }

  debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`${this.prefix} DEBUG ${new Date().toISOString()}: ${message}`, data || '');
    }
  }
}

// Notification service
@Service()
export class TodoNotificationService implements TodoNotificationInterface {
  constructor(@Inject() private logger: LoggerInterface) {}

  notifyTodoAdded(todo: Todo): void {
    this.logger.log('Todo added', { id: todo.id, title: todo.title });
    this.showNotification(`Added: ${todo.title}`, 'success');
  }

  notifyTodoCompleted(todo: Todo): void {
    this.logger.log('Todo completed', { id: todo.id, title: todo.title });
    this.showNotification(`Completed: ${todo.title}`, 'success');
  }

  notifyTodoDeleted(todo: Todo): void {
    this.logger.log('Todo deleted', { id: todo.id, title: todo.title });
    this.showNotification(`Deleted: ${todo.title}`, 'info');
  }

  notifyTodoUpdated(todo: Todo): void {
    this.logger.log('Todo updated', { id: todo.id, title: todo.title });
    this.showNotification(`Updated: ${todo.title}`, 'info');
  }

  notifyBulkAction(action: string, count: number): void {
    this.logger.log('Bulk action performed', { action, count });
    this.showNotification(`${action}: ${count} todos`, 'info');
  }

  private showNotification(message: string, type: 'success' | 'error' | 'info'): void {
    // In a real app, this would show a toast or browser notification
    console.log(`[NOTIFICATION ${type.toUpperCase()}] ${message}`);
  }
}

// Main Todo Service - follows the AsyncState + Methods pattern
@Service()
export class TodoService extends AsyncState<TodoServiceState> implements TodoServiceType {
  constructor(
    @Inject() private repository: TodoRepositoryInterface,
    @Inject() private notifications: TodoNotificationInterface,
    @Inject() private logger: LoggerInterface
  ) {
    super();
    
    // Initialize with default state
    this.setData({
      todos: [],
      filteredTodos: [],
      currentFilter: { status: 'all' },
      stats: {
        total: 0,
        completed: 0,
        pending: 0,
        byPriority: { low: 0, medium: 0, high: 0 },
        overdue: 0
      },
      isLoading: false,
      selectedTodo: null
    });

    this.logger.log('TodoService initialized');
  }

  async loadTodos(): Promise<TodoServiceState> {
    return this.execute(async () => {
      this.logger.log('Loading todos...');
      
      await delay(300); // Simulate network delay
      const todos = await this.repository.getAll();
      
      const state = this.buildState(todos);
      this.logger.log('Todos loaded successfully', { count: todos.length });
      
      return state;
    });
  }

  async addTodo(todoData: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>): Promise<TodoServiceState> {
    return this.execute(async () => {
      this.logger.log('Adding new todo', { title: todoData.title });
      
      await delay(200);
      const newTodo = await this.repository.create(todoData);
      
      // Get updated todos
      const todos = await this.repository.getAll();
      
      // Notify
      this.notifications.notifyTodoAdded(newTodo);
      
      const state = this.buildState(todos);
      this.logger.log('Todo added successfully', { id: newTodo.id });
      
      return state;
    });
  }

  async updateTodo(id: string, updates: Partial<Todo>): Promise<TodoServiceState> {
    return this.execute(async () => {
      this.logger.log('Updating todo', { id, updates });
      
      await delay(150);
      const updatedTodo = await this.repository.update(id, updates);
      
      // Get updated todos
      const todos = await this.repository.getAll();
      
      // Notify
      this.notifications.notifyTodoUpdated(updatedTodo);
      
      const state = this.buildState(todos);
      this.logger.log('Todo updated successfully', { id });
      
      return state;
    });
  }

  async deleteTodo(id: string): Promise<TodoServiceState> {
    return this.execute(async () => {
      this.logger.log('Deleting todo', { id });
      
      // Get todo for notification before deleting
      const todoToDelete = await this.repository.getById(id);
      
      await delay(100);
      const success = await this.repository.delete(id);
      
      if (success) {
        // Get updated todos
        const todos = await this.repository.getAll();
        
        // Notify
        if (todoToDelete) {
          this.notifications.notifyTodoDeleted(todoToDelete);
        }
        
        const state = this.buildState(todos);
        
        // Clear selection if deleted todo was selected
        if (state.selectedTodo?.id === id) {
          state.selectedTodo = null;
        }
        
        this.logger.log('Todo deleted successfully', { id });
        return state;
      } else {
        throw new Error(`Failed to delete todo with id: ${id}`);
      }
    });
  }

  async toggleTodo(id: string): Promise<TodoServiceState> {
    return this.execute(async () => {
      this.logger.log('Toggling todo completion', { id });
      
      const todo = await this.repository.getById(id);
      if (!todo) {
        throw new Error(`Todo with id ${id} not found`);
      }

      const updatedTodo = await this.repository.update(id, { 
        completed: !todo.completed 
      });
      
      // Get updated todos
      const todos = await this.repository.getAll();
      
      // Notify
      if (updatedTodo.completed) {
        this.notifications.notifyTodoCompleted(updatedTodo);
      } else {
        this.notifications.notifyTodoUpdated(updatedTodo);
      }
      
      const state = this.buildState(todos);
      this.logger.log('Todo toggled successfully', { id, completed: updatedTodo.completed });
      
      return state;
    });
  }

  async setFilter(filter: TodoFilter): Promise<TodoServiceState> {
    return this.execute(async () => {
      this.logger.log('Setting filter', filter);
      
      // Get current todos (from current state or repository)
      const currentState = this.getCurrentData();
      let todos = currentState?.todos || [];
      
      if (todos.length === 0) {
        todos = await this.repository.getAll();
      }
      
      const state = this.buildState(todos, filter);
      this.logger.log('Filter applied', { filter, resultCount: state.filteredTodos.length });
      
      return state;
    });
  }

  async clearCompleted(): Promise<TodoServiceState> {
    return this.execute(async () => {
      this.logger.log('Clearing completed todos');
      
      await delay(200);
      const deletedCount = await this.repository.clearCompleted();
      
      // Get updated todos
      const todos = await this.repository.getAll();
      
      // Notify
      this.notifications.notifyBulkAction('Cleared completed', deletedCount);
      
      const state = this.buildState(todos);
      this.logger.log('Completed todos cleared', { count: deletedCount });
      
      return state;
    });
  }

  async selectTodo(id: string | null): Promise<TodoServiceState> {
    return this.execute(async () => {
      this.logger.log('Selecting todo', { id });
      
      let selectedTodo: Todo | null = null;
      
      if (id) {
        selectedTodo = await this.repository.getById(id);
      }
      
      const currentState = this.getCurrentData();
      const state: TodoServiceState = {
        ...currentState!,
        selectedTodo
      };
      
      this.logger.log('Todo selection updated', { selectedId: id });
      return state;
    });
  }

  async searchTodos(query: string): Promise<TodoServiceState> {
    return this.execute(async () => {
      this.logger.log('Searching todos', { query });
      
      await delay(100);
      const searchResults = await this.repository.search(query);
      
      const filter: TodoFilter = { search: query };
      const state = this.buildState(searchResults, filter);
      
      this.logger.log('Search completed', { query, resultCount: searchResults.length });
      return state;
    });
  }

  async refreshStats(): Promise<TodoServiceState> {
    return this.execute(async () => {
      this.logger.log('Refreshing stats');
      
      // Get current todos
      const todos = await this.repository.getAll();
      
      const state = this.buildState(todos);
      
      this.logger.log('Stats refreshed', state.stats);
      return state;
    });
  }

  // Helper method to build complete state
  private buildState(todos: Todo[], filter?: TodoFilter): TodoServiceState {
    const currentState = this.getCurrentData();
    const activeFilter = filter || currentState?.currentFilter || { status: 'all' };
    
    // Apply filter
    let filteredTodos = todos;
    
    if (activeFilter.status && activeFilter.status !== 'all') {
      filteredTodos = filteredTodos.filter(todo => 
        activeFilter.status === 'completed' ? todo.completed : !todo.completed
      );
    }
    
    if (activeFilter.priority) {
      filteredTodos = filteredTodos.filter(todo => todo.priority === activeFilter.priority);
    }
    
    if (activeFilter.search) {
      const searchTerm = activeFilter.search.toLowerCase();
      filteredTodos = filteredTodos.filter(todo => 
        todo.title.toLowerCase().includes(searchTerm) ||
        todo.description?.toLowerCase().includes(searchTerm) ||
        todo.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }
    
    if (activeFilter.tags && activeFilter.tags.length > 0) {
      filteredTodos = filteredTodos.filter(todo => 
        activeFilter.tags!.some(tag => todo.tags.includes(tag))
      );
    }
    
    // Calculate stats
    const stats = this.calculateStats(todos);
    
    return {
      todos,
      filteredTodos,
      currentFilter: activeFilter,
      stats,
      isLoading: false,
      selectedTodo: currentState?.selectedTodo || null
    };
  }

  private calculateStats(todos: Todo[]): TodoStats {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const pending = total - completed;
    
    const byPriority = {
      low: todos.filter(t => t.priority === 'low').length,
      medium: todos.filter(t => t.priority === 'medium').length,
      high: todos.filter(t => t.priority === 'high').length
    };
    
    const now = new Date();
    const overdue = todos.filter(t => 
      !t.completed && t.dueDate && t.dueDate < now
    ).length;
    
    return {
      total,
      completed,
      pending,
      byPriority,
      overdue
    };
  }
}

// Todo Form Service - manages form state for creating/editing todos
@Service()
export class TodoFormService extends AsyncState<TodoFormState> implements TodoFormServiceType {
  constructor(@Inject() private logger: LoggerInterface) {
    super();
    
    // Initialize with empty form
    this.reset();
    this.logger.log('TodoFormService initialized');
  }

  async setTitle(title: string): Promise<TodoFormState> {
    return this.execute(async () => {
      const currentState = this.getCurrentData()!;
      const newState = {
        ...currentState,
        title,
        errors: { ...currentState.errors }
      };
      
      // Clear title error if it exists
      delete newState.errors.title;
      
      // Validate
      newState.isValid = this.validateState(newState);
      
      return newState;
    });
  }

  async setDescription(description: string): Promise<TodoFormState> {
    return this.execute(async () => {
      const currentState = this.getCurrentData()!;
      const newState = {
        ...currentState,
        description,
        isValid: this.validateState({ ...currentState, description })
      };
      
      return newState;
    });
  }

  async setPriority(priority: 'low' | 'medium' | 'high'): Promise<TodoFormState> {
    return this.execute(async () => {
      const currentState = this.getCurrentData()!;
      const newState = {
        ...currentState,
        priority,
        isValid: this.validateState({ ...currentState, priority })
      };
      
      return newState;
    });
  }

  async setDueDate(date: string): Promise<TodoFormState> {
    return this.execute(async () => {
      const currentState = this.getCurrentData()!;
      const newState = {
        ...currentState,
        dueDate: date,
        isValid: this.validateState({ ...currentState, dueDate: date })
      };
      
      return newState;
    });
  }

  async addTag(tag: string): Promise<TodoFormState> {
    return this.execute(async () => {
      const currentState = this.getCurrentData()!;
      const trimmedTag = tag.trim();
      
      if (!trimmedTag || currentState.tags.includes(trimmedTag)) {
        return currentState;
      }
      
      const newTags = [...currentState.tags, trimmedTag];
      const newState = {
        ...currentState,
        tags: newTags,
        isValid: this.validateState({ ...currentState, tags: newTags })
      };
      
      return newState;
    });
  }

  async removeTag(tag: string): Promise<TodoFormState> {
    return this.execute(async () => {
      const currentState = this.getCurrentData()!;
      const newTags = currentState.tags.filter(t => t !== tag);
      const newState = {
        ...currentState,
        tags: newTags,
        isValid: this.validateState({ ...currentState, tags: newTags })
      };
      
      return newState;
    });
  }

  async setTags(tags: string[]): Promise<TodoFormState> {
    return this.execute(async () => {
      const currentState = this.getCurrentData()!;
      const newState = {
        ...currentState,
        tags: [...tags],
        isValid: this.validateState({ ...currentState, tags })
      };
      
      return newState;
    });
  }

  async validate(): Promise<TodoFormState> {
    return this.execute(async () => {
      const currentState = this.getCurrentData()!;
      const errors: Record<string, string> = {};
      
      // Validate title
      if (!currentState.title.trim()) {
        errors.title = 'Title is required';
      } else if (currentState.title.length > 100) {
        errors.title = 'Title must be less than 100 characters';
      }
      
      // Validate description
      if (currentState.description.length > 500) {
        errors.description = 'Description must be less than 500 characters';
      }
      
      // Validate due date
      if (currentState.dueDate) {
        const dueDate = new Date(currentState.dueDate);
        if (isNaN(dueDate.getTime())) {
          errors.dueDate = 'Invalid date format';
        }
      }
      
      const newState = {
        ...currentState,
        errors,
        isValid: Object.keys(errors).length === 0
      };
      
      return newState;
    });
  }

  async reset(): Promise<TodoFormState> {
    return this.execute(async () => {
      const initialState: TodoFormState = {
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        tags: [],
        isValid: false,
        errors: {}
      };
      
      this.logger.log('Form reset');
      return initialState;
    });
  }

  async loadTodo(todo: Todo): Promise<TodoFormState> {
    return this.execute(async () => {
      const newState: TodoFormState = {
        title: todo.title,
        description: todo.description || '',
        priority: todo.priority,
        dueDate: todo.dueDate ? todo.dueDate.toISOString().split('T')[0] : '',
        tags: [...todo.tags],
        isValid: true,
        errors: {}
      };
      
      this.logger.log('Todo loaded into form', { id: todo.id });
      return newState;
    });
  }

  async submit(): Promise<{ isValid: boolean; todo?: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'> }> {
    const validatedState = await this.validate();
    
    if (!validatedState.isValid) {
      return { isValid: false };
    }
    
    const todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'> = {
      title: validatedState.title.trim(),
      description: validatedState.description.trim() || undefined,
      priority: validatedState.priority,
      completed: false,
      dueDate: validatedState.dueDate ? new Date(validatedState.dueDate) : undefined,
      tags: [...validatedState.tags]
    };
    
    this.logger.log('Form submitted successfully', { title: todo.title });
    return { isValid: true, todo };
  }

  private validateState(state: TodoFormState): boolean {
    return state.title.trim().length > 0 && 
           state.title.length <= 100 &&
           state.description.length <= 500;
  }
}