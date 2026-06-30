import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { BottomNavIcon, BottomNavIconName } from '../../src/components/icons/BottomNavIcon';
import { PressableTabButton } from '../../src/components/native/PressableTabButton';
import { colors, typography } from '../../src/theme/tokens';

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
        tabBarShowLabel: true,
        tabBarLabelPosition: 'below-icon',
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
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
    height: 100,
    paddingTop: 10,
    paddingBottom: 22,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  tabBarItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBarLabel: {
    fontFamily: typography.fontFamily,
    fontSize: typography.tab,
    lineHeight: 12,
    marginTop: 2,
  },
});
