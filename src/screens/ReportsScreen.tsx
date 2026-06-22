// ============================================================
// ReportsScreen — Report type selection
// ============================================================

import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';
import { ReportsScreenProps } from '../navigation/types';
import { ReportType } from '../types';

interface ReportOption {
  type: ReportType;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export default function ReportsScreen({ navigation }: ReportsScreenProps) {
  const theme = useTheme();

  const reportOptions: ReportOption[] = [
    {
      type: 'farmer_ledger',
      title: 'Farmer Ledger',
      subtitle: 'Complete ledger for a single farmer',
      icon: 'person-outline',
      color: theme.primary,
    },
    {
      type: 'all_farmers',
      title: 'All Farmers Report',
      subtitle: 'All transactions across farmers',
      icon: 'people-outline',
      color: theme.success,
    },
    {
      type: 'outstanding',
      title: 'Outstanding Balances',
      subtitle: 'Farmers with pending payments',
      icon: 'alert-circle-outline',
      color: theme.danger,
    },
    {
      type: 'monthly_summary',
      title: 'Monthly Summary',
      subtitle: 'Month-wise business overview',
      icon: 'calendar-outline',
      color: theme.warning,
    },
    {
      type: 'work_type_report',
      title: 'Work Type Report',
      subtitle: 'Breakdown by work type',
      icon: 'construct-outline',
      color: theme.primary,
    },
    {
      type: 'date_range',
      title: 'Custom Date Range',
      subtitle: 'Filter all data by date range',
      icon: 'funnel-outline',
      color: theme.textSecondary,
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Generate reports and export to Excel
      </Text>

      {reportOptions.map((option) => (
        <TouchableOpacity
          key={option.type}
          onPress={() =>
            navigation.navigate('ReportDetail', {
              type: option.type,
              title: option.title,
            })
          }
          style={[
            styles.card,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: option.color + '18' },
            ]}
          >
            <Ionicons name={option.icon} size={24} color={option.color} />
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              {option.title}
            </Text>
            <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
              {option.subtitle}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.textTertiary}
          />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.huge,
  },
  subtitle: {
    ...Typography.bodySm,
    marginBottom: Spacing.xl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    ...Typography.bodyMedium,
    marginBottom: 2,
  },
  cardSubtitle: {
    ...Typography.caption,
  },
});
