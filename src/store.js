import { configureStore } from "@reduxjs/toolkit";
import statusReducer from "../features/defiStatus";

export const store = configureStore({
  reducer: { statusMan: statusReducer },
});
