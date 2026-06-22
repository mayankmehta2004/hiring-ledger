// ============================================================
// RecentActivityItem — Home screen activity row
// ============================================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { Spacing, BorderRadius, Typography } from '../constants/theme';
import { RecentActivity } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDisplayDateShort } from '../utils/formatDate';

interface RecentActivityItemProps {
  item: RecentActivity;
  onPress: () => void;
}

export default function RecentActivityItem({
  item,
  onPress,
}: RecentActivityItemProps) {
  const theme = useTheme();
  const isWork = item.type === 'work';

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.container,
        { borderBottomColor: theme.borderLight },
      ]}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.icon,
          {
            backgroundColor: isWork ? theme.workBg : theme.depositBg,
          },
        ]}
      >
        <Ionicons
          name={isWork ? 'construct-outline' : 'wallet-outline'}
          size={18}
          color={isWork ? theme.primary : theme.success}
        />
      </View>

      <View style={styles.content}>
        <Text
          style={[styles.description, { color: theme.text }]}
          numberOfLines={1}
        >
          {item.description}
        </Text>
        <Text style={[styles.farmer, { color: theme.textSecondary }]}>
          {item.farmer_name} • {formatDisplayDateShort(item.date)}
        </Text>
      </View>

      <Text
        style={[
          styles.amount,
          { color: isWork ? theme.danger : theme.success },
        ]}
      >
        {isWork ? '' : '-'}{formatCurrency(item.amount)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  description: {
    ...Typography.bodySmMedium,
    marginBottom: 2,
  },
  farmer: {
    ...Typography.caption,
  },
  amount: {
    ...Typography.amount,
  },
});
