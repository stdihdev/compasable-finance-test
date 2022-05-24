import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  value: "none",
};

export const defiStatus = createSlice({
  name: "counter",
  initialState,
  reducers: {
    connectAccount: (state) => {
      // Redux Toolkit allows us to write "mutating" logic in reducers. It
      // doesn't actually mutate the state because it uses the Immer library,
      // which detects changes to a "draft state" and produces a brand new
      // immutable state based off those changes
      state.value = "account";
    },
    disconnectAccount: (state) => {
      // Redux Toolkit allows us to write "mutating" logic in reducers. It
      // doesn't actually mutate the state because it uses the Immer library,
      // which detects changes to a "draft state" and produces a brand new
      // immutable state based off those changes
      state.value = "none";
    },

    confirming: (state) => {
      state.value = "confirming";
    },

    pendingStarted: (state) => {
      state.value = "pending";
    },
    pendingFinished: (state, action) => {
      state.value = "transaction";
    },
  },
});

// Action creators are generated for each case reducer function
export const {
  connectAccount,
  disconnectAccount,
  pendingStarted,
  pendingFinished,
  confirming,
} = defiStatus.actions;

export default defiStatus.reducer;
