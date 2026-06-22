// ============================================================
// Input Component — Integrated with React Hook Form
// ============================================================

import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Spacing, BorderRadius, Typography } from '../../constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  prefix?: string;
}

export default function Input({
  label,
  error,
  containerStyle,
  prefix,
  ...rest
}: InputProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      )}
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.inputBg,
            borderColor: error ? theme.danger : theme.inputBorder,
          },
        ]}
      >
        {prefix && (
          <Text style={[styles.prefix, { color: theme.textSecondary }]}>
            {prefix}
          </Text>
        )}
        <TextInput
          style={[
            styles.input,
            {
              color: theme.text,
            },
            prefix ? { paddingLeft: 0 } : undefined,
          ]}
          placeholderTextColor={theme.placeholder}
          {...rest}
        />
      </View>
      {error && (
        <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.label,
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
  },
  prefix: {
    ...Typography.body,
    marginRight: Spacing.xs,
  },
  input: {
    ...Typography.body,
    flex: 1,
    paddingVertical: Spacing.md,
    minHeight: 48,
  },
  error: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
});
