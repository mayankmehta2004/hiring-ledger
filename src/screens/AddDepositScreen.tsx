// ============================================================
// AddDepositScreen — Add deposit/payment form
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from '../hooks/useTheme';
import { useDepositStore } from '../stores/useDepositStore';
import { useFarmerStore } from '../stores/useFarmerStore';
import { useWorkStore } from '../stores/useWorkStore';
import { depositSchema, DepositFormData } from '../utils/validators';
import { Spacing, Typography, BorderRadius } from '../constants/theme';
import { getToday } from '../utils/formatDate';
import { formatCurrency } from '../utils/formatCurrency';
import Input from '../components/ui/Input';
import DatePicker from '../components/ui/DatePicker';
import Button from '../components/ui/Button';
import SearchBar from '../components/ui/SearchBar';
import { AddDepositScreenProps } from '../navigation/types';
import { FarmerWithBalance } from '../types';

export default function AddDepositScreen({
  navigation,
  route,
}: AddDepositScreenProps) {
  const theme = useTheme();
  const preselectedFarmerId = route.params?.farmerId;
  const { addDeposit } = useDepositStore();
  const { farmers, loadFarmers, refreshCurrentFarmer } = useFarmerStore();
  const { loadDashboardData } = useWorkStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFarmerPicker, setShowFarmerPicker] = useState(!preselectedFarmerId);
  const [farmerSearch, setFarmerSearch] = useState('');
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerWithBalance | null>(
    null
  );

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DepositFormData>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      farmer_id: preselectedFarmerId || 0,
      date: getToday(),
      amount: 0,
      notes: '',
    },
  });

  useEffect(() => {
    loadFarmers();
  }, []);

  useEffect(() => {
    if (preselectedFarmerId && farmers.length > 0) {
      const farmer = farmers.find((f) => f.id === preselectedFarmerId);
      if (farmer) setSelectedFarmer(farmer);
    }
  }, [preselectedFarmerId, farmers]);

  const filteredFarmers = farmerSearch
    ? farmers.filter(
        (f) =>
          f.name.toLowerCase().includes(farmerSearch.toLowerCase()) ||
          f.village?.toLowerCase().includes(farmerSearch.toLowerCase())
      )
    : farmers;

  const selectFarmer = (farmer: FarmerWithBalance) => {
    setSelectedFarmer(farmer);
    setValue('farmer_id', farmer.id);
    setShowFarmerPicker(false);
  };

  const onSubmit = async (data: DepositFormData) => {
    setIsSubmitting(true);
    try {
      await addDeposit(data);
      await loadDashboardData();
      await refreshCurrentFarmer();
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Failed to save deposit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Farmer Selector */}
        {selectedFarmer && !showFarmerPicker ? (
          <TouchableOpacity
            onPress={() => setShowFarmerPicker(true)}
            style={[
              styles.selectedFarmer,
              {
                backgroundColor: theme.successLight,
                borderColor: theme.success,
              },
            ]}
          >
            <View>
              <Text style={[styles.selectedLabel, { color: theme.textSecondary }]}>
                Farmer
              </Text>
              <Text style={[styles.selectedName, { color: theme.success }]}>
                {selectedFarmer.name}
              </Text>
              {selectedFarmer.outstanding_balance > 0 && (
                <Text style={[styles.farmerBalance, { color: theme.danger }]}>
                  Balance: {formatCurrency(selectedFarmer.outstanding_balance)}
                </Text>
              )}
            </View>
            <Text style={[styles.changeText, { color: theme.success }]}>
              Change
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.farmerPicker}>
            <Text style={[styles.label, { color: theme.text }]}>
              Select Farmer *
            </Text>
            <SearchBar
              value={farmerSearch}
              onChangeText={setFarmerSearch}
              placeholder="Search farmer..."
              autoFocus={!preselectedFarmerId}
            />
            <View style={[styles.farmerList, { borderColor: theme.border }]}>
              {filteredFarmers.slice(0, 5).map((farmer) => (
                <TouchableOpacity
                  key={farmer.id}
                  onPress={() => selectFarmer(farmer)}
                  style={[
                    styles.farmerOption,
                    { borderBottomColor: theme.borderLight },
                  ]}
                >
                  <Text style={[styles.farmerOptionName, { color: theme.text }]}>
                    {farmer.name}
                  </Text>
                  <Text
                    style={[
                      styles.farmerOptionBalance,
                      {
                        color:
                          farmer.outstanding_balance > 0
                            ? theme.danger
                            : theme.success,
                      },
                    ]}
                  >
                    {formatCurrency(farmer.outstanding_balance)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.farmer_id && (
              <Text style={[styles.error, { color: theme.danger }]}>
                {errors.farmer_id.message}
              </Text>
            )}
          </View>
        )}

        {/* Date */}
        <Controller
          control={control}
          name="date"
          render={({ field: { onChange, value } }) => (
            <DatePicker
              label="Date *"
              value={value}
              onChange={onChange}
              error={errors.date?.message}
            />
          )}
        />

        {/* Amount */}
        <Controller
          control={control}
          name="amount"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Amount (₹) *"
              placeholder="Enter deposit amount"
              value={value ? String(value) : ''}
              onChangeText={(text) => onChange(text ? Number(text) : 0)}
              keyboardType="numeric"
              prefix="₹"
              error={errors.amount?.message}
              autoFocus={!!preselectedFarmerId}
            />
          )}
        />

        {/* Notes */}
        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Notes"
              placeholder="Optional notes (e.g. cash, UPI, cheque)"
              value={value || ''}
              onChangeText={onChange}
              multiline
              numberOfLines={2}
            />
          )}
        />

        <Button
          title="Save Deposit"
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          fullWidth
          size="lg"
          style={styles.submitButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    padding: Spacing.xl,
    paddingBottom: Spacing.huge,
  },
  selectedFarmer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    marginBottom: Spacing.lg,
  },
  selectedLabel: {
    ...Typography.caption,
    marginBottom: 2,
  },
  selectedName: {
    ...Typography.bodyMedium,
  },
  farmerBalance: {
    ...Typography.caption,
    marginTop: 2,
  },
  changeText: {
    ...Typography.bodySmMedium,
  },
  farmerPicker: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.label,
    marginBottom: Spacing.sm,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
  },
  farmerOptionName: {
    ...Typography.bodyMedium,
  },
  farmerOptionBalance: {
    ...Typography.bodySmMedium,
  },
  error: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
  submitButton: {
    marginTop: Spacing.lg,
  },
});
