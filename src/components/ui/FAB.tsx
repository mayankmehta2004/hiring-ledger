// ============================================================
// FAB — Floating Action Button
// ============================================================

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Shadows } from '../../constants/theme';

interface FABProps {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  label?: string;
  style?: ViewStyle;
}

export default function FAB({
  onPress,
  icon = 'add',
  label,
  style,
}: FABProps) {
  const theme = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.fab,
        { backgroundColor: theme.fab },
        Shadows.lg,
        label ? styles.extended : undefined,
        style,
      ]}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={24} color={theme.fabText} />
      {label && <Text style={styles.label}>{label}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    zIndex: 100,
  },
  extended: {
    width: 'auto',
    paddingHorizontal: 20,
    flexDirection: 'row',
    gap: 8,
  },
  label: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
});
