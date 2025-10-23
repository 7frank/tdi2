import { createContext, useContext, useState, type ReactNode } from "react";

// Define the shape of the context
interface CounterContextType {
  count: number;
  message: string;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  setMessage: (msg: string) => void;
}

// Create context with undefined default
const CounterContext = createContext<CounterContextType | undefined>(
  undefined
);

// Provider component - holds state and logic
export function CounterProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState("Click buttons to count!");

  const increment = () => {
    setCount((prev) => {
      const newCount = prev + 1;
      setMessage(`Count is now ${newCount}`);
      return newCount;
    });
  };

  const decrement = () => {
    setCount((prev) => {
      const newCount = prev - 1;
      setMessage(`Count is now ${newCount}`);
      return newCount;
    });
  };

  const reset = () => {
    setCount(0);
    setMessage("Reset to zero!");
  };

  const value = {
    count,
    message,
    increment,
    decrement,
    reset,
    setMessage,
  };

  return (
    <CounterContext.Provider value={value}>{children}</CounterContext.Provider>
  );
}

// Custom hook to use the context
export function useCounter() {
  const context = useContext(CounterContext);
  if (context === undefined) {
    throw new Error("useCounter must be used within a CounterProvider");
  }
  return context;
}
