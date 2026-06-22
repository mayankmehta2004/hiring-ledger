// ============================================================
// ConfirmDialog Component
// ============================================================

import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Spacing, BorderRadius, Typography } from '../../constants/theme';
import Button from './Button';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableOpacity
        style={[styles.overlay, { backgroundColor: theme.overlay }]}
        activeOpacity={1}
        onPress={onCancel}
      >
        <View
          style={[
            styles.dialog,
            { backgroundColor: theme.card },
          ]}
        >
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.message, { color: theme.textSecondary }]}>
            {message}
          </Text>
          <View style={styles.actions}>
            <Button
              title={cancelLabel}
              onPress={onCancel}
              variant="ghost"
              style={styles.actionButton}
            />
            <Button
              title={confirmLabel}
              onPress={onConfirm}
              variant={variant === 'danger' ? 'danger' : 'primary'}
              style={styles.actionButton}
            />
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  dialog: {
    width: '100%',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
  },
  title: {
    ...Typography.h3,
    marginBottom: Spacing.sm,
  },
  message: {
    ...Typography.body,
    marginBottom: Spacing.xxl,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  actionButton: {
    minWidth: 100,
  },
});
