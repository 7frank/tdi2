import React from 'react';
import type { Inject } from '@tdi2/di-core/markers';
import type { TodoServiceInterface } from './TodoService';

export function TodoList(props: {
  services: {
    todoService: Inject<TodoServiceInterface>;
  };
}) {
  const { todoService } = props.services;

  return (
    <div>
      <ul data-testid="todo-list">
        {todoService.state.todos.map((todo, idx) => (
          <li key={idx} data-testid={`todo-${idx}`}>
            {todo}
            <button onClick={() => todoService.removeTodo(idx)}>Remove</button>
          </li>
        ))}
      </ul>
      <button onClick={() => todoService.addTodo('New Todo')}>
        Add Todo
      </button>
    </div>
  );
}
