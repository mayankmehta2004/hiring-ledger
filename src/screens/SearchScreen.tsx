// ============================================================
// SearchScreen — Global search
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useDebounce } from '../hooks/useDebounce';
import { globalSearch } from '../database/search';
import { Spacing, Typography, BorderRadius } from '../constants/theme';
import SearchBar from '../components/ui/SearchBar';
import EmptyState from '../components/ui/EmptyState';
import { SearchScreenProps } from '../navigation/types';
import { SearchResult } from '../types';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SearchScreen({ navigation }: SearchScreenProps) {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.trim()) {
      globalSearch(debouncedQuery).then(setResults);
    } else {
      setResults([]);
    }
  }, [debouncedQuery]);

  const getIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'farmer':
        return 'person-outline';
      case 'work':
        return 'construct-outline';
      case 'deposit':
        return 'wallet-outline';
      default:
        return 'document-outline';
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'farmer':
        return theme.primary;
      case 'work':
        return theme.warning;
      case 'deposit':
        return theme.success;
      default:
        return theme.textSecondary;
    }
  };

  const handlePress = (item: SearchResult) => {
    navigation.navigate('FarmerProfile', { farmerId: item.farmerId });
  };

  const renderItem = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      onPress={() => handlePress(item)}
      style={[
        styles.resultItem,
        { borderBottomColor: theme.borderLight },
      ]}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.resultIcon,
          { backgroundColor: getColor(item.type) + '18' },
        ]}
      >
        <Ionicons
          name={getIcon(item.type)}
          size={20}
          color={getColor(item.type)}
        />
      </View>
      <View style={styles.resultContent}>
        <Text style={[styles.resultTitle, { color: theme.text }]}>
          {item.title}
        </Text>
        <Text style={[styles.resultSubtitle, { color: theme.textSecondary }]}>
          {item.subtitle}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={16}
        color={theme.textTertiary}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top']}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Search farmers, work, deposits..."
            autoFocus
          />
        </View>
      </View>

      <FlatList
        data={results}
        renderItem={renderItem}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        ListEmptyComponent={
          query.trim() ? (
            <EmptyState
              icon="search-outline"
              title="No results"
              subtitle={`Nothing found for "${query}"`}
            />
          ) : (
            <EmptyState
              icon="search-outline"
              title="Search everything"
              subtitle="Find farmers, work entries, and deposits"
            />
          )
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  backButton: {
    padding: Spacing.sm,
  },
  searchContainer: {
    flex: 1,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.huge,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    ...Typography.bodySmMedium,
    marginBottom: 2,
  },
  resultSubtitle: {
    ...Typography.caption,
  },
});
