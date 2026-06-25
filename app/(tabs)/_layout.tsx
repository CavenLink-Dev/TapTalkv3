import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { BottomNavIcon, BottomNavIconName } from '../../src/components/icons/BottomNavIcon';
import { PressableTabButton } from '../../src/components/native/PressableTabButton';
import { colors } from '../../src/theme/tokens';

function icon(name: BottomNavIconName) {
  return ({ focused }: { focused: boolean }) => (
    <BottomNavIcon name={name} focused={focused} />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#4B555C',
        tabBarItemStyle: styles.tabBarItem,
        tabBarButton: (props) => <PressableTabButton {...(props as Parameters<typeof PressableTabButton>[0])} />,
      }}
    >
      <Tabs.Screen
        name="talk"
        options={{
          title: 'Board',
          tabBarIcon: icon('board'),
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: 'Activities',
          tabBarIcon: icon('activity'),
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: 'Planner',
          tabBarIcon: icon('calendar'),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: 'Profile',
          tabBarIcon: icon('profile'),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    // Tighter rhythm with the 48pt icons — was 96, felt empty above/below.
    // Bottom padding accommodates the home-indicator safe area.
    height: 78,
    paddingTop: 4,
    paddingBottom: 18,
    backgroundColor: colors.surface,
    borderTopWidth: 1.5,
    borderTopColor: colors.border,
  },
  tabBarItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
