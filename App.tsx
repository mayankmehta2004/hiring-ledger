// ============================================================
// App.tsx — Root component
// ============================================================

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useDatabase } from './src/hooks/useDatabase';
import { useAppStore } from './src/stores/useAppStore';
import { Colors } from './src/constants/theme';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  const { isReady, error } = useDatabase();
  const { isDarkMode, loadSettings } = useAppStore();

  useEffect(() => {
    loadSettings();
  }, []);

  const theme = isDarkMode ? Colors.dark : Colors.light;

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.danger }]}>
          Database Error
        </Text>
        <Text style={[styles.errorDetail, { color: theme.textSecondary }]}>
          {error}
        </Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 14,
    textAlign: 'center',
  },
});
