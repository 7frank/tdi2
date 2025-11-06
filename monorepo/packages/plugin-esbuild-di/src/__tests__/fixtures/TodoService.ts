import { Service } from '@tdi2/di-core';

export interface TodoServiceInterface {
  state: {
    todos: string[];
  };
  addTodo(text: string): void;
  removeTodo(index: number): void;
}

@Service()
export class TodoService implements TodoServiceInterface {
  state = {
    todos: [] as string[],
  };

  addTodo(text: string) {
    this.state.todos.push(text);
  }

  removeTodo(index: number) {
    this.state.todos.splice(index, 1);
  }
}
