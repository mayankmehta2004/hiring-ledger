// ============================================================
// FarmerCard — Farmer list item
// ============================================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { Spacing, BorderRadius, Typography } from '../constants/theme';
import { FarmerWithBalance } from '../types';
import { formatCurrency } from '../utils/formatCurrency';

interface FarmerCardProps {
  farmer: FarmerWithBalance;
  onPress: () => void;
}

export default function FarmerCard({ farmer, onPress }: FarmerCardProps) {
  const theme = useTheme();
  const hasBalance = farmer.outstanding_balance > 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
      ]}
      activeOpacity={0.7}
    >
      <View style={styles.left}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: theme.primaryLight },
          ]}
        >
          <Text style={[styles.avatarText, { color: theme.primary }]}>
            {farmer.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.info}>
          <Text
            style={[styles.name, { color: theme.text }]}
            numberOfLines={1}
          >
            {farmer.name}
          </Text>
          <View style={styles.meta}>
            {farmer.village && (
              <Text
                style={[styles.village, { color: theme.textSecondary }]}
                numberOfLines={1}
              >
                {farmer.village}
              </Text>
            )}
            {farmer.phone && (
              <Text style={[styles.phone, { color: theme.textTertiary }]}>
                {farmer.village ? ' • ' : ''}{farmer.phone}
              </Text>
            )}
          </View>
        </View>
      </View>
      <View style={styles.right}>
        <Text
          style={[
            styles.balance,
            {
              color: hasBalance ? theme.danger : theme.success,
            },
          ]}
        >
          {formatCurrency(farmer.outstanding_balance)}
        </Text>
        {hasBalance && (
          <Text style={[styles.balanceLabel, { color: theme.textTertiary }]}>
            pending
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.sm,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  name: {
    ...Typography.bodyMedium,
    marginBottom: 2,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  village: {
    ...Typography.caption,
  },
  phone: {
    ...Typography.caption,
  },
  right: {
    alignItems: 'flex-end',
  },
  balance: {
    ...Typography.amount,
  },
  balanceLabel: {
    ...Typography.caption,
    marginTop: 1,
  },
});
