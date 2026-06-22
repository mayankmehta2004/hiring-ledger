// ============================================================
// StatBlock — Farmer profile stat display
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Spacing, Typography } from '../constants/theme';

interface StatBlockProps {
  label: string;
  value: string;
  color?: string;
}

export default function StatBlock({ label, value, color }: StatBlockProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Text
        style={[styles.value, { color: color || theme.text }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text style={[styles.label, { color: theme.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  value: {
    ...Typography.amount,
    marginBottom: 2,
  },
  label: {
    ...Typography.caption,
    textAlign: 'center',
  },
});
