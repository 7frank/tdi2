# Context API Example

This example shows the idiomatic React Context API pattern for state management. State and logic are centralized in a Provider component using `useState` hooks, and child components access the shared state through a custom hook (`useCounter`). This approach provides better separation of concerns than prop drilling while remaining part of React's core API, though it still tightly couples state management to React's component lifecycle.
