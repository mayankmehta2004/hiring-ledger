// ============================================================
// DatePicker Component
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Spacing, BorderRadius, Typography, MIN_TOUCH_TARGET } from '../../constants/theme';
import { formatDisplayDate } from '../../utils/formatDate';

interface DatePickerProps {
  label?: string;
  value: string; // ISO date string YYYY-MM-DD
  onChange: (date: string) => void;
  error?: string;
}

export default function DatePicker({
  label,
  value,
  onChange,
  error,
}: DatePickerProps) {
  const theme = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  // Simple date selector — shows quick options
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const quickDates = [
    { label: 'Today', date: today },
    { label: 'Yesterday', date: yesterday },
  ];

  const formatISO = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      )}

      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        style={[
          styles.dateButton,
          {
            backgroundColor: theme.inputBg,
            borderColor: error ? theme.danger : theme.inputBorder,
          },
        ]}
        activeOpacity={0.7}
      >
        <Ionicons
          name="calendar-outline"
          size={20}
          color={theme.textSecondary}
        />
        <Text style={[styles.dateText, { color: theme.text }]}>
          {value ? formatDisplayDate(value) : 'Select Date'}
        </Text>
      </TouchableOpacity>

      {error && (
        <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>
      )}

      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <TouchableOpacity
          style={[styles.overlay, { backgroundColor: theme.overlay }]}
          activeOpacity={1}
          onPress={() => setShowPicker(false)}
        >
          <View
            style={[
              styles.pickerContainer,
              { backgroundColor: theme.card },
            ]}
          >
            <Text style={[styles.pickerTitle, { color: theme.text }]}>
              Select Date
            </Text>

            {/* Quick options */}
            {quickDates.map((item) => {
              const isoDate = formatISO(item.date);
              const isSelected = value === isoDate;
              return (
                <TouchableOpacity
                  key={item.label}
                  onPress={() => {
                    onChange(isoDate);
                    setShowPicker(false);
                  }}
                  style={[
                    styles.quickOption,
                    {
                      backgroundColor: isSelected
                        ? theme.primaryLight
                        : theme.surface,
                      borderColor: isSelected
                        ? theme.primary
                        : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.quickOptionText,
                      {
                        color: isSelected
                          ? theme.primary
                          : theme.text,
                      },
                    ]}
                  >
                    {item.label} — {formatDisplayDate(isoDate)}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Manual date input */}
            <Text
              style={[
                styles.manualLabel,
                { color: theme.textSecondary },
              ]}
            >
              Or enter date manually (YYYY-MM-DD):
            </Text>
            <View
              style={[
                styles.manualInput,
                {
                  backgroundColor: theme.inputBg,
                  borderColor: theme.inputBorder,
                },
              ]}
            >
              <Text style={[styles.currentDate, { color: theme.text }]}>
                {value || formatISO(today)}
              </Text>
            </View>

            {/* Last 7 days */}
            <Text
              style={[
                styles.manualLabel,
                { color: theme.textSecondary, marginTop: Spacing.lg },
              ]}
            >
              Recent dates:
            </Text>
            <View style={styles.recentDates}>
              {Array.from({ length: 7 }, (_, i) => {
                const d = new Date(today);
                d.setDate(d.getDate() - i);
                const iso = formatISO(d);
                const isSelected = value === iso;
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => {
                      onChange(iso);
                      setShowPicker(false);
                    }}
                    style={[
                      styles.recentDateChip,
                      {
                        backgroundColor: isSelected
                          ? theme.primary
                          : theme.chipBg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.recentDateText,
                        {
                          color: isSelected
                            ? '#FFFFFF'
                            : theme.chipText,
                        },
                      ]}
                    >
                      {d.getDate()}/{d.getMonth() + 1}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={() => setShowPicker(false)}
              style={[styles.closeButton, { backgroundColor: theme.primary }]}
            >
              <Text style={styles.closeButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.label,
    marginBottom: Spacing.sm,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    minHeight: MIN_TOUCH_TARGET,
    gap: Spacing.sm,
  },
  dateText: {
    ...Typography.body,
  },
  error: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    paddingBottom: Spacing.huge,
  },
  pickerTitle: {
    ...Typography.h3,
    marginBottom: Spacing.lg,
  },
  quickOption: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  quickOptionText: {
    ...Typography.bodyMedium,
  },
  manualLabel: {
    ...Typography.bodySm,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  manualInput: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  currentDate: {
    ...Typography.body,
  },
  recentDates: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  recentDateChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    minWidth: 50,
    alignItems: 'center',
  },
  recentDateText: {
    ...Typography.bodySmMedium,
  },
  closeButton: {
    marginTop: Spacing.xxl,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    ...Typography.bodyMedium,
  },
});
