import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { baseApi } from '../api/baseApi';
import { authReducer } from '../auth/authSlice';
import { uiReducer } from '../ui/uiSlice';

export function createAppStore() {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      ui: uiReducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });

  setupListeners(store.dispatch);

  return store;
}

export type AppStore = ReturnType<typeof createAppStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
