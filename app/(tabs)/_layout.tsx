import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { colors } from '../../src/theme/tokens';

const boardIcon = require('../../assets/aac/board_icon.png');
const activitiesIcon = require('../../assets/aac/activities_icon.png');
const toolsIcon = require('../../assets/aac/tools_icon.png');
const profileIcon = require('../../assets/aac/profile_icon.png');

function TabIcon({
  source,
  focused,
}: {
  source: ReturnType<typeof require>;
  focused: boolean;
}) {
  return (
    <Image
      source={source}
      style={[styles.icon, { opacity: focused ? 1 : 0.5 }]}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
    />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 83,
          paddingBottom: 24,
          paddingTop: 4,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="talk"
        options={{
          title: 'Board',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={boardIcon} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: 'Activities',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={activitiesIcon} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: 'Tools',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={toolsIcon} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={profileIcon} focused={focused} />
          ),
        }}
      />
      {/* Hide legacy tabs from the new nav */}
      <Tabs.Screen name="today" options={{ href: null }} />
      <Tabs.Screen name="progress" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 48,
    height: 48,
  },
});
