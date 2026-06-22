// ============================================================
// AddFarmerScreen — Create/Edit Farmer
// ============================================================

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTheme } from '../hooks/useTheme';
import { useFarmerStore } from '../stores/useFarmerStore';
import { farmerSchema, FarmerFormData } from '../utils/validators';
import { checkDuplicateFarmer } from '../database/farmers';
import { Spacing } from '../constants/theme';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { AddFarmerScreenProps } from '../navigation/types';

export default function AddFarmerScreen({ navigation }: AddFarmerScreenProps) {
  const theme = useTheme();
  const { addFarmer } = useFarmerStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FarmerFormData>({
    resolver: zodResolver(farmerSchema),
    defaultValues: {
      name: '',
      phone: '',
      village: '',
      address: '',
      notes: '',
    },
  });

  const onSubmit = async (data: FarmerFormData) => {
    setIsSubmitting(true);

    try {
      // Check for duplicates
      const duplicate = await checkDuplicateFarmer(data.name, data.phone);
      if (duplicate) {
        Alert.alert(
          'Possible Duplicate',
          `A farmer named "${duplicate.name}"${
            duplicate.village ? ` from ${duplicate.village}` : ''
          } already exists.\n\nDo you still want to create a new farmer?`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => setIsSubmitting(false) },
            {
              text: 'Create Anyway',
              onPress: async () => {
                const id = await addFarmer(data);
                navigation.goBack();
              },
            },
          ]
        );
        return;
      }

      await addFarmer(data);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Failed to create farmer. Please try again.');
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
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Farmer Name *"
              placeholder="Enter farmer name"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.name?.message}
              autoCapitalize="words"
              autoFocus
            />
          )}
        />

        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Phone Number"
              placeholder="10-digit mobile number"
              value={value || ''}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.phone?.message}
              keyboardType="phone-pad"
              maxLength={10}
            />
          )}
        />

        <Controller
          control={control}
          name="village"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Village"
              placeholder="Enter village name"
              value={value || ''}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.village?.message}
              autoCapitalize="words"
            />
          )}
        />

        <Controller
          control={control}
          name="address"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Address"
              placeholder="Enter address (optional)"
              value={value || ''}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.address?.message}
              multiline
              numberOfLines={2}
            />
          )}
        />

        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Notes"
              placeholder="Any additional notes (optional)"
              value={value || ''}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.notes?.message}
              multiline
              numberOfLines={2}
            />
          )}
        />

        <Button
          title="Save Farmer"
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
  submitButton: {
    marginTop: Spacing.lg,
  },
});
