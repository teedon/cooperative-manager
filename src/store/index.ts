import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import cooperativeReducer from './slices/cooperativeSlice';
import contributionReducer from './slices/contributionSlice';
import groupBuyReducer from './slices/groupBuySlice';
import loanReducer from './slices/loanSlice';
import ledgerReducer from './slices/ledgerSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cooperative: cooperativeReducer,
    contribution: contributionReducer,
    groupBuy: groupBuyReducer,
    loan: loanReducer,
    ledger: ledgerReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore paths that may contain non-serializable values
        ignoredActions: ['auth/login/fulfilled'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
