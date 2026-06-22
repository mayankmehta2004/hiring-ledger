// ============================================================
// FarmerProfileScreen — Full farmer detail with timeline
// ============================================================

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useFarmerStore } from '../stores/useFarmerStore';
import { useWorkStore } from '../stores/useWorkStore';
import { useDepositStore } from '../stores/useDepositStore';
import { getFarmerTimeline } from '../database/reports';
import { Spacing, Typography, BorderRadius } from '../constants/theme';
import { formatCurrency } from '../utils/formatCurrency';
import { TimelineEntry } from '../types';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import StatBlock from '../components/StatBlock';
import TimelineItem from '../components/TimelineItem';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { FarmerProfileScreenProps } from '../navigation/types';
import { exportFarmerLedger } from '../utils/excelExport';

export default function FarmerProfileScreen({
  navigation,
  route,
}: FarmerProfileScreenProps) {
  const theme = useTheme();
  const { farmerId } = route.params;
  const { currentFarmer, loadFarmerProfile, archiveFarmer, deleteFarmerPermanently } =
    useFarmerStore();
  const { deleteWorkEntry } = useWorkStore();
  const { deleteDeposit } = useDepositStore();
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<TimelineEntry | null>(null);
  const [showDeleteFarmerDialog, setShowDeleteFarmerDialog] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [farmerId])
  );

  const loadData = async () => {
    setIsLoading(true);
    await loadFarmerProfile(farmerId);
    const entries = await getFarmerTimeline(farmerId);
    setTimeline(entries);
    setIsLoading(false);
  };

  const handleCall = () => {
    if (currentFarmer?.phone) {
      Linking.openURL(`tel:${currentFarmer.phone}`);
    }
  };

  const handleGenerateStatement = async () => {
    try {
      await exportFarmerLedger(farmerId);
    } catch (err) {
      console.error('Failed to export ledger:', err);
    }
  };

  const handleArchive = async () => {
    setShowArchiveDialog(false);
    await archiveFarmer(farmerId);
    navigation.goBack();
  };

  const confirmDeleteEntry = async () => {
    if (!entryToDelete) return;
    try {
      if (entryToDelete.type === 'work') {
        await deleteWorkEntry(entryToDelete.id);
      } else {
        await deleteDeposit(entryToDelete.id);
      }
      setEntryToDelete(null);
      await loadData();
    } catch (err) {
      console.error('Failed to delete entry:', err);
    }
  };

  const handleDeleteFarmer = async () => {
    setShowDeleteFarmerDialog(false);
    await deleteFarmerPermanently(farmerId);
    navigation.goBack();
  };

  if (!currentFarmer) return null;

  const hasBalance = currentFarmer.outstanding_balance > 0;

  const renderHeader = () => (
    <View>
      {/* Profile Header */}
      <Card style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: theme.primaryLight },
            ]}
          >
            <Text style={[styles.avatarText, { color: theme.primary }]}>
              {currentFarmer.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: theme.text }]}>
              {currentFarmer.name}
            </Text>
            {currentFarmer.village && (
              <Text style={[styles.village, { color: theme.textSecondary }]}>
                📍 {currentFarmer.village}
              </Text>
            )}
            {currentFarmer.phone && (
              <Text
                style={[styles.phone, { color: theme.primary }]}
                onPress={handleCall}
              >
                📞 {currentFarmer.phone}
              </Text>
            )}
          </View>
        </View>

        {/* Outstanding Balance */}
        <View
          style={[
            styles.balanceContainer,
            {
              backgroundColor: hasBalance
                ? theme.dangerLight
                : theme.successLight,
            },
          ]}
        >
          <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>
            Outstanding Balance
          </Text>
          <Text
            style={[
              styles.balanceAmount,
              { color: hasBalance ? theme.danger : theme.success },
            ]}
          >
            {formatCurrency(currentFarmer.outstanding_balance)}
          </Text>
        </View>
      </Card>

      {/* Stats */}
      <Card style={styles.statsCard}>
        <View style={styles.statsRow}>
          <StatBlock
            label="Total Work"
            value={formatCurrency(currentFarmer.total_work)}
            color={theme.primary}
          />
          <StatBlock
            label="Total Deposits"
            value={formatCurrency(currentFarmer.total_deposits)}
            color={theme.success}
          />
        </View>
        <View style={[styles.statsRow, { marginTop: Spacing.lg }]}>
          <StatBlock
            label="Work Count"
            value={String(currentFarmer.work_count)}
          />
          <StatBlock
            label="Deposit Count"
            value={String(currentFarmer.deposit_count)}
          />
        </View>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button
          title="Add Work"
          onPress={() =>
            navigation.navigate('AddWork', { farmerId })
          }
          variant="primary"
          size="md"
          icon={
            <Ionicons name="construct-outline" size={18} color="#FFF" />
          }
          style={styles.actionBtn}
        />
        <Button
          title="Add Deposit"
          onPress={() =>
            navigation.navigate('AddDeposit', { farmerId })
          }
          variant="secondary"
          size="md"
          icon={
            <Ionicons
              name="wallet-outline"
              size={18}
              color={theme.primary}
            />
          }
          style={styles.actionBtn}
        />
      </View>

      <View style={styles.secondaryActions}>
        <Button
          title="Generate Statement"
          onPress={handleGenerateStatement}
          variant="outline"
          size="sm"
          icon={
            <Ionicons
              name="document-text-outline"
              size={16}
              color={theme.primary}
            />
          }
          fullWidth
        />
        <Button
          title="Archive Farmer"
          onPress={() => setShowArchiveDialog(true)}
          variant="ghost"
          size="sm"
          style={{ marginTop: Spacing.sm }}
        />
        <Button
          title="Delete Farmer Permanently"
          onPress={() => setShowDeleteFarmerDialog(true)}
          variant="danger"
          size="sm"
          style={{ marginTop: Spacing.sm }}
        />
      </View>

      {/* Timeline Header */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Timeline
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={timeline}
        renderItem={({ item }) => (
          <TimelineItem entry={item} onDelete={(entry) => setEntryToDelete(entry)} />
        )}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            icon="time-outline"
            title="No transactions yet"
            subtitle="Add work or deposits to see the timeline"
          />
        }
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadData}
            tintColor={theme.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <ConfirmDialog
        visible={showArchiveDialog}
        title="Archive Farmer"
        message={`Are you sure you want to archive "${currentFarmer.name}"? This farmer will be hidden from active lists but data will be preserved.`}
        confirmLabel="Archive"
        variant="danger"
        onConfirm={handleArchive}
        onCancel={() => setShowArchiveDialog(false)}
      />

      <ConfirmDialog
        visible={entryToDelete !== null}
        title={entryToDelete?.type === 'work' ? 'Delete Work Entry' : 'Delete Deposit'}
        message={`Are you sure you want to permanently delete this ${entryToDelete?.type === 'work' ? 'work entry' : 'deposit'}? This action is irreversible.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDeleteEntry}
        onCancel={() => setEntryToDelete(null)}
      />

      <ConfirmDialog
        visible={showDeleteFarmerDialog}
        title="Delete Farmer Permanently"
        message={`Are you sure you want to PERMANENTLY delete "${currentFarmer.name}" and all associated work entries and deposits? This action is IRREVERSIBLE and cannot be undone.`}
        confirmLabel="Delete Permanently"
        variant="danger"
        onConfirm={handleDeleteFarmer}
        onCancel={() => setShowDeleteFarmerDialog(false)}
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
    paddingBottom: Spacing.huge,
  },
  profileCard: {
    marginBottom: Spacing.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    ...Typography.h3,
    marginBottom: 4,
  },
  village: {
    ...Typography.bodySm,
    marginBottom: 2,
  },
  phone: {
    ...Typography.bodySm,
  },
  balanceContainer: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  balanceLabel: {
    ...Typography.caption,
    marginBottom: 4,
  },
  balanceAmount: {
    ...Typography.amountLarge,
  },
  statsCard: {
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
  },
  secondaryActions: {
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.md,
  },
});
