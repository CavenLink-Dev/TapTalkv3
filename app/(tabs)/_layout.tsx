import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { BottomNavIcon, BottomNavIconName } from '../../src/components/icons/BottomNavIcon';
import { PressableTabButton } from '../../src/components/native/PressableTabButton';
import { CHROME_SEPARATOR_WIDTH } from '../../src/theme/tokens';
import { useTheme } from '../../src/theme/useTheme';
import { useTabBarHidden } from '../../src/features/board/chromeVisibility';

function icon(name: BottomNavIconName) {
  return ({ focused }: { focused: boolean }) => (
    <BottomNavIcon name={name} focused={focused} />
  );
}

export default function TabsLayout() {
  const t = useTheme();
  // "Hide" board feature — the Talk screen can collapse the tab bar for a
  // broader, distraction-free board. Restored by tapping the peeking dock.
  const tabBarHidden = useTabBarHidden();

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
          tabBarHidden && styles.tabBarHidden,
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
  // Compact tab bar — reduced from 100 → 80pt to hand back board space
  // for the Talk grid while keeping icons vertically centred and touch
  // targets ≥ 44pt (Phase 1 Quick Win). paddingBottom sits above the
  // automatic home-indicator safe-area inset so this still reads clear
  // of the indicator on iPhones with a home bar.
  tabBar: {
    height: 80,
    paddingTop: 6,
    paddingBottom: 14,
    borderTopWidth: CHROME_SEPARATOR_WIDTH,
  },
  tabBarItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Collapsed state for the board "Hide" feature — display none removes it
  // from layout so the board gets the full height back.
  tabBarHidden: {
    display: 'none',
  },
});
