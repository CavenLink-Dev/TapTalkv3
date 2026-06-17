import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Card } from '../Card';

describe('Card', () => {
  it('renders children', () => {
    render(
      <Card>
        <Text>Hello</Text>
      </Card>,
    );
    expect(screen.getByText('Hello')).toBeTruthy();
  });

  it('forwards testID via ViewProps', () => {
    render(
      <Card testID="my-card">
        <Text>Child</Text>
      </Card>,
    );
    expect(screen.getByTestId('my-card')).toBeTruthy();
  });
});
