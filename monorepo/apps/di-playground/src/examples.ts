export interface Example {
  name: string;
  description: string;
  code: string;
}

export const examples: Example[] = [
  {
    name: "Counter with Service",
    description: "Counter using CounterServiceInterface",
    code: `import React from 'react';
import { Inject } from '@tdi2/di-core';
import type { CounterServiceInterface } from '/virtual/services/CounterService';

// @di-inject
function Counter({counterService}:{counterService:Inject<CounterServiceInterface>}) {

  return (
    <div>
      <h1>Count: {counterService.state.count}</h1>
      <button onClick={() => counterService.increment()}>
        Increment
      </button>
      <button onClick={() => counterService.decrement()}>
        Decrement
      </button>
    </div>
  );
}

export default Counter;`,
  },
  {
    name: "Todo List",
    description: "Todo list component with service injection",
    code: `import React from 'react';
import { Inject } from '@tdi2/di-core';
import type { TodoServiceInterface } from '/virtual/services/TodoService';

// @di-inject
function TodoList() {
  const todoService = useInject<TodoServiceInterface>();
  const [newTodo, setNewTodo] = React.useState('');

  const handleAdd = () => {
    if (newTodo.trim()) {
      todoService.addTodo(newTodo);
      setNewTodo('');
    }
  };

  return (
    <div>
      <h1>Todo List ({todoService.state.todos.length})</h1>
      <div>
        <input
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Enter todo..."
        />
        <button onClick={handleAdd}>Add</button>
      </div>
      <ul>
        {todoService.state.todos.map((todo) => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => todoService.toggleTodo(todo.id)}
            />
            <span style={{
              textDecoration: todo.completed ? 'line-through' : 'none'
            }}>
              {todo.text}
            </span>
            <button onClick={() => todoService.removeTodo(todo.id)}>
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TodoList;`,
  },
  {
    name: "User Profile",
    description: "User profile with multiple service dependencies",
    code: `import React from 'react';
import { Inject } from '@tdi2/di-core';
import type { UserServiceInterface } from '/virtual/services/UserService';
import type { AuthServiceInterface } from '/virtual/services/AuthService';

// @di-inject
function UserProfile() {
  const userService = useInject<UserServiceInterface>();
  const authService = useInject<AuthServiceInterface>();

  if (!authService.state.isAuthenticated) {
    return <div>Please log in to view your profile</div>;
  }

  return (
    <div>
      <h1>User Profile</h1>
      <div>
        <label>Name: </label>
        <span>{userService.state.user?.name}</span>
      </div>
      <div>
        <label>Email: </label>
        <span>{userService.state.user?.email}</span>
      </div>
      <button onClick={() => authService.logout()}>
        Logout
      </button>
    </div>
  );
}

export default UserProfile;`,
  },
  {
    name: "Shopping Cart",
    description: "E-commerce cart with complex state",
    code: String.raw`import React from 'react';
import { Inject } from '@tdi2/di-core';
import type { CartServiceInterface } from '/virtual/services/CartService';
import type { ProductServiceInterface } from '/virtual/services/ProductService';

// @di-inject
function ShoppingCart() {
  const cartService = useInject<CartServiceInterface>();
  const productService = useInject<ProductServiceInterface>();

  const total = cartService.state.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div>
      <h1>Shopping Cart</h1>
      <div>
        <h2>Available Products</h2>
        {productService.state.products.map((product) => (
          <div key={product.id}>
            <span>{product.name} - \${product.price}</span>
            <button onClick={() => cartService.addItem(product)}>
              Add to Cart
            </button>
          </div>
        ))}
      </div>
      <div>
        <h2>Cart Items ({cartService.state.items.length})</h2>
        {cartService.state.items.map((item) => (
          <div key={item.id}>
            <span>{item.name} x {item.quantity}</span>
            <button onClick={() => cartService.incrementQuantity(item.id)}>
              +
            </button>
            <button onClick={() => cartService.decrementQuantity(item.id)}>
              -
            </button>
            <button onClick={() => cartService.removeItem(item.id)}>
              Remove
            </button>
          </div>
        ))}
      </div>
      <div>
        <h3>Total: \${total.toFixed(2)}</h3>
        <button onClick={() => cartService.checkout()}>
          Checkout
        </button>
      </div>
    </div>
  );
}

export default ShoppingCart;`,
  },
];

export const defaultCode = examples[0].code;
