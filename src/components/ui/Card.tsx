// ============================================================
// Card Component
// ============================================================

import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { BorderRadius, Spacing, Shadows } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  noPadding?: boolean;
}

export default function Card({ children, onPress, style, noPadding }: CardProps) {
  const theme = useTheme();

  const cardStyle: ViewStyle = {
    backgroundColor: theme.card,
    borderRadius: BorderRadius.lg,
    padding: noPadding ? 0 : Spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
    ...Shadows.sm,
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={[cardStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
}
