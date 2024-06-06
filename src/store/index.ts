import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import { persistStore } from 'redux-persist';
// import storage from 'redux-persist/lib/storage';
import thunk from 'redux-thunk';

import authSlice from '@/store/slices/authSlice';
import storage from '@/store/storage';

const persistConfig = {
  key: 'root',
  storage,
  middleware: [thunk],
  // stateReconciler: autoMergeLevel2,
  whitelist: ['authState'],
};

export const rootReducer = combineReducers({
  authState: authSlice,
});

const presistedReducer = persistReducer(persistConfig, rootReducer as any);

export const store = configureStore({
  reducer: presistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;

export type AppDispatch = typeof store.dispatch;
