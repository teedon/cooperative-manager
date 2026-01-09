import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from './src/store';
import { RootNavigator } from './src/navigation';
import { AppThemeProvider } from './src/theme/ThemeProvider';
import ErrorBoundary from './src/components/common/ErrorBoundary';
import logger from './src/utils/logger';
import { initializeNotifications } from './src/services/notificationService';
import { UpdateChecker } from './src/utils/updateChecker';

export default function App() {
  useEffect(() => {
    // Initialize notification service
    initializeNotifications(store);

    // capture unhandled promise rejections
    const rejectionHandler = (e: any) => {
      logger.error('Unhandled promise rejection', e);
    };
    // @ts-ignore - global type for future-proofing
    if (typeof global?.onunhandledrejection === 'undefined') {
      // Assign a handler for older RN versions
      // @ts-ignore
      global.onunhandledrejection = rejectionHandler;
    }

    return () => {
      // cleanup if necessary
      // @ts-ignore
      if (global?.onunhandledrejection === rejectionHandler) global.onunhandledrejection = undefined;
    };
  }, []);

  return (
    <Provider store={store}>
      <AppThemeProvider>
        <SafeAreaProvider>
          <ErrorBoundary>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            <RootNavigator />
          </ErrorBoundary>
        </SafeAreaProvider>
      </AppThemeProvider>
    </Provider>
  );
}
