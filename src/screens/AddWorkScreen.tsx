// ============================================================
// AddWorkScreen — Add work entry form
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
import { useWorkStore } from '../stores/useWorkStore';
import { useFarmerStore } from '../stores/useFarmerStore';
import { workEntrySchema, WorkEntryFormData } from '../utils/validators';
import { UNITS } from '../constants/workTypes';
import { Spacing, Typography, BorderRadius } from '../constants/theme';
import { getToday } from '../utils/formatDate';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import DatePicker from '../components/ui/DatePicker';
import Button from '../components/ui/Button';
import SearchBar from '../components/ui/SearchBar';
import AutoSuggestInput from '../components/ui/AutoSuggestInput';
import { AddWorkScreenProps } from '../navigation/types';
import { FarmerWithBalance } from '../types';
import { addOrUpdateWorkTypeSuggestion } from '../database/workTypeSuggestions';

export default function AddWorkScreen({
  navigation,
  route,
}: AddWorkScreenProps) {
  const theme = useTheme();
  const preselectedFarmerId = route.params?.farmerId;
  const { addWorkEntry } = useWorkStore();
  const { farmers, loadFarmers } = useFarmerStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFarmerPicker, setShowFarmerPicker] = useState(!preselectedFarmerId);
  const [farmerSearch, setFarmerSearch] = useState('');
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerWithBalance | null>(
    null
  );
  const [activeSection, setActiveSection] = useState<'A' | 'B'>('A');

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    clearErrors,
    formState: { errors },
  } = useForm<WorkEntryFormData>({
    resolver: zodResolver(workEntrySchema),
    defaultValues: {
      farmer_id: preselectedFarmerId || 0,
      date: getToday(),
      work_type: '',
      quantity: undefined,
      hours: undefined,
      minutes: undefined,
      unit: 'Bigha',
      rate: undefined,
      amount: 0,
      description1: '',
      description2: '',
      khait_ka_naam: '',
      notes: '',
    },
  });

  const quantity = watch('quantity');
  const rate = watch('rate');
  const hours = watch('hours');
  const minutes = watch('minutes');
  const unit = watch('unit');

  // Auto-calculate quantity from hours & minutes if unit is Hours in Section B
  useEffect(() => {
    if (activeSection === 'B' && unit === 'Hours') {
      const h = hours || 0;
      const m = minutes || 0;
      const totalHours = h + (m / 60);
      setValue('quantity', totalHours > 0 ? Number(totalHours.toFixed(4)) : undefined);
    }
  }, [hours, minutes, unit, activeSection]);

  useEffect(() => {
    loadFarmers();
  }, []);

  // Find preselected farmer
  useEffect(() => {
    if (preselectedFarmerId && farmers.length > 0) {
      const farmer = farmers.find((f) => f.id === preselectedFarmerId);
      if (farmer) setSelectedFarmer(farmer);
    }
  }, [preselectedFarmerId, farmers]);

  // Auto-calculate amount
  useEffect(() => {
    if (quantity && rate) {
      setValue('amount', Number((quantity * rate).toFixed(2)));
    }
  }, [quantity, rate]);

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

  const onSubmit = async (data: WorkEntryFormData) => {
    setIsSubmitting(true);
    try {
      const isSecA = activeSection === 'A';
      const desc = isSecA ? data.description1?.trim() : data.description2?.trim();

      // Save suggestion
      if (desc) {
        await addOrUpdateWorkTypeSuggestion(desc);
      }

      await addWorkEntry({
        farmer_id: data.farmer_id,
        date: data.date,
        work_type: desc || 'Work',
        quantity: data.quantity,
        unit: isSecA ? 'Bigha' : data.unit || 'Hours',
        rate: data.rate,
        amount: data.amount,
        description1: isSecA ? desc : undefined,
        description2: !isSecA ? desc : undefined,
        khait_ka_naam: data.khait_ka_naam?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
      });
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Failed to save work entry. Please try again.');
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
                backgroundColor: theme.primaryLight,
                borderColor: theme.primary,
              },
            ]}
          >
            <View>
              <Text style={[styles.selectedLabel, { color: theme.textSecondary }]}>
                Farmer
              </Text>
              <Text style={[styles.selectedName, { color: theme.primary }]}>
                {selectedFarmer.name}
                {selectedFarmer.village ? ` • ${selectedFarmer.village}` : ''}
              </Text>
            </View>
            <Text style={[styles.changeText, { color: theme.primary }]}>
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
                      styles.farmerOptionVillage,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {farmer.village || ''}
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

        {/* Section Segmented Toggle */}
        <Text style={[styles.label, { color: theme.text }]}>Work Category *</Text>
        <View style={styles.sectionToggleContainer}>
          <TouchableOpacity
            style={[
              styles.sectionToggleBtn,
              {
                borderColor: activeSection === 'A' ? theme.primary : theme.border,
                backgroundColor: activeSection === 'A' ? theme.primaryLight : 'transparent',
              }
            ]}
            onPress={() => {
              setActiveSection('A');
              setValue('description1', '');
              setValue('description2', '');
              setValue('khait_ka_naam', '');
              setValue('unit', 'Bigha');
              setValue('hours', undefined);
              setValue('minutes', undefined);
              setValue('quantity', undefined);
              clearErrors();
            }}
          >
            <Text style={[styles.sectionToggleText, { color: activeSection === 'A' ? theme.primary : theme.textSecondary }]}>
              Field Work (Section A)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sectionToggleBtn,
              {
                borderColor: activeSection === 'B' ? theme.primary : theme.border,
                backgroundColor: activeSection === 'B' ? theme.primaryLight : 'transparent',
              }
            ]}
            onPress={() => {
              setActiveSection('B');
              setValue('description1', '');
              setValue('description2', '');
              setValue('khait_ka_naam', '');
              setValue('unit', 'Hours');
              setValue('hours', undefined);
              setValue('minutes', undefined);
              setValue('quantity', undefined);
              clearErrors();
            }}
          >
            <Text style={[styles.sectionToggleText, { color: activeSection === 'B' ? theme.primary : theme.textSecondary }]}>
              Tool / Hourly (Section B)
            </Text>
          </TouchableOpacity>
        </View>

        {activeSection === 'A' ? (
          <>
            {/* Description 1 — Auto-suggest input */}
            <Controller
              control={control}
              name="description1"
              render={({ field: { onChange, value } }) => (
                <AutoSuggestInput
                  label="Description 1 (Field Work) *"
                  placeholder="e.g. 1 SARSO BIJAI, CULTI..."
                  value={value || ''}
                  onChangeText={onChange}
                  error={errors.description1?.message}
                />
              )}
            />

            {/* Khait Ka Naam */}
            <Controller
              control={control}
              name="khait_ka_naam"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Khait Ka Naam / Field Name"
                  placeholder="e.g. NALAPARA, SAHIRAM VALA..."
                  value={value || ''}
                  onChangeText={onChange}
                  error={errors.khait_ka_naam?.message}
                />
              )}
            />

            {/* Quantity (Biga) */}
            <Controller
              control={control}
              name="quantity"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Biga (Quantity) *"
                  placeholder="e.g. 2.5"
                  value={value ? String(value) : ''}
                  onChangeText={(text) => onChange(text ? Number(text) : undefined)}
                  keyboardType="numeric"
                  error={errors.quantity?.message}
                />
              )}
            />

            {/* Rate (Per Biga) */}
            <Controller
              control={control}
              name="rate"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Rate (Per Biga) (₹) *"
                  placeholder="e.g. 480"
                  value={value ? String(value) : ''}
                  onChangeText={(text) => onChange(text ? Number(text) : undefined)}
                  keyboardType="numeric"
                  prefix="₹"
                  error={errors.rate?.message}
                />
              )}
            />
          </>
        ) : (
          <>
            {/* Description 2 — Auto-suggest input */}
            <Controller
              control={control}
              name="description2"
              render={({ field: { onChange, value } }) => (
                <AutoSuggestInput
                  label="Description 2 (Tool / Hourly) *"
                  placeholder="e.g. COOL, ROTAVATOR..."
                  value={value || ''}
                  onChangeText={onChange}
                  error={errors.description1?.message}
                />
              )}
            />

            {/* Khait Ka Naam */}
            <Controller
              control={control}
              name="khait_ka_naam"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Khait Ka Naam / Field Name"
                  placeholder="e.g. NALAPARA, SAHIRAM VALA..."
                  value={value || ''}
                  onChangeText={onChange}
                  error={errors.khait_ka_naam?.message}
                />
              )}
            />

            {/* Quantity & Unit */}
            <View style={styles.row}>
              <View style={styles.halfField}>
                {unit === 'Hours' ? (
                  <View style={styles.row}>
                    <View style={styles.halfField}>
                      <Controller
                        control={control}
                        name="hours"
                        render={({ field: { onChange, value } }) => (
                          <Input
                            label="Hours"
                            placeholder="e.g. 1"
                            value={value !== undefined ? String(value) : ''}
                            onChangeText={(text) => onChange(text ? Number(text) : undefined)}
                            keyboardType="numeric"
                            error={errors.hours?.message}
                          />
                        )}
                      />
                    </View>
                    <View style={styles.halfField}>
                      <Controller
                        control={control}
                        name="minutes"
                        render={({ field: { onChange, value } }) => (
                          <Input
                            label="Mins"
                            placeholder="e.g. 30"
                            value={value !== undefined ? String(value) : ''}
                            onChangeText={(text) => onChange(text ? Number(text) : undefined)}
                            keyboardType="numeric"
                            error={errors.minutes?.message}
                          />
                        )}
                      />
                    </View>
                  </View>
                ) : (
                  <Controller
                    control={control}
                    name="quantity"
                    render={({ field: { onChange, value } }) => (
                      <Input
                        label="Biga/Qty *"
                        placeholder="e.g. 1.25"
                        value={value !== undefined ? String(value) : ''}
                        onChangeText={(text) => onChange(text ? Number(text) : undefined)}
                        keyboardType="numeric"
                        error={errors.quantity?.message}
                      />
                    )}
                  />
                )}
              </View>
              <View style={styles.halfField}>
                <Controller
                  control={control}
                  name="unit"
                  render={({ field: { onChange, value } }) => (
                    <Select
                      label="Unit"
                      options={UNITS}
                      value={value || 'Hours'}
                      onChange={(val) => {
                        onChange(val);
                        // Reset hours/minutes/quantity when unit changes
                        setValue('hours', undefined);
                        setValue('minutes', undefined);
                        setValue('quantity', undefined);
                      }}
                    />
                  )}
                />
              </View>
            </View>

            {/* Rate */}
            <Controller
              control={control}
              name="rate"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Rate (Per Biga/Hours) (₹) *"
                  placeholder="e.g. 1000"
                  value={value ? String(value) : ''}
                  onChangeText={(text) => onChange(text ? Number(text) : undefined)}
                  keyboardType="numeric"
                  prefix="₹"
                  error={errors.rate?.message}
                />
              )}
            />
          </>
        )}

        {/* Amount (auto-calculated) */}
        <Controller
          control={control}
          name="amount"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Amount (₹) *"
              placeholder="Total amount"
              value={value ? String(value) : ''}
              onChangeText={(text) => onChange(text ? Number(text) : 0)}
              keyboardType="numeric"
              prefix="₹"
              error={errors.amount?.message}
            />
          )}
        />

        {/* Auto-calc hint */}
        {quantity && rate && (
          <Text style={[styles.calcHint, { color: theme.textTertiary }]}>
            {quantity} × ₹{rate} = ₹{(quantity * rate).toFixed(2)}
          </Text>
        )}

        {/* Notes */}
        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Notes"
              placeholder="Optional notes"
              value={value || ''}
              onChangeText={onChange}
              multiline
              numberOfLines={2}
            />
          )}
        />

        <Button
          title="Save Work Entry"
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
  farmerOptionVillage: {
    ...Typography.caption,
  },
  sectionToggleContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionToggleBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionToggleText: {
    ...Typography.bodySmMedium,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfField: {
    flex: 1,
  },
  calcHint: {
    ...Typography.caption,
    marginTop: -Spacing.md,
    marginBottom: Spacing.lg,
    fontStyle: 'italic',
  },
  error: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
  submitButton: {
    marginTop: Spacing.lg,
  },
});
