// ============================================================
// FarmersScreen — Farmer list with search & filters
// ============================================================

import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { useFarmerStore } from '../stores/useFarmerStore';
import { useDebounce } from '../hooks/useDebounce';
import { Spacing, Typography, BorderRadius } from '../constants/theme';
import SearchBar from '../components/ui/SearchBar';
import FarmerCard from '../components/FarmerCard';
import FAB from '../components/ui/FAB';
import EmptyState from '../components/ui/EmptyState';
import { FarmersScreenProps } from '../navigation/types';
import { FarmerSortBy, FarmerWithBalance } from '../types';

const SORT_OPTIONS: { label: string; value: FarmerSortBy }[] = [
  { label: 'A-Z', value: 'name' },
  { label: 'Village', value: 'village' },
  { label: 'Balance', value: 'balance' },
  { label: 'Newest', value: 'newest' },
];

export default function FarmersScreen({ navigation }: FarmersScreenProps) {
  const theme = useTheme();
  const {
    farmers,
    isLoading,
    filters,
    loadFarmers,
    loadVillages,
    setFilters,
  } = useFarmerStore();

  const [searchText, setSearchText] = useState('');
  const debouncedSearch = useDebounce(searchText, 300);

  useFocusEffect(
    useCallback(() => {
      loadFarmers();
      loadVillages();
    }, [])
  );

  // React to debounced search
  React.useEffect(() => {
    setFilters({ ...filters, search: debouncedSearch || undefined });
  }, [debouncedSearch]);

  const handleSortChange = (sortBy: FarmerSortBy) => {
    setFilters({ ...filters, sortBy });
  };

  const togglePendingFilter = () => {
    setFilters({
      ...filters,
      hasPendingBalance: !filters.hasPendingBalance,
    });
  };

  const renderItem = ({ item }: { item: FarmerWithBalance }) => (
    <FarmerCard
      farmer={item}
      onPress={() =>
        navigation.navigate('FarmerProfile', { farmerId: item.id })
      }
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <SearchBar
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search farmers..."
        />

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={styles.filterContent}
        >
          {/* Pending Balance Toggle */}
          <TouchableOpacity
            onPress={togglePendingFilter}
            style={[
              styles.filterChip,
              {
                backgroundColor: filters.hasPendingBalance
                  ? theme.dangerLight
                  : theme.chipBg,
                borderColor: filters.hasPendingBalance
                  ? theme.danger
                  : theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                {
                  color: filters.hasPendingBalance
                    ? theme.danger
                    : theme.chipText,
                },
              ]}
            >
              Pending ₹
            </Text>
          </TouchableOpacity>

          {/* Sort Options */}
          {SORT_OPTIONS.map((option) => {
            const isActive = filters.sortBy === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => handleSortChange(option.value)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive
                      ? theme.chipActiveBg
                      : theme.chipBg,
                    borderColor: isActive
                      ? theme.chipActiveBg
                      : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: isActive
                        ? theme.chipActiveText
                        : theme.chipText,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={farmers}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title={searchText ? 'No farmers found' : 'No farmers yet'}
            subtitle={
              searchText
                ? 'Try a different search term'
                : 'Add your first farmer to get started'
            }
            actionLabel={searchText ? undefined : 'Add Farmer'}
            onAction={
              searchText
                ? undefined
                : () => navigation.navigate('AddFarmer')
            }
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => loadFarmers()}
            tintColor={theme.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <FAB
        onPress={() => navigation.navigate('AddFarmer')}
        icon="person-add"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  filterRow: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  filterContent: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterChipText: {
    ...Typography.captionMedium,
  },
  list: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
});
