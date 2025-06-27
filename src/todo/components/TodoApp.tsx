// src/todo/components/TodoApp.tsx - Main Todo application component

import React, { useState } from 'react';
import type { Inject } from '../../di/markers';
import type { 
  TodoServiceType, 
  TodoFormServiceType,
  Todo 
} from '../interfaces/TodoInterfaces';
import { useObservableState } from '../../experimental-utils/observable/useObservableState';
import { TodoList } from './TodoList';
import { TodoForm } from './TodoForm';

interface TodoAppProps {
  services: {
    todoService: Inject<TodoServiceType>;
    formService: Inject<TodoFormServiceType>;
  };
}

export function TodoApp(props: TodoAppProps) {
  const { services } = props;
  
  // Use the observable state hooks for reactive state management
  const todoState = useObservableState(services.todoService);
  const formState = useObservableState(services.formService);

  const [showForm, setShowForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [selectedView, setSelectedView] = useState<'list' | 'form'>('list');

  const handleCreateTodo = () => {
    setEditingTodo(null);
    setShowForm(true);
    setSelectedView('form');
    services.formService.reset();
  };

  const handleEditTodo = (todo: Todo) => {
    setEditingTodo(todo);
    setShowForm(true);
    setSelectedView('form');
    services.formService.loadTodo(todo);
  };

  const handleFormSubmit = (todo?: Todo) => {
    setShowForm(false);
    setEditingTodo(null);
    setSelectedView('list');
    
    // Refresh the todo list to show changes
    services.todoService.loadTodos();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingTodo(null);
    setSelectedView('list');
    services.formService.reset();
  };

  const handleSelectTodo = (todo: Todo | null) => {
    services.todoService.selectTodo(todo?.id || null);
  };

  // Get stats from todo service
  const stats = todoState.stats;
  const isAnyLoading = todoState.isLoading || formState.isLoading;
  const hasAnyError = todoState.isError || formState.isError;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f7fa',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px 24px',
        borderRadius: '12px',
        marginBottom: '24px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        borderLeft: '4px solid #4CAF50'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: '32px',
              fontWeight: '700',
              color: '#2c3e50',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              📝 TDI2 Todo App
            </h1>
            <p style={{
              margin: '8px 0 0 0',
              fontSize: '16px',
              color: '#666',
              fontWeight: '400'
            }}>
              Interface-based dependency injection with AsyncState pattern
            </p>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            {/* Stats Summary */}
            {stats && (
              <div style={{
                display: 'flex',
                gap: '16px',
                padding: '12px 20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                fontSize: '14px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 'bold', color: '#3498db' }}>{stats.total}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Total</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 'bold', color: '#e74c3c' }}>{stats.pending}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Pending</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 'bold', color: '#27ae60' }}>{stats.completed}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Done</div>
                </div>
              </div>
            )}

            {/* View Navigation */}
            <div style={{
              display: 'flex',
              backgroundColor: '#f1f3f4',
              borderRadius: '8px',
              padding: '4px'
            }}>
              <button
                onClick={() => {
                  setSelectedView('list');
                  setShowForm(false);
                }}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: selectedView === 'list' ? 'white' : 'transparent',
                  color: selectedView === 'list' ? '#2c3e50' : '#666',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  boxShadow: selectedView === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                📋 List
              </button>
              <button
                onClick={() => {
                  setSelectedView('form');
                  setShowForm(true);
                  if (!editingTodo) {
                    handleCreateTodo();
                  }
                }}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: selectedView === 'form' ? 'white' : 'transparent',
                  color: selectedView === 'form' ? '#2c3e50' : '#666',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  boxShadow: selectedView === 'form' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                ➕ {editingTodo ? 'Edit' : 'Create'}
              </button>
            </div>

            {/* Quick Create Button (always visible) */}
            <button
              onClick={handleCreateTodo}
              disabled={isAnyLoading}
              style={{
                padding: '12px 20px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isAnyLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                opacity: isAnyLoading ? 0.7 : 1,
                boxShadow: '0 2px 4px rgba(76, 175, 80, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!isAnyLoading) {
                  e.currentTarget.style.backgroundColor = '#45a049';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isAnyLoading) {
                  e.currentTarget.style.backgroundColor = '#4CAF50';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {isAnyLoading ? '⏳' : '➕'} New Todo
            </button>
          </div>
        </div>
      </div>

      {/* Global Loading Indicator */}
      {isAnyLoading && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#3498db',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
        }}>
          <span style={{ 
            display: 'inline-block',
            animation: 'spin 1s linear infinite'
          }}>
            ⏳
          </span>
          Processing...
        </div>
      )}

      {/* Global Error Indicator */}
      {hasAnyError && (
        <div style={{
          backgroundColor: '#ff4757',
          color: 'white',
          padding: '16px 20px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>❌</span>
            <span>Something went wrong. Please try again.</span>
          </div>
          <button
            onClick={() => {
              services.todoService.reset();
              services.formService.reset();
            }}
            style={{
              padding: '6px 12px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Reset
          </button>
        </div>
      )}

      {/* Main Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {selectedView === 'form' && showForm ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '0',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            {/* Form Header */}
            <div style={{
              padding: '20px 24px',
              backgroundColor: '#f8f9fa',
              borderBottom: '1px solid #e1e8ed',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: '600',
                color: '#2c3e50'
              }}>
                {editingTodo ? `Edit: ${editingTodo.title}` : 'Create New Todo'}
              </h2>
              <button
                onClick={handleFormCancel}
                style={{
                  padding: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#666',
                  borderRadius: '4px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f1f1f1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                ✕
              </button>
            </div>
            
            {/* Form Content */}
            <div style={{ padding: '24px' }}>
              <TodoForm
                editingTodo={editingTodo}
                onSubmit={handleFormSubmit}
                onCancel={handleFormCancel}
                services={services}
              />
            </div>
          </div>
        ) : (
          <TodoList
            onEditTodo={handleEditTodo}
            onSelectTodo={handleSelectTodo}
            services={{ todoService: services.todoService }}
          />
        )}
      </div>

      {/* Footer with DI Information */}
      <div style={{
        marginTop: '40px',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        textAlign: 'center',
        color: '#666',
        fontSize: '14px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ marginBottom: '12px' }}>
          <strong>🎯 TDI2 Features Demonstrated</strong>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginTop: '16px'
        }}>
          <div>
            <div style={{ fontWeight: '600', color: '#4CAF50' }}>Interface-Based DI</div>
            <div style={{ fontSize: '12px' }}>TodoServiceType, TodoFormServiceType</div>
          </div>
          <div>
            <div style={{ fontWeight: '600', color: '#2196F3' }}>AsyncState Pattern</div>
            <div style={{ fontSize: '12px' }}>Reactive state management</div>
          </div>
          <div>
            <div style={{ fontWeight: '600', color: '#FF9800' }}>IndexedDB Persistence</div>
            <div style={{ fontSize: '12px' }}>Local browser storage</div>
          </div>
          <div>
            <div style={{ fontWeight: '600', color: '#9C27B0' }}>Observable State</div>
            <div style={{ fontSize: '12px' }}>useObservableState hooks</div>
          </div>
        </div>

        {/* Service Health Status */}
        <div style={{
          marginTop: '20px',
          padding: '12px',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
            🔧 Service Health Status
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', textAlign: 'left' }}>
            <div>
              <strong>Todo Service:</strong> {todoState.isError ? '❌ Error' : todoState.isLoading ? '⏳ Loading' : '✅ Ready'}
            </div>
            <div>
              <strong>Form Service:</strong> {formState.isError ? '❌ Error' : formState.isLoading ? '⏳ Loading' : '✅ Ready'}
            </div>
            <div>
              <strong>Any Loading:</strong> {isAnyLoading ? '🔄 Yes' : '✅ No'}
            </div>
            <div>
              <strong>Has Errors:</strong> {hasAnyError ? '❌ Yes' : '✅ No'}
            </div>
            <div>
              <strong>Current View:</strong> {selectedView === 'form' ? '📝 Form' : '📋 List'}
            </div>
            <div>
              <strong>Total Todos:</strong> {stats?.total || 0}
            </div>
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #ddd' }}>
              <div><strong>Debug URLs:</strong></div>
              <div>
                <a href="http://localhost:5173/_di_debug" target="_blank" style={{ color: '#4CAF50', marginRight: '12px' }}>
                  Debug Info
                </a>
                <a href="http://localhost:5173/_di_interfaces" target="_blank" style={{ color: '#4CAF50', marginRight: '12px' }}>
                  Interface Mappings
                </a>
                <a href="http://localhost:5173/_di_configs" target="_blank" style={{ color: '#4CAF50' }}>
                  Configurations
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CSS for loading animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}