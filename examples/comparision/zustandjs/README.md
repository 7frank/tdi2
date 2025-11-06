# Zustand Example

[App.tsx](./src/App.tsx)

This example demonstrates Zustand, a lightweight state management library. State and actions are defined in a global store created with the `create` function. Components access the store via the custom hook, and Zustand automatically handles subscriptions and re-renders. This approach offers a simpler API than Redux while providing global state management without requiring providers or context.
