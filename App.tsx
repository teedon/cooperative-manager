import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from './src/store';
import { RootNavigator } from './src/navigation';

export default function App() {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <StatusBar style="auto" />
        <RootNavigator />
      </Provider>
    </SafeAreaProvider>
  );
}
