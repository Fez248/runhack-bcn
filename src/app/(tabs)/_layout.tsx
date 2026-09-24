import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';

import { BASE } from '@/constants/universities';
import { useGame, useTheme } from '@/context/GameContext';

export default function TabsLayout() {
  const { university } = useGame();
  const theme = useTheme();

  if (!university) return <Redirect href="/" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: BASE.textMuted,
        tabBarStyle: {
          backgroundColor: BASE.surface,
          borderTopColor: BASE.border,
          height: 64,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontWeight: '700', fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: 'Turf War',
          tabBarIcon: ({ color, size }) => <Ionicons name="map" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Ranking',
          tabBarIcon: ({ color, size }) => <Ionicons name="trophy" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
