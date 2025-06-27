// src/todo/components/TodoList.tsx - Main list component for displaying todos

import React, { useState } from 'react';
import type { Inject } from '../../di/markers';
import type { 
  TodoServiceType, 
  Todo, 
  TodoFilter 
} from '../interfaces/TodoInterfaces';
import { useObservableState } from '../../experimental-utils/observable/useObservableState';

interface TodoListProps {
  onEditTodo?: (todo: Todo) => void;
  onSelectTodo?: (todo: Todo | null) => void;
  services: {
    todoService: Inject<TodoServiceType>;
  };
}

export function TodoList(props: TodoListProps) {
  const { onEditTodo, onSelectTodo, services } = props;
  
  // Use the observable state hook for reactive state management
  const todoState = useObservableState(services.todoService);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompleted, setShowCompleted] = useState(true);

  // Load todos on component mount
  React.useEffect(() => {
    services.todoService.loadTodos();
  }, [services.todoService]);

  const handleToggleTodo = async (id: string) => {
    await services.todoService.toggleTodo(id);
  };

  const handleDeleteTodo = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      await services.todoService.deleteTodo(id);
    }
  };

  const handleFilterChange = async (filter: Partial<TodoFilter>) => {
    const currentFilter = todoState.currentFilter || {};
    const newFilter = { ...currentFilter, ...filter };
    await services.todoService.setFilter(newFilter);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      await services.todoService.searchTodos(query);
    } else {
      await services.todoService.setFilter({ status: 'all' });
    }
  };

  const handleClearCompleted = async () => {
    const completedCount = todoState.todos?.filter(t => t.completed).length || 0;
    if (completedCount === 0) return;
    
    if (window.confirm(`Clear ${completedCount} completed todos?`)) {
      await services.todoService.clearCompleted();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ff4757';
      case 'medium': return '#ffa502';
      case 'low': return '#2ed573';
      default: return '#747d8c';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const isOverdue = (todo: Todo) => {
    return todo.dueDate && !todo.completed && new Date(todo.dueDate) < new Date();
  };

  // Filter todos based on UI state
  const displayTodos = React.useMemo(() => {
    if (!todoState.filteredTodos) return [];
    
    let filtered = todoState.filteredTodos;
    
    if (!showCompleted) {
      filtered = filtered.filter(todo => !todo.completed);
    }
    
    // Sort by: overdue first, then by priority (high to low), then by creation date
    return filtered.sort((a, b) => {
      // Overdue todos first
      const aOverdue = isOverdue(a);
      const bOverdue = isOverdue(b);
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      
      // Then by completion status (incomplete first)
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      
      // Then by priority
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Finally by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [todoState.filteredTodos, showCompleted]);

  const currentFilter = todoState.currentFilter;
  const stats = todoState.stats;

  if (todoState.isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '200px',
        fontSize: '16px',
        color: '#666'
      }}>
        <span>⏳ Loading todos...</span>
      </div>
    );
  }

  if (todoState.isError) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px',
        color: '#ff4757'
      }}>
        <h3>❌ Error Loading Todos</h3>
        <p>{todoState.error?.message || 'Something went wrong'}</p>
        <button
          onClick={() => services.todoService.loadTodos()}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header with Stats */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ 
          margin: '0 0 16px 0', 
          color: '#2c3e50',
          fontSize: '28px' 
        }}>
          📝 Todo List
        </h1>
        
        {stats && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '16px',
            marginBottom: '20px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3498db' }}>
                {stats.total}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Total</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e74c3c' }}>
                {stats.pending}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Pending</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#27ae60' }}>
                {stats.completed}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Completed</div>
            </div>
            {stats.overdue > 0 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4757' }}>
                  {stats.overdue}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>Overdue</div>
              </div>
            )}
          </div>
        )}

        {/* Search and Filters */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto auto',
          gap: '12px',
          alignItems: 'center'
        }}>
          <input
            type="text"
            placeholder="Search todos..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            style={{
              padding: '10px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          
          <select
            value={currentFilter?.status || 'all'}
            onChange={(e) => handleFilterChange({ status: e.target.value as 'all' | 'pending' | 'completed' })}
            style={{
              padding: '10px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              minWidth: '120px'
            }}
          >
            <option value="all">All Todos</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={currentFilter?.priority || ''}
            onChange={(e) => handleFilterChange({ priority: e.target.value as 'low' | 'medium' | 'high' | undefined })}
            style={{
              padding: '10px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              minWidth: '120px'
            }}
          >
            <option value="">All Priorities</option>
            <option value="high">🔴 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🟢 Low</option>
          </select>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          fontSize: '14px',
          color: '#666'
        }}>
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
          />
          Show completed todos
        </label>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => services.todoService.refreshStats()}
            disabled={todoState.isLoading}
            style={{
              padding: '8px 12px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            🔄 Refresh
          </button>
          
          {stats && stats.completed > 0 && (
            <button
              onClick={handleClearCompleted}
              disabled={todoState.isLoading}
              style={{
                padding: '8px 12px',
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              🗑️ Clear Completed ({stats.completed})
            </button>
          )}
        </div>
      </div>

      {/* Todo List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {displayTodos.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: 'white',
            borderRadius: '8px',
            color: '#666'
          }}>
            {searchQuery ? (
              <>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                <h3>No todos found</h3>
                <p>Try adjusting your search or filters</p>
              </>
            ) : (
              <>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                <h3>No todos yet</h3>
                <p>Create your first todo to get started!</p>
              </>
            )}
          </div>
        ) : (
          displayTodos.map((todo) => (
            <div
              key={todo.id}
              onClick={() => onSelectTodo?.(todo)}
              style={{
                backgroundColor: 'white',
                border: `1px solid ${isOverdue(todo) ? '#ff4757' : '#e1e8ed'}`,
                borderRadius: '8px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                opacity: todo.completed ? 0.7 : 1,
                boxShadow: todoState.selectedTodo?.id === todo.id ? '0 0 0 2px #4CAF50' : '0 1px 3px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                if (todoState.selectedTodo?.id !== todo.id) {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (todoState.selectedTodo?.id !== todo.id) {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleToggleTodo(todo.id);
                  }}
                  style={{ 
                    marginTop: '2px',
                    transform: 'scale(1.2)',
                    cursor: 'pointer'
                  }}
                />

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px'
                  }}>
                    <span style={{ fontSize: '16px' }}>
                      {getPriorityIcon(todo.priority)}
                    </span>
                    <h3 style={{
                      margin: 0,
                      fontSize: '18px',
                      fontWeight: '600',
                      textDecoration: todo.completed ? 'line-through' : 'none',
                      color: todo.completed ? '#999' : '#2c3e50',
                      wordBreak: 'break-word'
                    }}>
                      {todo.title}
                    </h3>
                    
                    {isOverdue(todo) && (
                      <span style={{
                        backgroundColor: '#ff4757',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 'bold'
                      }}>
                        OVERDUE
                      </span>
                    )}
                  </div>

                  {todo.description && (
                    <p style={{
                      margin: '8px 0',
                      fontSize: '14px',
                      color: '#666',
                      lineHeight: '1.4',
                      textDecoration: todo.completed ? 'line-through' : 'none'
                    }}>
                      {todo.description}
                    </p>
                  )}

                  {/* Meta information */}
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '12px',
                    marginTop: '12px',
                    fontSize: '12px',
                    color: '#666'
                  }}>
                    <span>Created: {formatDate(todo.createdAt)}</span>
                    
                    {todo.dueDate && (
                      <span style={{
                        color: isOverdue(todo) ? '#ff4757' : '#666'
                      }}>
                        Due: {formatDate(todo.dueDate)}
                      </span>
                    )}

                    {todo.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {todo.tags.map((tag, index) => (
                          <span
                            key={index}
                            style={{
                              backgroundColor: '#e3f2fd',
                              color: '#1565c0',
                              padding: '2px 6px',
                              borderRadius: '10px',
                              fontSize: '10px'
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditTodo?.(todo);
                    }}
                    style={{
                      padding: '6px 8px',
                      backgroundColor: '#3498db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ✏️ Edit
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTodo(todo.id, todo.title);
                    }}
                    style={{
                      padding: '6px 8px',
                      backgroundColor: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Service State Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          marginTop: '20px',
          padding: '12px',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          fontSize: '11px',
          fontFamily: 'monospace'
        }}>
          <div><strong>Service State:</strong></div>
          <div>Loading: {todoState.isLoading ? 'Yes' : 'No'}</div>
          <div>Error: {todoState.isError ? todoState.error?.message : 'None'}</div>
          <div>Total Todos: {todoState.todos?.length || 0}</div>
          <div>Filtered Todos: {todoState.filteredTodos?.length || 0}</div>
          <div>Displayed Todos: {displayTodos.length}</div>
          <div>Selected Todo: {todoState.selectedTodo?.id || 'None'}</div>
          <div>Current Filter: {JSON.stringify(currentFilter)}</div>
        </div>
      )}
    </div>
  );
}