// ============================================================
// Button Component
// ============================================================

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { BorderRadius, Spacing, MIN_TOUCH_TARGET } from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  style,
}: ButtonProps) {
  const theme = useTheme();

  const getButtonStyle = (): ViewStyle => {
    const base: ViewStyle = {
      borderRadius: BorderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: MIN_TOUCH_TARGET,
      opacity: disabled ? 0.5 : 1,
    };

    // Size
    switch (size) {
      case 'sm':
        base.paddingHorizontal = Spacing.md;
        base.paddingVertical = Spacing.sm;
        base.minHeight = 36;
        break;
      case 'lg':
        base.paddingHorizontal = Spacing.xxl;
        base.paddingVertical = Spacing.lg;
        base.minHeight = 56;
        break;
      default:
        base.paddingHorizontal = Spacing.xl;
        base.paddingVertical = Spacing.md;
    }

    if (fullWidth) base.width = '100%';

    // Variant
    switch (variant) {
      case 'primary':
        base.backgroundColor = theme.primary;
        break;
      case 'secondary':
        base.backgroundColor = theme.primaryLight;
        break;
      case 'danger':
        base.backgroundColor = theme.dangerLight;
        break;
      case 'outline':
        base.backgroundColor = 'transparent';
        base.borderWidth = 1.5;
        base.borderColor = theme.primary;
        break;
      case 'ghost':
        base.backgroundColor = 'transparent';
        break;
    }

    return base;
  };

  const getTextStyle = (): TextStyle => {
    const base: TextStyle = {
      fontWeight: '600',
      fontSize: size === 'sm' ? 14 : size === 'lg' ? 18 : 16,
    };

    switch (variant) {
      case 'primary':
        base.color = '#FFFFFF';
        break;
      case 'secondary':
        base.color = theme.primary;
        break;
      case 'danger':
        base.color = theme.danger;
        break;
      case 'outline':
      case 'ghost':
        base.color = theme.primary;
        break;
    }

    return base;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[getButtonStyle(), style]}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#FFFFFF' : theme.primary}
          size="small"
        />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text style={[getTextStyle(), icon ? { marginLeft: Spacing.sm } : undefined]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
