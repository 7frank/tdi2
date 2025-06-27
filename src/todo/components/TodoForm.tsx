// src/todo/components/TodoForm.tsx - Form component for creating/editing todos

import React, { useState, useEffect } from 'react';
import type { Inject } from '../../di/markers';
import type { 
  TodoFormServiceType, 
  TodoServiceType,
  Todo 
} from '../interfaces/TodoInterfaces';
import { useAsyncServiceInterface } from '../../experimental-utils/observable/useObservableState';

interface TodoFormProps {
  editingTodo?: Todo | null;
  onSubmit?: (todo: Todo) => void;
  onCancel?: () => void;
  services: {
    formService: Inject<TodoFormServiceType>;
    todoService: Inject<TodoServiceType>;
  };
}

export function TodoForm(props: TodoFormProps) {
  const { editingTodo, onSubmit, onCancel, services } = props;
  
  // Use the AsyncState hooks for reactive state management
  const formState = useAsyncServiceInterface(services.formService);
  const todoState = useAsyncServiceInterface(services.todoService);
  
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load todo data when editing
  useEffect(() => {
    if (editingTodo) {
      services.formService.loadTodo(editingTodo);
    } else {
      services.formService.reset();
    }
  }, [editingTodo, services.formService]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await services.formService.submit();
      
      if (result.isValid && result.todo) {
        if (editingTodo) {
          // Update existing todo
          await services.todoService.updateTodo(editingTodo.id, result.todo);
        } else {
          // Create new todo
          await services.todoService.addTodo(result.todo);
        }

        // Reset form
        await services.formService.reset();
        
        if (onSubmit && editingTodo) {
          onSubmit(editingTodo);
        }
      }
    } catch (error) {
      console.error('Failed to submit todo:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    services.formService.reset();
    if (onCancel) {
      onCancel();
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      services.formService.addTag(newTag.trim());
      setNewTag('');
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

  const isLoading = formState.isLoading || todoState.isLoading || isSubmitting;

  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #e1e8ed',
      borderRadius: '8px',
      padding: '24px',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <h2 style={{ 
        margin: '0 0 24px 0', 
        color: '#2c3e50',
        fontSize: '24px',
        fontWeight: '600'
      }}>
        {editingTodo ? 'Edit Todo' : 'Create New Todo'}
      </h2>

      <form onSubmit={handleSubmit}>
        {/* Title Field */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '500',
            color: '#2c3e50'
          }}>
            Title *
          </label>
          <input
            type="text"
            value={formState.data?.title || ''}
            onChange={(e) => services.formService.setTitle(e.target.value)}
            placeholder="Enter todo title..."
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: formState.data?.errors?.title ? '2px solid #ff4757' : '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '16px',
              outline: 'none',
              transition: 'border-color 0.2s',
              boxSizing: 'border-box'
            }}
          />
          {formState.data?.errors?.title && (
            <div style={{ 
              color: '#ff4757', 
              fontSize: '14px', 
              marginTop: '4px' 
            }}>
              {formState.data.errors.title}
            </div>
          )}
        </div>

        {/* Description Field */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '500',
            color: '#2c3e50'
          }}>
            Description
          </label>
          <textarea
            value={formState.data?.description || ''}
            onChange={(e) => services.formService.setDescription(e.target.value)}
            placeholder="Enter description (optional)..."
            disabled={isLoading}
            rows={3}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: formState.data?.errors?.description ? '2px solid #ff4757' : '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              resize: 'vertical',
              minHeight: '80px',
              fontFamily: 'inherit',
              boxSizing: 'border-box'
            }}
          />
          {formState.data?.errors?.description && (
            <div style={{ 
              color: '#ff4757', 
              fontSize: '14px', 
              marginTop: '4px' 
            }}>
              {formState.data.errors.description}
            </div>
          )}
        </div>

        {/* Priority and Due Date Row */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '16px', 
          marginBottom: '20px' 
        }}>
          {/* Priority Field */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              color: '#2c3e50'
            }}>
              Priority
            </label>
            <select
              value={formState.data?.priority || 'medium'}
              onChange={(e) => services.formService.setPriority(e.target.value as 'low' | 'medium' | 'high')}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="low">🟢 Low</option>
              <option value="medium">🟡 Medium</option>
              <option value="high">🔴 High</option>
            </select>
          </div>

          {/* Due Date Field */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              color: '#2c3e50'
            }}>
              Due Date
            </label>
            <input
              type="date"
              value={formState.data?.dueDate || ''}
              onChange={(e) => services.formService.setDueDate(e.target.value)}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: formState.data?.errors?.dueDate ? '2px solid #ff4757' : '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {formState.data?.errors?.dueDate && (
              <div style={{ 
                color: '#ff4757', 
                fontSize: '14px', 
                marginTop: '4px' 
              }}>
                {formState.data.errors.dueDate}
              </div>
            )}
          </div>
        </div>

        {/* Tags Field */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '500',
            color: '#2c3e50'
          }}>
            Tags
          </label>
          
          {/* Existing Tags */}
          {formState.data?.tags && formState.data.tags.length > 0 && (
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '8px', 
              marginBottom: '12px' 
            }}>
              {formState.data.tags.map((tag, index) => (
                <span
                  key={index}
                  style={{
                    backgroundColor: '#e3f2fd',
                    color: '#1565c0',
                    padding: '4px 8px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => services.formService.removeTag(tag)}
                    disabled={isLoading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#1565c0',
                      cursor: 'pointer',
                      padding: '0',
                      marginLeft: '4px',
                      fontSize: '14px'
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          
          {/* Add New Tag */}
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="Type a tag and press Enter..."
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          <div style={{ 
            fontSize: '12px', 
            color: '#666', 
            marginTop: '4px' 
          }}>
            Press Enter to add a tag
          </div>
        </div>

        {/* Form Actions */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          justifyContent: 'flex-end',
          paddingTop: '20px',
          borderTop: '1px solid #e1e8ed'
        }}>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            style={{
              padding: '12px 24px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              backgroundColor: 'white',
              color: '#666',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={isLoading || !formState.data?.isValid}
            style={{
              padding: '12px 24px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: formState.data?.isValid && !isLoading ? '#4CAF50' : '#ccc',
              color: 'white',
              cursor: formState.data?.isValid && !isLoading ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
          >
            {isLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>⏳</span>
                {editingTodo ? 'Updating...' : 'Creating...'}
              </span>
            ) : (
              editingTodo ? 'Update Todo' : 'Create Todo'
            )}
          </button>
        </div>
      </form>

      {/* Form State Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          marginTop: '20px',
          padding: '12px',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          fontSize: '11px',
          fontFamily: 'monospace'
        }}>
          <div><strong>Form Valid:</strong> {formState.data?.isValid ? 'Yes' : 'No'}</div>
          <div><strong>Form Loading:</strong> {formState.isLoading ? 'Yes' : 'No'}</div>
          <div><strong>Todo Service Loading:</strong> {todoState.isLoading ? 'Yes' : 'No'}</div>
          {formState.data?.errors && Object.keys(formState.data.errors).length > 0 && (
            <div><strong>Errors:</strong> {JSON.stringify(formState.data.errors)}</div>
          )}
        </div>
      )}
    </div>
  );
}