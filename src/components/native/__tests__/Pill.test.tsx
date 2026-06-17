import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Pill } from '../Pill';

describe('Pill', () => {
  const defaultProps = {
    label: 'Option A',
    selected: false,
    onPress: jest.fn(),
    accessibilityLabel: 'Select Option A',
  };

  beforeEach(() => jest.clearAllMocks());

  it('renders the label text', () => {
    render(<Pill {...defaultProps} />);
    expect(screen.getByText('Option A')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    render(<Pill {...defaultProps} />);
    fireEvent.press(screen.getByRole('button'));
    expect(defaultProps.onPress).toHaveBeenCalledTimes(1);
  });

  it('exposes selected accessibility state', () => {
    render(<Pill {...defaultProps} selected />);
    const btn = screen.getByRole('button');
    expect(btn.props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true }),
    );
  });
});
