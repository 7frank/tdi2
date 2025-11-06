import { create } from "zustand";

// Define the store interface
interface CounterStore {
  count: number;
  message: string;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  setMessage: (msg: string) => void;
}

// Create the Zustand store
export const useCounterStore = create<CounterStore>((set) => ({
  count: 0,
  message: "Click buttons to count!",

  increment: () =>
    set((state) => {
      const newCount = state.count + 1;
      return {
        count: newCount,
        message: `Count is now ${newCount}`,
      };
    }),

  decrement: () =>
    set((state) => {
      const newCount = state.count - 1;
      return {
        count: newCount,
        message: `Count is now ${newCount}`,
      };
    }),

  reset: () =>
    set({
      count: 0,
      message: "Reset to zero!",
    }),

  setMessage: (msg: string) =>
    set({
      message: msg,
    }),
}));
