// ============================================================
// HomeScreen — Dashboard
// ============================================================

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useWorkStore } from '../stores/useWorkStore';
import { Spacing, Typography, BorderRadius } from '../constants/theme';
import { formatCurrency } from '../utils/formatCurrency';
import { format } from 'date-fns';
import SummaryCard from '../components/SummaryCard';
import RecentActivityItem from '../components/RecentActivityItem';
import FAB from '../components/ui/FAB';
import EmptyState from '../components/ui/EmptyState';
import { HomeScreenProps } from '../navigation/types';
import { RecentActivity } from '../types';

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const theme = useTheme();
  const { dashboardSummary, recentActivity, isLoading, loadDashboardData } =
    useWorkStore();

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const today = format(new Date(), 'EEEE, dd MMM yyyy');

  const renderHeader = () => (
    <View>
      {/* Date & Search */}
      <View style={styles.topRow}>
        <View>
          <Text style={[styles.greeting, { color: theme.textSecondary }]}>
            {today}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Search')}
          style={[styles.searchIcon, { backgroundColor: theme.surface }]}
        >
          <Ionicons name="search" size={22} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Summary Cards — 2x2 grid */}
      <View style={styles.summaryGrid}>
        <View style={styles.summaryRow}>
          <SummaryCard
            icon="people"
            label="Total Farmers"
            value={String(dashboardSummary.totalFarmers)}
            color={theme.primary}
            bgColor={theme.primaryLight}
          />
          <View style={{ width: Spacing.sm }} />
          <SummaryCard
            icon="alert-circle"
            label="Outstanding"
            value={formatCurrency(dashboardSummary.outstandingBalance)}
            color={theme.danger}
            bgColor={theme.dangerLight}
          />
        </View>
        <View style={[styles.summaryRow, { marginTop: Spacing.sm }]}>
          <SummaryCard
            icon="today"
            label="Today's Work"
            value={formatCurrency(dashboardSummary.todayWork)}
            color={theme.success}
            bgColor={theme.successLight}
          />
          <View style={{ width: Spacing.sm }} />
          <SummaryCard
            icon="calendar"
            label="This Month"
            value={formatCurrency(dashboardSummary.monthWork)}
            color={theme.warning}
            bgColor={theme.warningLight}
          />
        </View>
      </View>

      {/* Recent Activity Header */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Recent Activity
      </Text>
    </View>
  );

  const renderItem = ({ item }: { item: RecentActivity }) => (
    <RecentActivityItem
      item={item}
      onPress={() =>
        navigation.navigate('FarmerProfile', { farmerId: item.farmer_id })
      }
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={recentActivity}
        renderItem={renderItem}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="No activity yet"
            subtitle="Add your first work entry to get started"
            actionLabel="Add Work"
            onAction={() => navigation.navigate('AddWork')}
          />
        }
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadDashboardData}
            tintColor={theme.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <FAB
        onPress={() => navigation.navigate('AddWork')}
        icon="add"
        label="Add Work"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  greeting: {
    ...Typography.bodySm,
  },
  searchIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryGrid: {
    marginBottom: Spacing.xxl,
  },
  summaryRow: {
    flexDirection: 'row',
  },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.md,
  },
});
