import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { BottomNavIcon, BottomNavIconName } from '../../src/components/icons/BottomNavIcon';
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
          title: 'Calendar',
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
    height: 102,
    paddingTop: 12,
    paddingBottom: 21,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 2,
    borderTopColor: '#8D8D8D',
  },
  tabBarItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
