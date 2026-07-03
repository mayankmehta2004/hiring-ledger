// ============================================================
// DatePicker Component — Full Calendar with Month Navigation
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
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

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export default function DatePicker({
  label,
  value,
  onChange,
  error,
}: DatePickerProps) {
  const theme = useTheme();
  const [showPicker, setShowPicker] = useState(false);
  const [manualDate, setManualDate] = useState('');

  // Parse current value to initialize calendar view
  const selectedDate = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());

  const today = new Date();
  const todayISO = formatISO(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayISO = formatISO(yesterday);

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
    const days: (number | null)[] = [];

    // Empty slots for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    // Actual days
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }
    return days;
  }, [viewYear, viewMonth]);

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const selectDay = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const iso = `${viewYear}-${m}-${d}`;
    onChange(iso);
    setShowPicker(false);
  };

  const handleQuickSelect = (iso: string) => {
    onChange(iso);
    // Navigate calendar view to the selected date's month
    const d = new Date(iso);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setShowPicker(false);
  };

  const handleManualSubmit = () => {
    // Validate YYYY-MM-DD format
    const match = manualDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const y = parseInt(match[1]);
      const m = parseInt(match[2]);
      const d = parseInt(match[3]);
      if (m >= 1 && m <= 12 && d >= 1 && d <= getDaysInMonth(y, m - 1)) {
        onChange(manualDate);
        setViewYear(y);
        setViewMonth(m - 1);
        setManualDate('');
        setShowPicker(false);
        return;
      }
    }
    // If invalid, do nothing — user sees the field
  };

  const handleOpenPicker = () => {
    // Reset view to the currently selected date's month
    if (value) {
      const d = new Date(value);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    } else {
      setViewYear(today.getFullYear());
      setViewMonth(today.getMonth());
    }
    setManualDate('');
    setShowPicker(true);
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      )}

      <TouchableOpacity
        onPress={handleOpenPicker}
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
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.pickerContainer,
              { backgroundColor: theme.card },
            ]}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={[styles.pickerTitle, { color: theme.text }]}>
                Select Date
              </Text>

              {/* Quick options */}
              <View style={styles.quickRow}>
                <TouchableOpacity
                  onPress={() => handleQuickSelect(todayISO)}
                  style={[
                    styles.quickChip,
                    {
                      backgroundColor: value === todayISO ? theme.primary : theme.surface,
                      borderColor: value === todayISO ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.quickChipText,
                      { color: value === todayISO ? '#FFFFFF' : theme.text },
                    ]}
                  >
                    Today ({formatDisplayDate(todayISO)})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleQuickSelect(yesterdayISO)}
                  style={[
                    styles.quickChip,
                    {
                      backgroundColor: value === yesterdayISO ? theme.primary : theme.surface,
                      borderColor: value === yesterdayISO ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.quickChipText,
                      { color: value === yesterdayISO ? '#FFFFFF' : theme.text },
                    ]}
                  >
                    Yesterday ({formatDisplayDate(yesterdayISO)})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Month/Year navigation */}
              <View style={styles.monthNav}>
                <TouchableOpacity onPress={goToPrevMonth} style={styles.navBtn}>
                  <Ionicons name="chevron-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.monthTitle, { color: theme.text }]}>
                  {MONTHS[viewMonth]} {viewYear}
                </Text>
                <TouchableOpacity onPress={goToNextMonth} style={styles.navBtn}>
                  <Ionicons name="chevron-forward" size={22} color={theme.text} />
                </TouchableOpacity>
              </View>

              {/* Weekday headers */}
              <View style={styles.weekdayRow}>
                {WEEKDAYS.map((wd) => (
                  <Text
                    key={wd}
                    style={[styles.weekdayText, { color: theme.textTertiary }]}
                  >
                    {wd}
                  </Text>
                ))}
              </View>

              {/* Calendar grid */}
              <View style={styles.calendarGrid}>
                {calendarDays.map((day, idx) => {
                  if (day === null) {
                    return <View key={`empty-${idx}`} style={styles.dayCell} />;
                  }
                  const dayISO = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isSelected = value === dayISO;
                  const isToday = dayISO === todayISO;
                  return (
                    <TouchableOpacity
                      key={day}
                      onPress={() => selectDay(day)}
                      style={[
                        styles.dayCell,
                        isSelected && { backgroundColor: theme.primary, borderRadius: 20 },
                        !isSelected && isToday && {
                          borderWidth: 1.5,
                          borderColor: theme.primary,
                          borderRadius: 20,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          { color: isSelected ? '#FFFFFF' : theme.text },
                          isToday && !isSelected && { color: theme.primary },
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Manual date entry */}
              <Text
                style={[styles.manualLabel, { color: theme.textSecondary }]}
              >
                Or type date (YYYY-MM-DD):
              </Text>
              <View style={styles.manualRow}>
                <TextInput
                  style={[
                    styles.manualInput,
                    {
                      backgroundColor: theme.inputBg,
                      borderColor: theme.inputBorder,
                      color: theme.text,
                    },
                  ]}
                  value={manualDate}
                  onChangeText={setManualDate}
                  placeholder="e.g. 2025-06-15"
                  placeholderTextColor={theme.textTertiary}
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                  returnKeyType="done"
                  onSubmitEditing={handleManualSubmit}
                />
                <TouchableOpacity
                  onPress={handleManualSubmit}
                  style={[styles.manualGoBtn, { backgroundColor: theme.primary }]}
                >
                  <Text style={styles.manualGoBtnText}>Go</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => setShowPicker(false)}
                style={[styles.closeButton, { backgroundColor: theme.primary }]}
              >
                <Text style={styles.closeButtonText}>Done</Text>
              </TouchableOpacity>
            </ScrollView>
          </TouchableOpacity>
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
    maxHeight: '85%',
  },
  pickerTitle: {
    ...Typography.h3,
    marginBottom: Spacing.md,
  },
  // Quick select
  quickRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  quickChip: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
  },
  quickChipText: {
    ...Typography.bodySmMedium,
  },
  // Month navigation
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  navBtn: {
    padding: Spacing.sm,
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    ...Typography.bodyMedium,
    fontSize: 17,
  },
  // Weekday header row
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    ...Typography.captionMedium,
    fontSize: 12,
  },
  // Calendar grid
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    ...Typography.body,
    fontSize: 15,
  },
  // Manual entry
  manualLabel: {
    ...Typography.bodySm,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  manualRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  manualInput: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    ...Typography.body,
  },
  manualGoBtn: {
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualGoBtnText: {
    color: '#FFFFFF',
    ...Typography.bodyMedium,
  },
  // Close
  closeButton: {
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    ...Typography.bodyMedium,
  },
});
