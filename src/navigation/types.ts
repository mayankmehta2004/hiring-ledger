// ============================================================
// Navigation Type Definitions
// ============================================================

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import { ReportType } from '../types';

// Tab Navigator
export type TabParamList = {
  Home: undefined;
  Farmers: undefined;
  Reports: undefined;
  Settings: undefined;
};

// Stack Navigator
export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList>;
  AddFarmer: { farmerId?: number } | undefined;
  FarmerProfile: { farmerId: number };
  AddWork: { farmerId?: number } | undefined;
  AddDeposit: { farmerId?: number } | undefined;
  Search: undefined;
  ReportDetail: { type: ReportType; farmerId?: number; title: string };
};

// Screen prop types
export type HomeScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

export type FarmersScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Farmers'>,
  NativeStackScreenProps<RootStackParamList>
>;

export type ReportsScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Reports'>,
  NativeStackScreenProps<RootStackParamList>
>;

export type SettingsScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Settings'>,
  NativeStackScreenProps<RootStackParamList>
>;

export type AddFarmerScreenProps = NativeStackScreenProps<RootStackParamList, 'AddFarmer'>;
export type FarmerProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'FarmerProfile'>;
export type AddWorkScreenProps = NativeStackScreenProps<RootStackParamList, 'AddWork'>;
export type AddDepositScreenProps = NativeStackScreenProps<RootStackParamList, 'AddDeposit'>;
export type SearchScreenProps = NativeStackScreenProps<RootStackParamList, 'Search'>;
export type ReportDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'ReportDetail'>;
