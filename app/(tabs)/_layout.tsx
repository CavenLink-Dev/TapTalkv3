import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { BottomNavIcon, BottomNavIconName } from '../../src/components/icons/BottomNavIcon';
import { PressableTabButton } from '../../src/components/native/PressableTabButton';
import { useTheme } from '../../src/theme/useTheme';

function icon(name: BottomNavIconName) {
  return ({ focused }: { focused: boolean }) => (
    <BottomNavIcon name={name} focused={focused} />
  );
}

export default function TabsLayout() {
  const t = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: t.colors.surface,
            borderTopColor: t.colors.border,
          },
        ],
        tabBarActiveTintColor: t.colors.primary,
        tabBarInactiveTintColor: t.colors.textMuted,
        tabBarItemStyle: styles.tabBarItem,
        tabBarButton: (props) => <PressableTabButton {...(props as Parameters<typeof PressableTabButton>[0])} />,
      }}
    >
      <Tabs.Screen
        name="talk"
        options={{
          title: 'Talk',
          tabBarAccessibilityLabel: 'Talk tab',
          tabBarIcon: icon('board'),
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: 'Activities',
          tabBarAccessibilityLabel: 'Activities tab',
          tabBarIcon: icon('activity'),
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: 'Tools',
          tabBarAccessibilityLabel: 'Tools tab',
          tabBarIcon: icon('tools'),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: 'Me',
          tabBarAccessibilityLabel: 'Me tab',
          tabBarIcon: icon('profile'),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  // Taller bar gives the bigger icons room to breathe + a more forgiving
  // tap zone for users with motor differences.
  tabBar: {
    height: 82,
    paddingTop: 12,
    paddingBottom: 22,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabBarItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
