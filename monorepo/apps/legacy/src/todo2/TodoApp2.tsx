import React from "react";
import type { Inject } from "@tdi2/di-core/markers";
import type {
  TodoServiceInterface,
  AppStateServiceInterface,
  NotificationServiceInterface,
  Todo,
} from "./types";

import "./styles.css";

// ===== ROOT APP COMPONENT - ZERO PROPS =====
interface AppProps {
  services: {
    todoService: Inject<TodoServiceInterface>;
    appState: Inject<AppStateServiceInterface>;
    notifications: Inject<NotificationServiceInterface>;
  };
}

export function TodoApp2(props: AppProps) {
  const {
    services: { todoService, appState, notifications },
  } = props;

  const todos = todoService.state.todos;
  const loading = todoService.state.loading;
  const stats = todoService.state.stats;
  const theme = appState.state.theme;
  const currentView = appState.state.currentView;

  return (
    <div className={`app theme-${theme}`}>
      <header className="app-header">
        <h1>TDI2 Todo App</h1>
        <div className="header-controls">
          <ViewToggle />
          <ThemeToggle />
        </div>
      </header>

      <main className="app-main">
        <div className="todo-container">
          <AddTodoForm />
          <TodoFilters />
          <TodoStats />

          {loading && <LoadingSpinner />}

          {currentView === "list" ? <TodoList /> : <TodoKanban />}

          {stats.completed > 0 && <ClearCompletedButton />}
        </div>
      </main>

      <NotificationContainer />
    </div>
  );
}

// ===== HEADER COMPONENTS =====
interface ViewToggleProps {
  services: {
    appState: Inject<AppStateServiceInterface>;
  };
}

function ViewToggle(props: ViewToggleProps) {
  const {
    services: { appState },
  } = props;

  const currentView = appState.state.currentView;

  return (
    <div className="view-toggle">
      <button
        className={currentView === "list" ? "active" : ""}
        onClick={() => appState.setView("list")}
      >
        📋 List
      </button>
      <button
        className={currentView === "kanban" ? "active" : ""}
        onClick={() => appState.setView("kanban")}
      >
        📊 Kanban
      </button>
    </div>
  );
}

interface ThemeToggleProps {
  services: {
    appState: Inject<AppStateServiceInterface>;
  };
}

function ThemeToggle(props: ThemeToggleProps) {
  const {
    services: { appState },
  } = props;
  const theme = appState.state.theme;

  return (
    <button
      className="theme-toggle"
      onClick={() => appState.setTheme(theme === "light" ? "dark" : "light")}
    >
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  );
}

// ===== TODO INPUT FORM =====
interface AddTodoFormProps {
  services: {
    todoService: Inject<TodoServiceInterface>;
  };
}

function AddTodoForm(props: AddTodoFormProps) {
  const {
    services: { todoService },
  } = props;

  const loading = todoService.state.loading;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;

    if (title?.trim()) {
      todoService.addTodo({ title });
      e.currentTarget.reset();
    }
  };

  return (
    <form className="add-todo-form" onSubmit={handleSubmit}>
      <input
        name="title"
        type="text"
        placeholder="What needs to be done?"
        disabled={loading}
        autoFocus
      />
      <button type="submit" disabled={loading}>
        Add Todo
      </button>
    </form>
  );
}

// ===== FILTER CONTROLS =====
interface TodoFiltersProps {
  services: {
    todoService: Inject<TodoServiceInterface>;
  };
}

function TodoFilters(props: TodoFiltersProps) {
  const {
    services: { todoService },
  } = props;

  const filter = todoService.state.filter;

  return (
    <div className="todo-filters">
      <div className="status-filters">
        <button
          className={filter.status === "all" ? "active" : ""}
          onClick={() => todoService.setFilter("all")}
        >
          All
        </button>
        <button
          className={filter.status === "active" ? "active" : ""}
          onClick={() => todoService.setFilter("active")}
        >
          Active
        </button>
        <button
          className={filter.status === "completed" ? "active" : ""}
          onClick={() => todoService.setFilter("completed")}
        >
          Completed
        </button>
      </div>

      <div className="search-filter">
        <input
          type="text"
          placeholder="Search todos..."
          value={filter.search}
          onChange={(e) => todoService.setSearch(e.target.value)}
        />
      </div>
    </div>
  );
}

// ===== STATS DISPLAY =====
interface TodoStatsProps {
  services: {
    todoService: Inject<TodoServiceInterface>;
  };
}

function TodoStats(props: TodoStatsProps) {
  const {
    services: { todoService },
  } = props;

  const stats = todoService.state.stats;

  return (
    <div className="todo-stats">
      <span className="stat">Total: {stats.total}</span>
      <span className="stat">Active: {stats.active}</span>
      <span className="stat">Completed: {stats.completed}</span>
    </div>
  );
}

// ===== LIST VIEW =====
interface TodoListProps {
  services: {
    todoService: Inject<TodoServiceInterface>;
  };
}

function TodoList(props: TodoListProps) {
  const {
    services: { todoService },
  } = props;
  const filteredTodos = todoService.getFilteredTodos();

  if (filteredTodos.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="todo-list">
      {filteredTodos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </div>
  );
}

// ===== KANBAN VIEW =====
interface TodoKanbanProps {
  services: {
    todoService: Inject<TodoServiceInterface>;
  };
}

function TodoKanban(props: TodoKanbanProps) {
  const {
    services: { todoService },
  } = props;

  const filteredTodos = todoService.getFilteredTodos();
  const activeTodos = filteredTodos.filter((t) => !t.completed);
  const completedTodos = filteredTodos.filter((t) => t.completed);

  return (
    <div className="todo-kanban">
      <div className="kanban-column">
        <h3>Active ({activeTodos.length})</h3>
        <div className="kanban-todos">
          {activeTodos.map((todo) => (
            <TodoCard key={todo.id} todo={todo} />
          ))}
        </div>
      </div>

      <div className="kanban-column">
        <h3>Completed ({completedTodos.length})</h3>
        <div className="kanban-todos">
          {completedTodos.map((todo) => (
            <TodoCard key={todo.id} todo={todo} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== TODO ITEM COMPONENTS =====
interface TodoItemProps {
  todo: Todo;
  services: {
    todoService: Inject<TodoServiceInterface>;
  };
}

function TodoItem(props: TodoItemProps) {
  const {
    todo,
    services: { todoService },
  } = props;

  const loading = todoService.state.loading;

  const handleToggle = () => {
    todoService.toggleTodo(todo.id);
  };

  const handleDelete = () => {
    if (confirm(`Delete "${todo.title}"?`)) {
      todoService.deleteTodo(todo.id);
    }
  };

  const handleEdit = () => {
    const newTitle = prompt("Edit todo:", todo.title);
    if (newTitle && newTitle.trim() && newTitle !== todo.title) {
      todoService.updateTodo({ id: todo.id, title: newTitle });
    }
  };

  return (
    <div className={`todo-item ${todo.completed ? "completed" : ""}`}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={handleToggle}
        disabled={loading}
      />

      <span
        className="todo-title"
        onDoubleClick={handleEdit}
        title="Double-click to edit"
      >
        {todo.title}
      </span>

      <div className="todo-actions">
        <button onClick={handleEdit} disabled={loading}>
          ✏️
        </button>
        <button onClick={handleDelete} disabled={loading}>
          🗑️
        </button>
      </div>
    </div>
  );
}

interface TodoCardProps {
  todo: Todo;
  services: {
    todoService: Inject<TodoServiceInterface>;
  };
}

function TodoCard(props: TodoCardProps) {
  const {
    todo,
    services: { todoService },
  } = props;

  const loading = todoService.state.loading;

  return (
    <div className={`todo-card ${todo.completed ? "completed" : ""}`}>
      <div className="todo-card-header">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => todoService.toggleTodo(todo.id)}
          disabled={loading}
        />
        <button
          onClick={() => {
            if (confirm(`Delete "${todo.title}"?`)) {
              todoService.deleteTodo(todo.id);
            }
          }}
          disabled={loading}
        >
          🗑️
        </button>
      </div>

      <div className="todo-card-content">
        <h4>{todo.title}</h4>
        <small>Created: {todo.createdAt.toLocaleDateString()}</small>
      </div>
    </div>
  );
}

// ===== UTILITY COMPONENTS =====
function EmptyState() {
  return (
    <div className="empty-state">
      <p>No todos found. Add one above!</p>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="loading-spinner">
      <div className="spinner"></div>
      <span>Loading...</span>
    </div>
  );
}

interface ClearCompletedButtonProps {
  services: {
    todoService: Inject<TodoServiceInterface>;
  };
}

function ClearCompletedButton(props: ClearCompletedButtonProps) {
  const {
    services: { todoService },
  } = props;
  const loading = todoService.state.loading;
  const hasCompleted = todoService.hasCompletedTodos();

  if (!hasCompleted) return null;

  return (
    <button
      className="clear-completed"
      onClick={() => {
        if (confirm("Clear all completed todos?")) {
          todoService.clearCompleted();
        }
      }}
      disabled={loading}
    >
      Clear Completed
    </button>
  );
}

// ===== NOTIFICATIONS =====
interface NotificationContainerProps {
  services: {
    notifications: Inject<NotificationServiceInterface>;
  };
}

function NotificationContainer(props: NotificationContainerProps) {
  const {
    services: { notifications },
  } = props;
  const notificationList = notifications.state.notifications;

  return (
    <div className="notification-container">
      {notificationList.map((notification) => (
        <div
          key={notification.id}
          className={`notification notification--${notification.type}`}
          onClick={() => notifications.dismiss(notification.id)}
        >
          <span>{notification.message}</span>
          <button>×</button>
        </div>
      ))}
    </div>
  );
}
