import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

// Define the state interface
interface CounterState {
  count: number;
  message: string;
}

// Initial state
const initialState: CounterState = {
  count: 0,
  message: "Click buttons to count!",
};

// Create slice with reducers
export const counterSlice = createSlice({
  name: "counter",
  initialState,
  reducers: {
    increment: (state) => {
      state.count += 1;
      state.message = `Count is now ${state.count}`;
    },
    decrement: (state) => {
      state.count -= 1;
      state.message = `Count is now ${state.count}`;
    },
    reset: (state) => {
      state.count = 0;
      state.message = "Reset to zero!";
    },
    setMessage: (state, action: PayloadAction<string>) => {
      state.message = action.payload;
    },
  },
});

// Export actions
export const { increment, decrement, reset, setMessage } = counterSlice.actions;

// Export reducer
export default counterSlice.reducer;
