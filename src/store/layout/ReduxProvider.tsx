import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { persistor, store } from '@/store';

const ReduxProvider = ({ children }: any) => {
  return (
    <Provider store={store} stabilityCheck="never">
      <PersistGate persistor={persistor}>{children}</PersistGate>
    </Provider>
  );
};

export default ReduxProvider;
