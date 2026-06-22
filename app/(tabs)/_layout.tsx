import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../src/theme/tokens';

type MciName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

function TabIcon({
  name,
  focused,
  size = 28,
}: {
  name: MciName;
  focused: boolean;
  size?: number;
}) {
  return (
    <MaterialCommunityIcons
      name={name}
      size={size}
      color={focused ? colors.primary : colors.textMuted}
    />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 76,
          paddingTop: 10,
          paddingBottom: 22,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
        },
      }}
    >
      <Tabs.Screen
        name="talk"
        options={{
          title: 'Talk',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="account-voice" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: 'Activity',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="lightbulb-on" focused={focused} size={26} />
          ),
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="cog" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="account" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
