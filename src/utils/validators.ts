// ============================================================
// Zod Validation Schemas
// ============================================================

import { z } from 'zod';

export const farmerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long'),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\d{10}$/.test(val.replace(/\s/g, '')),
      'Enter a valid 10-digit phone number'
    ),
  village: z.string().max(100, 'Village name is too long').optional(),
  address: z.string().max(500, 'Address is too long').optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
});

export const workEntrySchema = z.object({
  farmer_id: z.number().positive('Please select a farmer'),
  date: z.string().min(1, 'Date is required'),
  work_type: z.string().optional(),
  quantity: z.number().positive('Quantity must be positive').optional(),
  hours: z.number().min(0, 'Hours must be positive').optional(),
  minutes: z.number().min(0, 'Minutes must be positive').max(59, 'Minutes cannot exceed 59').optional(),
  unit: z.string().optional(),
  rate: z.number().min(0, 'Rate cannot be negative').optional(),
  amount: z.number().positive('Amount must be greater than 0'),
  description1: z.string().max(500, 'Description too long').optional(),
  description2: z.string().max(500, 'Description too long').optional(),
  khait_ka_naam: z.string().max(500, 'Field name too long').optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
}).refine(
  (data) => !!data.description1?.trim() || !!data.description2?.trim(),
  {
    message: 'Either Description 1 (Section A) or Description 2 (Section B) is required',
    path: ['description1'],
  }
);

export const depositSchema = z.object({
  farmer_id: z.number().positive('Please select a farmer'),
  date: z.string().min(1, 'Date is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  notes: z.string().max(1000, 'Notes too long').optional(),
});

export type FarmerFormData = z.infer<typeof farmerSchema>;
export type WorkEntryFormData = z.infer<typeof workEntrySchema>;
export type DepositFormData = z.infer<typeof depositSchema>;
