import { configureStore, combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import cooperativeReducer from './slices/cooperativeSlice';
import contributionReducer from './slices/contributionSlice';
import groupBuyReducer from './slices/groupBuySlice';
import loanReducer from './slices/loanSlice';
import ledgerReducer from './slices/ledgerSlice';
import notificationReducer from './slices/notificationSlice';
import subscriptionReducer from './slices/subscriptionSlice';

// Root reducer that handles reset on logout
const appReducer = combineReducers({
  auth: authReducer,
  cooperative: cooperativeReducer,
  contribution: contributionReducer,
  groupBuy: groupBuyReducer,
  loan: loanReducer,
  ledger: ledgerReducer,
  notification: notificationReducer,
  subscription: subscriptionReducer,
});

// Custom root reducer to handle global reset
const rootReducer = (state: ReturnType<typeof appReducer> | undefined, action: any) => {
  // When logout is initiated or completed, resetAuth, forceLogout, or clearAllData is called, reset entire state
  if (
    action.type === 'auth/logout/pending' ||
    action.type === 'auth/logout/fulfilled' ||
    action.type === 'auth/resetAuth' ||
    action.type === 'auth/forceLogout' ||
    action.type === 'auth/clearAllData'
  ) {
    // Return undefined to reset to initial state for all reducers
    state = undefined;
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
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
