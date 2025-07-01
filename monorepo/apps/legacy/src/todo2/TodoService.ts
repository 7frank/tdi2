import { Service, Inject } from "@tdi2/di-core";

import type {
  Todo,
  TodoFilter,
  CreateTodoRequest,
  UpdateTodoRequest,
  TodoServiceInterface,
  TodoRepositoryInterface2,
  NotificationServiceInterface,
} from "./types";

@Service()
export class TodoService2 implements TodoServiceInterface {
  state = {
    todos: [] as Todo[],
    loading: false,
    filter: {
      status: "all" as "all" | "active" | "completed",
      search: "",
    },
    stats: {
      total: 0,
      active: 0,
      completed: 0,
    },
  };

  constructor(
    @Inject() private todoRepository: TodoRepositoryInterface2,
    @Inject() private notificationService: NotificationServiceInterface
  ) {
    // this.loadTodos();
    // this.watchStatsChanges();
    this.updateStats();
  }

  // private watchStatsChanges(): void {
  //   subscribe(this.state, () => {
  //     this.updateStats();
  //   });
  // }

  private updateStats(): void {
    const total = this.state.todos.length;
    const completed = this.state.todos.filter((t) => t.completed).length;
    const active = total - completed;

    this.state.stats = { total, active, completed };
  }

  async loadTodos(): Promise<void> {
    this.state.loading = true;
    try {
      const todos = await this.todoRepository.getAll();
      this.state.todos = todos;
      this.notificationService.showInfo(`Loaded ${todos.length} todos`);
    } catch (error) {
      this.notificationService.showError("Failed to load todos");
      console.error("Load todos error:", error);
    } finally {
      this.state.loading = false;
    }
  }

  async addTodo(request: CreateTodoRequest): Promise<void> {
    if (!request.title.trim()) {
      this.notificationService.showError("Todo title cannot be empty");
      return;
    }

    this.state.loading = true;
    try {
      const newTodo = await this.todoRepository.create(request);
      this.state.todos.push(newTodo);
      this.notificationService.showSuccess(`Created todo: "${newTodo.title}"`);
    } catch (error) {
      this.notificationService.showError("Failed to create todo");
      console.error("Add todo error:", error);
    } finally {
      this.state.loading = false;
    }
    this.updateStats();
  }

  async updateTodo(request: UpdateTodoRequest): Promise<void> {
    const existingTodo = this.state.todos.find((t) => t.id === request.id);
    if (!existingTodo) {
      this.notificationService.showError("Todo not found");
      return;
    }

    if (request.title !== undefined && !request.title.trim()) {
      this.notificationService.showError("Todo title cannot be empty");
      return;
    }

    this.state.loading = true;
    try {
      const updatedTodo = await this.todoRepository.update(request);
      const index = this.state.todos.findIndex((t) => t.id === request.id);
      this.state.todos[index] = updatedTodo;

      const action =
        request.completed !== undefined
          ? request.completed
            ? "completed"
            : "uncompleted"
          : "updated";
      this.notificationService.showSuccess(
        `Todo ${action}: "${updatedTodo.title}"`
      );
    } catch (error) {
      this.notificationService.showError("Failed to update todo");
      console.error("Update todo error:", error);
    } finally {
      this.state.loading = false;
    }
  }

  async deleteTodo(id: string): Promise<void> {
    const todo = this.state.todos.find((t) => t.id === id);
    if (!todo) {
      this.notificationService.showError("Todo not found");
      return;
    }

    this.state.loading = true;
    try {
      await this.todoRepository.delete(id);
      this.state.todos = this.state.todos.filter((t) => t.id !== id);
      this.notificationService.showSuccess(`Deleted todo: "${todo.title}"`);
    } catch (error) {
      this.notificationService.showError("Failed to delete todo");
      console.error("Delete todo error:", error);
    } finally {
      this.state.loading = false;
    }
  }

  async toggleTodo(id: string): Promise<void> {
    const todo = this.state.todos.find((t) => t.id === id);
    if (!todo) {
      this.notificationService.showError("Todo not found");
      return;
    }

    await this.updateTodo({
      id,
      completed: !todo.completed,
    });
  }

  async clearCompleted(): Promise<void> {
    const completedTodos = this.state.todos.filter((t) => t.completed);
    if (completedTodos.length === 0) {
      this.notificationService.showInfo("No completed todos to clear");
      return;
    }

    this.state.loading = true;
    try {
      await Promise.all(
        completedTodos.map((todo) => this.todoRepository.delete(todo.id))
      );
      this.state.todos = this.state.todos.filter((t) => !t.completed);
      this.notificationService.showSuccess(
        `Cleared ${completedTodos.length} completed todos`
      );
    } catch (error) {
      this.notificationService.showError("Failed to clear completed todos");
      console.error("Clear completed error:", error);
    } finally {
      this.state.loading = false;
    }
  }

  setFilter(status: "all" | "active" | "completed"): void {
    this.state.filter.status = status;
  }

  setSearch(search: string): void {
    this.state.filter.search = search;
  }

  getFilteredTodos(): Todo[] {
    let filtered = this.state.todos;

    // Filter by status
    if (this.state.filter.status === "active") {
      filtered = filtered.filter((t) => !t.completed);
    } else if (this.state.filter.status === "completed") {
      filtered = filtered.filter((t) => t.completed);
    }

    // Filter by search
    if (this.state.filter.search) {
      const search = this.state.filter.search.toLowerCase();
      filtered = filtered.filter((t) => t.title.toLowerCase().includes(search));
    }

    return filtered.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  hasCompletedTodos(): boolean {
    return this.state.todos.some((t) => t.completed);
  }
}
