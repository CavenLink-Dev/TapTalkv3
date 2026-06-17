import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Screen } from '../Screen';

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: View,
    SafeAreaProvider: View,
  };
});

describe('Screen', () => {
  it('renders children', () => {
    render(
      <Screen>
        <Text>Content</Text>
      </Screen>,
    );
    expect(screen.getByText('Content')).toBeTruthy();
  });

  it('renders title when provided', () => {
    render(
      <Screen title="My Title">
        <Text>Body</Text>
      </Screen>,
    );
    expect(screen.getByText('My Title')).toBeTruthy();
  });

  it('renders subtitle when provided', () => {
    render(
      <Screen title="Title" subtitle="Sub">
        <Text>Body</Text>
      </Screen>,
    );
    expect(screen.getByText('Sub')).toBeTruthy();
  });

  it('does not render title when omitted', () => {
    render(
      <Screen>
        <Text>Body</Text>
      </Screen>,
    );
    expect(screen.queryByText('My Title')).toBeNull();
  });
});
