import { Service } from "@tdi2/di-core";
import type {
  Todo,
  CreateTodoRequest,
  UpdateTodoRequest,
  TodoRepositoryInterface2,
} from "./types";

@Service()
export class TodoRepository implements TodoRepositoryInterface2 {
  private storageKey = "tdi2-todos";

  async getAll(): Promise<Todo[]> {
    // Simulate API delay
    await this.delay(100);

    const stored = localStorage.getItem(this.storageKey);
    if (!stored) return [];

    const todos = JSON.parse(stored);
    return todos.map((todo: any) => ({
      ...todo,
      createdAt: new Date(todo.createdAt),
      updatedAt: new Date(todo.updatedAt),
    }));
  }

  async create(request: CreateTodoRequest): Promise<Todo> {
    await this.delay(200);

    const todo: Todo = {
      id: this.generateId(),
      title: request.title.trim(),
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const todos = await this.getAll();
    todos.push(todo);
    await this.saveAll(todos);

    return todo;
  }

  async update(request: UpdateTodoRequest): Promise<Todo> {
    await this.delay(150);

    const todos = await this.getAll();
    const index = todos.findIndex((t) => t.id === request.id);

    if (index === -1) {
      throw new Error(`Todo with id ${request.id} not found`);
    }

    const updatedTodo: Todo = {
      ...todos[index],
      ...request,
      updatedAt: new Date(),
    };

    todos[index] = updatedTodo;
    await this.saveAll(todos);

    return updatedTodo;
  }

  async delete(id: string): Promise<void> {
    await this.delay(100);

    const todos = await this.getAll();
    const filtered = todos.filter((t) => t.id !== id);

    if (filtered.length === todos.length) {
      throw new Error(`Todo with id ${id} not found`);
    }

    await this.saveAll(filtered);
  }

  private async saveAll(todos: Todo[]): Promise<void> {
    localStorage.setItem(this.storageKey, JSON.stringify(todos));
  }

  private generateId(): string {
    return `todo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
