// src/todo/services/TodoRepository.ts - IndexedDB implementation for Todo persistence

import { Service, Inject } from '../../di/decorators';
import type { 
  Todo, 
  TodoFilter, 
  TodoRepositoryInterface,
  LoggerInterface 
} from '../interfaces/TodoInterfaces';

@Service()
export class TodoRepository implements TodoRepositoryInterface {
  private dbName = 'TodoAppDB';
  private dbVersion = 1;
  private storeName = 'todos';
  private db: IDBDatabase | null = null;

  constructor(@Inject() private logger: LoggerInterface) {
    this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        this.logger.error('Failed to open IndexedDB', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.logger.log('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          
          // Create indexes for efficient querying
          store.createIndex('completed', 'completed', { unique: false });
          store.createIndex('priority', 'priority', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('dueDate', 'dueDate', { unique: false });
          store.createIndex('tags', 'tags', { unique: false, multiEntry: true });
          
          this.logger.log('Created IndexedDB object store with indexes');
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initDB();
    }
    if (!this.db) {
      throw new Error('Failed to initialize IndexedDB');
    }
    return this.db;
  }

  private generateId(): string {
    return `todo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getAll(): Promise<Todo[]> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        
        request.onsuccess = () => {
          const todos = request.result.map(this.deserializeTodo);
          this.logger.log(`Retrieved ${todos.length} todos from IndexedDB`);
          resolve(todos);
        };
        
        request.onerror = () => {
          this.logger.error('Failed to get all todos', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      this.logger.error('Error in getAll', error);
      return [];
    }
  }

  async getById(id: string): Promise<Todo | null> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.get(id);
        
        request.onsuccess = () => {
          const result = request.result ? this.deserializeTodo(request.result) : null;
          this.logger.log(`Retrieved todo with id: ${id}`, result ? 'found' : 'not found');
          resolve(result);
        };
        
        request.onerror = () => {
          this.logger.error(`Failed to get todo with id: ${id}`, request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      this.logger.error('Error in getById', error);
      return null;
    }
  }

  async create(todoData: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>): Promise<Todo> {
    try {
      const db = await this.ensureDB();
      const now = new Date();
      
      const todo: Todo = {
        ...todoData,
        id: this.generateId(),
        createdAt: now,
        updatedAt: now,
      };

      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.add(this.serializeTodo(todo));
        
        request.onsuccess = () => {
          this.logger.log('Todo created successfully', { id: todo.id, title: todo.title });
          resolve(todo);
        };
        
        request.onerror = () => {
          this.logger.error('Failed to create todo', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      this.logger.error('Error in create', error);
      throw error;
    }
  }

  async update(id: string, updates: Partial<Todo>): Promise<Todo> {
    try {
      const db = await this.ensureDB();
      const existingTodo = await this.getById(id);
      
      if (!existingTodo) {
        throw new Error(`Todo with id ${id} not found`);
      }

      const updatedTodo: Todo = {
        ...existingTodo,
        ...updates,
        id, // Ensure id doesn't change
        updatedAt: new Date(),
      };

      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.put(this.serializeTodo(updatedTodo));
        
        request.onsuccess = () => {
          this.logger.log('Todo updated successfully', { id, updates });
          resolve(updatedTodo);
        };
        
        request.onerror = () => {
          this.logger.error('Failed to update todo', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      this.logger.error('Error in update', error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.delete(id);
        
        request.onsuccess = () => {
          this.logger.log('Todo deleted successfully', { id });
          resolve(true);
        };
        
        request.onerror = () => {
          this.logger.error('Failed to delete todo', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      this.logger.error('Error in delete', error);
      return false;
    }
  }

  async search(query: string): Promise<Todo[]> {
    try {
      const todos = await this.getAll();
      const lowercaseQuery = query.toLowerCase();
      
      const filtered = todos.filter(todo => 
        todo.title.toLowerCase().includes(lowercaseQuery) ||
        todo.description?.toLowerCase().includes(lowercaseQuery) ||
        todo.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
      );

      this.logger.log(`Search for "${query}" returned ${filtered.length} results`);
      return filtered;
    } catch (error) {
      this.logger.error('Error in search', error);
      return [];
    }
  }

  async getByFilter(filter: TodoFilter): Promise<Todo[]> {
    try {
      const todos = await this.getAll();
      
      let filtered = todos;

      // Filter by status
      if (filter.status && filter.status !== 'all') {
        filtered = filtered.filter(todo => 
          filter.status === 'completed' ? todo.completed : !todo.completed
        );
      }

      // Filter by priority
      if (filter.priority) {
        filtered = filtered.filter(todo => todo.priority === filter.priority);
      }

      // Filter by search term
      if (filter.search) {
        const searchTerm = filter.search.toLowerCase();
        filtered = filtered.filter(todo => 
          todo.title.toLowerCase().includes(searchTerm) ||
          todo.description?.toLowerCase().includes(searchTerm)
        );
      }

      // Filter by tags
      if (filter.tags && filter.tags.length > 0) {
        filtered = filtered.filter(todo => 
          filter.tags!.some(tag => todo.tags.includes(tag))
        );
      }

      this.logger.log(`Filter applied, returned ${filtered.length} todos`, filter);
      return filtered;
    } catch (error) {
      this.logger.error('Error in getByFilter', error);
      return [];
    }
  }

  async clearCompleted(): Promise<number> {
    try {
      const todos = await this.getAll();
      const completedTodos = todos.filter(todo => todo.completed);
      
      const db = await this.ensureDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      let deletedCount = 0;
      
      return new Promise((resolve, reject) => {
        const deletePromises = completedTodos.map(todo => 
          new Promise<void>((resolveDelete, rejectDelete) => {
            const request = store.delete(todo.id);
            request.onsuccess = () => {
              deletedCount++;
              resolveDelete();
            };
            request.onerror = () => rejectDelete(request.error);
          })
        );

        Promise.all(deletePromises)
          .then(() => {
            this.logger.log(`Cleared ${deletedCount} completed todos`);
            resolve(deletedCount);
          })
          .catch(error => {
            this.logger.error('Failed to clear completed todos', error);
            reject(error);
          });
      });
    } catch (error) {
      this.logger.error('Error in clearCompleted', error);
      return 0;
    }
  }

  // Helper methods for serialization (IndexedDB doesn't handle Date objects well)
  private serializeTodo(todo: Todo): any {
    return {
      ...todo,
      createdAt: todo.createdAt.toISOString(),
      updatedAt: todo.updatedAt.toISOString(),
      dueDate: todo.dueDate?.toISOString() || null,
    };
  }

  private deserializeTodo(data: any): Todo {
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    };
  }
}

// Mock repository for testing/development
@Service()
export class MockTodoRepository implements TodoRepositoryInterface {
  private todos: Todo[] = [];
  private nextId = 1;

  constructor(@Inject() private logger: LoggerInterface) {
    this.seedData();
  }

  private seedData(): void {
    this.todos = [
      {
        id: 'todo_1',
        title: 'Learn TDI2 Dependency Injection',
        description: 'Understand interface-based DI with AsyncState',
        completed: false,
        priority: 'high',
        createdAt: new Date(Date.now() - 86400000), // Yesterday
        updatedAt: new Date(Date.now() - 86400000),
        dueDate: new Date(Date.now() + 86400000), // Tomorrow
        tags: ['learning', 'typescript', 'di']
      },
      {
        id: 'todo_2',
        title: 'Build Todo App',
        description: 'Create a complete todo application using TDI2',
        completed: true,
        priority: 'medium',
        createdAt: new Date(Date.now() - 172800000), // 2 days ago
        updatedAt: new Date(),
        tags: ['project', 'react', 'tdi2']
      },
      {
        id: 'todo_3',
        title: 'Write Tests',
        description: 'Add comprehensive tests for the todo application',
        completed: false,
        priority: 'low',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ['testing', 'quality']
      }
    ];

    this.logger.log('Mock data seeded', { count: this.todos.length });
  }

  async getAll(): Promise<Todo[]> {
    return [...this.todos];
  }

  async getById(id: string): Promise<Todo | null> {
    return this.todos.find(todo => todo.id === id) || null;
  }

  async create(todoData: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>): Promise<Todo> {
    const now = new Date();
    const todo: Todo = {
      ...todoData,
      id: `todo_${this.nextId++}`,
      createdAt: now,
      updatedAt: now,
    };

    this.todos.push(todo);
    this.logger.log('Mock todo created', { id: todo.id });
    return todo;
  }

  async update(id: string, updates: Partial<Todo>): Promise<Todo> {
    const index = this.todos.findIndex(todo => todo.id === id);
    if (index === -1) {
      throw new Error(`Todo with id ${id} not found`);
    }

    const updatedTodo = {
      ...this.todos[index],
      ...updates,
      id,
      updatedAt: new Date(),
    };

    this.todos[index] = updatedTodo;
    this.logger.log('Mock todo updated', { id });
    return updatedTodo;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.todos.findIndex(todo => todo.id === id);
    if (index === -1) return false;

    this.todos.splice(index, 1);
    this.logger.log('Mock todo deleted', { id });
    return true;
  }

  async search(query: string): Promise<Todo[]> {
    const lowercaseQuery = query.toLowerCase();
    return this.todos.filter(todo => 
      todo.title.toLowerCase().includes(lowercaseQuery) ||
      todo.description?.toLowerCase().includes(lowercaseQuery) ||
      todo.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  async getByFilter(filter: TodoFilter): Promise<Todo[]> {
    let filtered = [...this.todos];

    if (filter.status && filter.status !== 'all') {
      filtered = filtered.filter(todo => 
        filter.status === 'completed' ? todo.completed : !todo.completed
      );
    }

    if (filter.priority) {
      filtered = filtered.filter(todo => todo.priority === filter.priority);
    }

    if (filter.search) {
      const searchTerm = filter.search.toLowerCase();
      filtered = filtered.filter(todo => 
        todo.title.toLowerCase().includes(searchTerm) ||
        todo.description?.toLowerCase().includes(searchTerm)
      );
    }

    if (filter.tags && filter.tags.length > 0) {
      filtered = filtered.filter(todo => 
        filter.tags!.some(tag => todo.tags.includes(tag))
      );
    }

    return filtered;
  }

  async clearCompleted(): Promise<number> {
    const initialCount = this.todos.length;
    this.todos = this.todos.filter(todo => !todo.completed);
    const deletedCount = initialCount - this.todos.length;
    
    this.logger.log('Mock completed todos cleared', { count: deletedCount });
    return deletedCount;
  }
}