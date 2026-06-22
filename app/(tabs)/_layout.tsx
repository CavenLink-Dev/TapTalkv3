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
          borderTopWidth: 1,
          height: 83,
          paddingBottom: 20,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '800',
          letterSpacing: 0.2,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="talk"
        options={{
          title: 'Talk',
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
          title: 'Today',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={toolsIcon} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: 'Me',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={profileIcon} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 28,
    height: 28,
  },
});
