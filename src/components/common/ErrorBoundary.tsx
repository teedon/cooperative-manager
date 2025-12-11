import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import logger from '../../utils/logger';

type State = { hasError: boolean; error?: Error };

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: any) {
    logger.error('Uncaught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>An unexpected error occurred. Check logs for details.</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
});
