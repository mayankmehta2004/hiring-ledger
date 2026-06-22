// ============================================================
// SettingsScreen — Settings, Backup, DB Stats
// ============================================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../stores/useAppStore';
import {
  exportDatabaseBackup,
  exportJsonBackup,
  importDatabaseBackup,
  getDatabaseStats,
} from '../database/backup';
import { Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';
import { APP_CONFIG } from '../constants/workTypes';
import { DatabaseStats } from '../types';
import { formatDisplayDate } from '../utils/formatDate';
import { SettingsScreenProps } from '../navigation/types';

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const theme = useTheme();
  const { isDarkMode, toggleDarkMode } = useAppStore();
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const s = await getDatabaseStats();
      setStats(s);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleExportDb = async () => {
    setIsExporting(true);
    try {
      await exportDatabaseBackup();
      await loadStats();
      Alert.alert('Success', 'Database backup exported successfully.');
    } catch (err) {
      Alert.alert('Error', 'Failed to export backup.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJson = async () => {
    setIsExporting(true);
    try {
      await exportJsonBackup();
      await loadStats();
      Alert.alert('Success', 'JSON backup exported successfully.');
    } catch (err) {
      Alert.alert('Error', 'Failed to export JSON backup.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportDb = async () => {
    Alert.alert(
      'Import Database',
      'This will replace your current database with the imported file. A backup of your current data will be saved automatically.\n\nContinue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Choose File',
          onPress: async () => {
            try {
              const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
              });

              if (!result.canceled && result.assets[0]) {
                const success = await importDatabaseBackup(
                  result.assets[0].uri
                );
                if (success) {
                  Alert.alert(
                    'Success',
                    'Database imported successfully. Please restart the app.'
                  );
                } else {
                  Alert.alert('Error', 'Failed to import database.');
                }
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to import database.');
            }
          },
        },
      ]
    );
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const renderSettingRow = (
    icon: keyof typeof Ionicons.glyphMap,
    title: string,
    subtitle?: string,
    onPress?: () => void,
    rightComponent?: React.ReactNode
  ) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={[styles.settingRow, { borderBottomColor: theme.borderLight }]}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View
        style={[
          styles.settingIcon,
          { backgroundColor: theme.surface },
        ]}
      >
        <Ionicons name={icon} size={20} color={theme.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: theme.text }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightComponent || (
        onPress && (
          <Ionicons
            name="chevron-forward"
            size={18}
            color={theme.textTertiary}
          />
        )
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Appearance */}
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        APPEARANCE
      </Text>
      <View
        style={[
          styles.section,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        {renderSettingRow(
          'moon-outline',
          'Dark Mode',
          'Reduce eye strain',
          undefined,
          <Switch
            value={isDarkMode}
            onValueChange={toggleDarkMode}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor="#FFFFFF"
          />
        )}
      </View>

      {/* Backup */}
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        BACKUP & RESTORE
      </Text>
      <View
        style={[
          styles.section,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        {renderSettingRow(
          'cloud-download-outline',
          'Export Database Backup',
          'Save SQLite file for safekeeping',
          handleExportDb
        )}
        {renderSettingRow(
          'code-slash-outline',
          'Export JSON Backup',
          'Human-readable data export',
          handleExportJson
        )}
        {renderSettingRow(
          'cloud-upload-outline',
          'Import Database Backup',
          'Restore from a backup file',
          handleImportDb
        )}
        {renderSettingRow(
          'time-outline',
          'Last Backup',
          stats?.lastBackupDate
            ? formatDisplayDate(stats.lastBackupDate)
            : 'Never'
        )}
      </View>

      {isExporting && (
        <ActivityIndicator
          size="large"
          color={theme.primary}
          style={styles.loader}
        />
      )}

      {/* Database Stats */}
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        DATABASE
      </Text>
      <View
        style={[
          styles.section,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        {renderSettingRow(
          'people-outline',
          'Farmers',
          `${stats?.farmerCount || 0} records`
        )}
        {renderSettingRow(
          'construct-outline',
          'Work Entries',
          `${stats?.workEntryCount || 0} records`
        )}
        {renderSettingRow(
          'wallet-outline',
          'Deposits',
          `${stats?.depositCount || 0} records`
        )}
        {renderSettingRow(
          'list-outline',
          'Audit Logs',
          `${stats?.auditLogCount || 0} records`
        )}
        {renderSettingRow(
          'server-outline',
          'Database Size',
          stats ? formatBytes(stats.dbSizeBytes) : '-'
        )}
      </View>

      {/* About */}
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        ABOUT
      </Text>
      <View
        style={[
          styles.section,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        {renderSettingRow(
          'information-circle-outline',
          APP_CONFIG.appName,
          `Version ${APP_CONFIG.version}`
        )}
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.captionMedium,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: Spacing.xxl,
    marginBottom: Spacing.sm,
    paddingLeft: Spacing.xs,
  },
  section: {
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 56,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    ...Typography.bodyMedium,
  },
  settingSubtitle: {
    ...Typography.caption,
    marginTop: 1,
  },
  loader: {
    marginTop: Spacing.lg,
  },
  bottomPadding: {
    height: Spacing.huge,
  },
});
