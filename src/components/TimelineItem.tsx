// ============================================================
// TimelineItem — Work/Deposit entry in farmer timeline
// ============================================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { Spacing, BorderRadius, Typography } from '../constants/theme';
import { TimelineEntry } from '../types';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDisplayDateShort } from '../utils/formatDate';

interface TimelineItemProps {
  entry: TimelineEntry;
  onDelete?: (entry: TimelineEntry) => void;
}

export default function TimelineItem({ entry, onDelete }: TimelineItemProps) {
  const theme = useTheme();
  const isWork = entry.type === 'work';

  return (
    <View style={styles.container}>
      <View style={styles.dateCol}>
        <Text style={[styles.date, { color: theme.textSecondary }]}>
          {formatDisplayDateShort(entry.date)}
        </Text>
      </View>

      <View style={styles.indicator}>
        <View
          style={[
            styles.dot,
            {
              backgroundColor: isWork ? theme.primary : theme.success,
            },
          ]}
        />
        <View
          style={[
            styles.line,
            { backgroundColor: theme.borderLight },
          ]}
        />
      </View>

      <View
        style={[
          styles.content,
          {
            backgroundColor: isWork ? theme.workBg : theme.depositBg,
            borderColor: theme.border,
          },
        ]}
      >
        <View style={styles.contentHeader}>
          <View style={styles.contentLeft}>
            <Text
              style={[
                styles.typeLabel,
                {
                  color: isWork ? theme.primary : theme.success,
                },
              ]}
            >
              {isWork ? 'WORK' : 'DEPOSIT'}
            </Text>
            <Text
              style={[styles.description, { color: theme.text }]}
              numberOfLines={1}
            >
              {entry.description}
            </Text>
          </View>
          <View style={styles.contentRight}>
            <Text
              style={[
                styles.amount,
                {
                  color: isWork ? theme.danger : theme.success,
                  marginRight: onDelete ? Spacing.sm : 0,
                },
              ]}
            >
              {isWork ? '+' : '-'}{formatCurrency(entry.amount)}
            </Text>
            {onDelete && (
              <TouchableOpacity
                onPress={() => onDelete(entry)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="trash-outline" size={18} color={theme.danger} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        {entry.running_balance !== undefined && (
          <Text style={[styles.runningBalance, { color: theme.textTertiary }]}>
            Balance: {formatCurrency(entry.running_balance)}
          </Text>
        )}
        {entry.notes && (
          <Text
            style={[styles.notes, { color: theme.textTertiary }]}
            numberOfLines={1}
          >
            {entry.notes}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  dateCol: {
    width: 55,
    paddingTop: Spacing.md,
  },
  date: {
    ...Typography.caption,
    textAlign: 'right',
  },
  indicator: {
    width: 24,
    alignItems: 'center',
    marginHorizontal: Spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: Spacing.lg,
  },
  line: {
    flex: 1,
    width: 1.5,
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  contentLeft: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  contentRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeLabel: {
    ...Typography.captionMedium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  description: {
    ...Typography.bodySmMedium,
  },
  amount: {
    ...Typography.amount,
  },
  runningBalance: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
  notes: {
    ...Typography.caption,
    marginTop: 2,
    fontStyle: 'italic',
  },
});
