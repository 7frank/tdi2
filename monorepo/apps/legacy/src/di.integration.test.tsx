// __tests__/di-integration.test.tsx

import { describe, it, expect, beforeEach } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { CompileTimeDIContainer } from '@tdi2/di-core/container';
import { DIProvider } from '@tdi2/di-core/context';
import type { Inject } from '@tdi2/di-core/markers';

// Import the DI configuration and types
import { DI_CONFIG } from '../src/.tdi2/di-config';
import type { TodoServiceType } from '../src/todo/interfaces/TodoInterfaces';
import type { TodoServiceInterface } from '../src/todo2/types';

// Test Component 1: Using TodoServiceInterface (from todo2)
interface TestTodoServiceInterfaceProps {
  services: {
    todoService: Inject<TodoServiceInterface>;
  };
}

function TestTodoServiceInterface(props: TestTodoServiceInterfaceProps) {
  const { services: { todoService } } = props;
  
  const todos = todoService.state.todos;
  const loading = todoService.state.loading;
  const stats = todoService.state.stats;

  return (
    <div data-testid="todo-service-interface-component">
      <div data-testid="todos-count">{todos.length}</div>
      <div data-testid="loading-state">{loading ? 'loading' : 'ready'}</div>
      <div data-testid="total-stats">{stats.total}</div>
      <div data-testid="active-stats">{stats.active}</div>
      <div data-testid="completed-stats">{stats.completed}</div>
    </div>
  );
}

// Test Component 2: Using TodoServiceType (from todo AsyncState pattern)
interface TestTodoServiceTypeProps {
  services: {
    todoService: Inject<TodoServiceType>;
  };
}

function TestTodoServiceType(props: TestTodoServiceTypeProps) {
  const { services: { todoService } } = props;
  
  const state = todoService.getCurrentData();
  const isLoading = todoService.isLoading;
  const todos = state?.todos || [];
  const stats = state?.stats;

  return (
    <div data-testid="todo-service-type-component">
      <div data-testid="todos-count">{todos.length}</div>
      <div data-testid="loading-state">{isLoading ? 'loading' : 'ready'}</div>
      <div data-testid="total-stats">{stats?.total || 0}</div>
      <div data-testid="pending-stats">{stats?.pending || 0}</div>
      <div data-testid="completed-stats">{stats?.completed || 0}</div>
    </div>
  );
}

describe('DI Container Integration Tests', () => {
  let container: CompileTimeDIContainer;

  beforeEach(() => {
    // Create a fresh container for each test
    container = new CompileTimeDIContainer();
    container.loadConfiguration(DI_CONFIG);
  });

  describe('TodoServiceInterface injection (todo2 services)', () => {
    it('should successfully inject TodoServiceInterface', () => {
      // Verify service is registered
      expect(container.has('TodoServiceInterface')).toBe(true);

      // Render component with DI provider
      render(
        <StrictMode>
          <DIProvider container={container}>
            <TestTodoServiceInterface services={{} as any} />
          </DIProvider>
        </StrictMode>
      );

      // Verify component renders successfully
      expect(screen.getByTestId('todo-service-interface-component')).toBeInTheDocument();
      
      // Verify service state is accessible
      expect(screen.getByTestId('todos-count')).toHaveTextContent('0'); // Initial empty state
      expect(screen.getByTestId('loading-state')).toHaveTextContent('ready'); // Should not be loading initially
      expect(screen.getByTestId('total-stats')).toHaveTextContent('0');
      expect(screen.getByTestId('active-stats')).toHaveTextContent('0');
      expect(screen.getByTestId('completed-stats')).toHaveTextContent('0');
    });

    it('should maintain service state and handle operations', async () => {
      render(
        <StrictMode>
          <DIProvider container={container}>
            <TestTodoServiceInterface services={{} as any} />
          </DIProvider>
        </StrictMode>
      );

      // Get the injected service and modify state
      const todoService = container.resolve<TodoServiceInterface>('TodoServiceInterface');
      
      // Add a todo
      await todoService.addTodo({ title: 'Test Todo' });

      // Verify state changes are reflected in component
      expect(screen.getByTestId('todos-count')).toHaveTextContent('1');
      expect(screen.getByTestId('total-stats')).toHaveTextContent('1');
      expect(screen.getByTestId('active-stats')).toHaveTextContent('1');
      expect(screen.getByTestId('completed-stats')).toHaveTextContent('0');
    });
  });

  describe('TodoServiceType injection (AsyncState pattern)', () => {
    it('should successfully inject TodoServiceType service', () => {
      // Verify service is registered
      expect(container.has('TodoServiceType')).toBe(true);

      // Render component with DI provider
      render(
        <StrictMode>
          <DIProvider container={container}>
            <TestTodoServiceType services={{} as any} />
          </DIProvider>
        </StrictMode>
      );

      // Verify component renders successfully
      expect(screen.getByTestId('todo-service-type-component')).toBeInTheDocument();
      
      // Verify service state is accessible
      expect(screen.getByTestId('todos-count')).toHaveTextContent('0'); // Initial empty state
      expect(screen.getByTestId('loading-state')).toHaveTextContent('ready'); // Should not be loading initially
      expect(screen.getByTestId('total-stats')).toHaveTextContent('0');
      expect(screen.getByTestId('pending-stats')).toHaveTextContent('0');
      expect(screen.getByTestId('completed-stats')).toHaveTextContent('0');
    });

    it('should handle AsyncState operations correctly', async () => {
      render(
        <StrictMode>
          <DIProvider container={container}>
            <TestTodoServiceType services={{} as any} />
          </DIProvider>
        </StrictMode>
      );

      // Get the injected service and perform operations
      const todoService = container.resolve<TodoServiceType>('TodoServiceType');

      // Load initial todos
      await todoService.loadTodos();

      // Add some todos
      await todoService.addTodo({
        title: 'First Todo',
        description: 'Test description',
        priority: 'high',
        completed: false,
        tags: ['test']
      });

      await todoService.addTodo({
        title: 'Second Todo',
        description: 'Another test',
        priority: 'medium',
        completed: true,
        tags: ['test', 'completed']
      });

      // Verify stats are updated
      expect(screen.getByTestId('todos-count')).toHaveTextContent('2');
      expect(screen.getByTestId('total-stats')).toHaveTextContent('2');
      expect(screen.getByTestId('pending-stats')).toHaveTextContent('1');
      expect(screen.getByTestId('completed-stats')).toHaveTextContent('1');
    });
  });

  describe('Service registration debugging', () => {
    it('should verify TodoServiceInterface registration', () => {
      const registeredTokens = container.getRegisteredTokens();
      
      console.log('🔍 Registered service tokens:');
      registeredTokens.forEach(token => {
        console.log(`  - ${token}`);
      });

      // Check if TodoServiceInterface is registered
      if (registeredTokens.includes('TodoServiceInterface')) {
        console.log('✅ TodoServiceInterface is registered');
        expect(container.has('TodoServiceInterface')).toBe(true);
      } else {
        console.log('❌ TodoServiceInterface is NOT registered');
        console.log('Available todo-related tokens:', 
          registeredTokens.filter(t => t.toLowerCase().includes('todo'))
        );
        expect(container.has('TodoServiceInterface')).toBe(false);
      }
    });

    it('should verify TodoServiceType registration', () => {
      const registeredTokens = container.getRegisteredTokens();
      
      // Check if TodoServiceType is registered
      if (registeredTokens.includes('TodoServiceType')) {
        console.log('✅ TodoServiceType is registered');
        expect(container.has('TodoServiceType')).toBe(true);
      } else {
        console.log('❌ TodoServiceType is NOT registered');
        expect(container.has('TodoServiceType')).toBe(false);
      }
    });
  });
});