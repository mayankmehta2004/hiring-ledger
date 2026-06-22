// ============================================================
// Root Navigator — Tabs + Stack
// ============================================================

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { RootStackParamList, TabParamList } from './types';

// Screens
import HomeScreen from '../screens/HomeScreen';
import FarmersScreen from '../screens/FarmersScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AddFarmerScreen from '../screens/AddFarmerScreen';
import FarmerProfileScreen from '../screens/FarmerProfileScreen';
import AddWorkScreen from '../screens/AddWorkScreen';
import AddDepositScreen from '../screens/AddDepositScreen';
import SearchScreen from '../screens/SearchScreen';
import ReportDetailScreen from '../screens/ReportDetailScreen';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function TabNavigator() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Farmers':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'Reports':
              iconName = focused ? 'document-text' : 'document-text-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.tabBarInactive,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: theme.headerBg,
        },
        headerTintColor: theme.text,
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Home', headerTitle: 'Hiring Centre Ledger' }}
      />
      <Tab.Screen
        name="Farmers"
        component={FarmersScreen}
        options={{ title: 'Farmers' }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ title: 'Reports' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const theme = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.headerBg },
        headerTintColor: theme.text,
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen
        name="Tabs"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddFarmer"
        component={AddFarmerScreen}
        options={{ title: 'Add Farmer' }}
      />
      <Stack.Screen
        name="FarmerProfile"
        component={FarmerProfileScreen}
        options={{ title: 'Farmer Profile' }}
      />
      <Stack.Screen
        name="AddWork"
        component={AddWorkScreen}
        options={{ title: 'Add Work Entry' }}
      />
      <Stack.Screen
        name="AddDeposit"
        component={AddDepositScreen}
        options={{ title: 'Add Deposit' }}
      />
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{ title: 'Search', headerShown: false }}
      />
      <Stack.Screen
        name="ReportDetail"
        component={ReportDetailScreen}
        options={({ route }) => ({ title: route.params.title })}
      />
    </Stack.Navigator>
  );
}
