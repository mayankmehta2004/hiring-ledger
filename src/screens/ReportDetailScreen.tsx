// ============================================================
// ReportDetailScreen — Dynamic report view + export
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { useReportStore } from '../stores/useReportStore';
import { useFarmerStore } from '../stores/useFarmerStore';
import { Spacing, Typography, BorderRadius } from '../constants/theme';
import { formatCurrency } from '../utils/formatCurrency';
import { formatMonthYear, getCurrentYear } from '../utils/formatDate';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import SearchBar from '../components/ui/SearchBar';
import { ReportDetailScreenProps } from '../navigation/types';
import { FarmerWithBalance } from '../types';

export default function ReportDetailScreen({
  navigation,
  route,
}: ReportDetailScreenProps) {
  const theme = useTheme();
  const { type, farmerId: preselectedFarmerId } = route.params;
  const { reportData, isLoading, generateReport, exportReport } =
    useReportStore();
  const { farmers, loadFarmers } = useFarmerStore();
  const [selectedFarmerId, setSelectedFarmerId] = useState<number | undefined>(
    preselectedFarmerId
  );
  const [farmerSearch, setFarmerSearch] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadFarmers();
    }, [])
  );

  useEffect(() => {
    if (type === 'farmer_ledger' && !selectedFarmerId) return;
    generateReport({
      type,
      farmerId: selectedFarmerId,
      year: getCurrentYear(),
    });
  }, [type, selectedFarmerId]);

  const handleExport = async () => {
    try {
      await exportReport({
        type,
        farmerId: selectedFarmerId,
        year: getCurrentYear(),
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to export report.');
    }
  };

  const filteredFarmers = farmerSearch
    ? farmers.filter((f) =>
        f.name.toLowerCase().includes(farmerSearch.toLowerCase())
      )
    : farmers;

  const renderFarmerSelector = () => {
    if (type !== 'farmer_ledger') return null;

    if (selectedFarmerId) {
      const farmer = farmers.find((f) => f.id === selectedFarmerId);
      return (
        <TouchableOpacity
          onPress={() => setSelectedFarmerId(undefined)}
          style={[
            styles.selectedFarmer,
            { backgroundColor: theme.primaryLight, borderColor: theme.primary },
          ]}
        >
          <Text style={[styles.selectedName, { color: theme.primary }]}>
            {farmer?.name || 'Unknown'} — Tap to change
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.farmerPicker}>
        <SearchBar
          value={farmerSearch}
          onChangeText={setFarmerSearch}
          placeholder="Search farmer for ledger..."
        />
        <View style={[styles.farmerList, { borderColor: theme.border }]}>
          {filteredFarmers.slice(0, 6).map((farmer) => (
            <TouchableOpacity
              key={farmer.id}
              onPress={() => {
                setSelectedFarmerId(farmer.id);
                setFarmerSearch('');
              }}
              style={[
                styles.farmerOption,
                { borderBottomColor: theme.borderLight },
              ]}
            >
              <Text style={[{ color: theme.text }, Typography.bodyMedium]}>
                {farmer.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderTable = () => {
    if (reportData.length === 0 && !isLoading) {
      if (type === 'farmer_ledger' && !selectedFarmerId) {
        return (
          <EmptyState
            icon="person-outline"
            title="Select a farmer"
            subtitle="Choose a farmer to view their ledger"
          />
        );
      }
      return (
        <EmptyState
          icon="document-text-outline"
          title="No data found"
          subtitle="There are no records for this report"
        />
      );
    }

    // Render based on type
    switch (type) {
      case 'farmer_ledger':
        return (
          <View>
            {/* Header */}
            <View style={[styles.tableHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.th, { color: theme.textSecondary, flex: 1 }]}>Date</Text>
              <Text style={[styles.th, { color: theme.textSecondary, flex: 1 }]}>Type</Text>
              <Text style={[styles.th, { color: theme.textSecondary, flex: 1, textAlign: 'right' }]}>Debit</Text>
              <Text style={[styles.th, { color: theme.textSecondary, flex: 1, textAlign: 'right' }]}>Credit</Text>
              <Text style={[styles.th, { color: theme.textSecondary, flex: 1, textAlign: 'right' }]}>Balance</Text>
            </View>
            {reportData.map((row: any, i: number) => (
              <View
                key={i}
                style={[styles.tableRow, { borderBottomColor: theme.borderLight }]}
              >
                <Text style={[styles.td, { color: theme.text, flex: 1 }]}>{row.date}</Text>
                <Text style={[styles.td, { color: row.type === 'Work' ? theme.primary : theme.success, flex: 1 }]}>{row.type}</Text>
                <Text style={[styles.td, { color: theme.danger, flex: 1, textAlign: 'right' }]}>{row.debit ? formatCurrency(row.debit) : ''}</Text>
                <Text style={[styles.td, { color: theme.success, flex: 1, textAlign: 'right' }]}>{row.credit ? formatCurrency(row.credit) : ''}</Text>
                <Text style={[styles.td, { color: theme.text, flex: 1, textAlign: 'right', fontWeight: '600' }]}>{formatCurrency(row.balance)}</Text>
              </View>
            ))}
          </View>
        );

      case 'outstanding':
        return (
          <View>
            <View style={[styles.tableHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.th, { color: theme.textSecondary, flex: 2 }]}>Farmer</Text>
              <Text style={[styles.th, { color: theme.textSecondary, flex: 1, textAlign: 'right' }]}>Work</Text>
              <Text style={[styles.th, { color: theme.textSecondary, flex: 1, textAlign: 'right' }]}>Paid</Text>
              <Text style={[styles.th, { color: theme.textSecondary, flex: 1, textAlign: 'right' }]}>Pending</Text>
            </View>
            {reportData.map((row: any, i: number) => (
              <View
                key={i}
                style={[styles.tableRow, { borderBottomColor: theme.borderLight }]}
              >
                <View style={{ flex: 2 }}>
                  <Text style={[styles.td, { color: theme.text }]}>{row.farmer_name}</Text>
                  <Text style={[styles.tdSub, { color: theme.textTertiary }]}>{row.village}</Text>
                </View>
                <Text style={[styles.td, { color: theme.text, flex: 1, textAlign: 'right' }]}>{formatCurrency(row.work_total)}</Text>
                <Text style={[styles.td, { color: theme.success, flex: 1, textAlign: 'right' }]}>{formatCurrency(row.deposits_total)}</Text>
                <Text style={[styles.td, { color: theme.danger, flex: 1, textAlign: 'right', fontWeight: '600' }]}>{formatCurrency(row.pending)}</Text>
              </View>
            ))}
          </View>
        );

      case 'monthly_summary':
        return (
          <View>
            <View style={[styles.tableHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.th, { color: theme.textSecondary, flex: 1 }]}>Month</Text>
              <Text style={[styles.th, { color: theme.textSecondary, flex: 1, textAlign: 'right' }]}>Work</Text>
              <Text style={[styles.th, { color: theme.textSecondary, flex: 1, textAlign: 'right' }]}>Deposits</Text>
              <Text style={[styles.th, { color: theme.textSecondary, flex: 1, textAlign: 'right' }]}>Balance</Text>
            </View>
            {reportData.map((row: any, i: number) => (
              <View
                key={i}
                style={[styles.tableRow, { borderBottomColor: theme.borderLight }]}
              >
                <Text style={[styles.td, { color: theme.text, flex: 1 }]}>{formatMonthYear(row.month)}</Text>
                <Text style={[styles.td, { color: theme.text, flex: 1, textAlign: 'right' }]}>{formatCurrency(row.work_amount)}</Text>
                <Text style={[styles.td, { color: theme.success, flex: 1, textAlign: 'right' }]}>{formatCurrency(row.deposits)}</Text>
                <Text style={[styles.td, { color: theme.danger, flex: 1, textAlign: 'right', fontWeight: '600' }]}>{formatCurrency(row.outstanding)}</Text>
              </View>
            ))}
          </View>
        );

      case 'work_type_report':
        return (
          <View>
            <View style={[styles.tableHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.th, { color: theme.textSecondary, flex: 2 }]}>Work Type</Text>
              <Text style={[styles.th, { color: theme.textSecondary, flex: 1, textAlign: 'right' }]}>Count</Text>
              <Text style={[styles.th, { color: theme.textSecondary, flex: 1, textAlign: 'right' }]}>Total</Text>
            </View>
            {reportData.map((row: any, i: number) => (
              <View
                key={i}
                style={[styles.tableRow, { borderBottomColor: theme.borderLight }]}
              >
                <Text style={[styles.td, { color: theme.text, flex: 2 }]}>{row.work_type}</Text>
                <Text style={[styles.td, { color: theme.textSecondary, flex: 1, textAlign: 'right' }]}>{row.count}</Text>
                <Text style={[styles.td, { color: theme.text, flex: 1, textAlign: 'right', fontWeight: '600' }]}>{formatCurrency(row.total_amount)}</Text>
              </View>
            ))}
          </View>
        );

      default:
        return (
          <View>
            {reportData.map((row: any, i: number) => (
              <View
                key={i}
                style={[styles.tableRow, { borderBottomColor: theme.borderLight }]}
              >
                <Text style={[styles.td, { color: theme.text, flex: 1 }]}>
                  {row.farmer_name || row.date}
                </Text>
                <Text style={[styles.td, { color: theme.text, flex: 1, textAlign: 'right' }]}>
                  {formatCurrency(row.amount)}
                </Text>
              </View>
            ))}
          </View>
        );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {renderFarmerSelector()}

        {reportData.length > 0 && (
          <Button
            title="Export to Excel"
            onPress={handleExport}
            variant="outline"
            size="md"
            icon={
              <Ionicons
                name="download-outline"
                size={18}
                color={theme.primary}
              />
            }
            fullWidth
            style={styles.exportButton}
          />
        )}

        {renderTable()}
      </ScrollView>
    </View>
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
  selectedFarmer: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    marginBottom: Spacing.lg,
  },
  selectedName: {
    ...Typography.bodyMedium,
  },
  farmerPicker: {
    marginBottom: Spacing.lg,
  },
  farmerList: {
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  farmerOption: {
    padding: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 48,
    justifyContent: 'center',
  },
  exportButton: {
    marginBottom: Spacing.xl,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    marginBottom: Spacing.xs,
  },
  th: {
    ...Typography.captionMedium,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  td: {
    ...Typography.bodySm,
  },
  tdSub: {
    ...Typography.caption,
  },
});
