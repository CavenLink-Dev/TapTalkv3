import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { PrimaryButton } from '../PrimaryButton';

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn().mockResolvedValue(undefined),
}));

describe('PrimaryButton', () => {
  const defaultProps = {
    label: 'Continue',
    onPress: jest.fn(),
    accessibilityLabel: 'Continue button',
  };

  beforeEach(() => jest.clearAllMocks());

  it('renders the label', () => {
    render(<PrimaryButton {...defaultProps} />);
    expect(screen.getByText('Continue')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    render(<PrimaryButton {...defaultProps} />);
    fireEvent.press(screen.getByRole('button'));
    expect(defaultProps.onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    render(<PrimaryButton {...defaultProps} disabled />);
    fireEvent.press(screen.getByRole('button'));
    expect(defaultProps.onPress).not.toHaveBeenCalled();
  });

  it('sets accessibilityLabel', () => {
    render(<PrimaryButton {...defaultProps} />);
    expect(screen.getByLabelText('Continue button')).toBeTruthy();
  });
});
