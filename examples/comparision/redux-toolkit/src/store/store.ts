import { configureStore } from "@reduxjs/toolkit";
import counterReducer from "./counterSlice";

// Configure the Redux store
export const store = configureStore({
  reducer: {
    counter: counterReducer,
  },
});

// Infer types from the store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
