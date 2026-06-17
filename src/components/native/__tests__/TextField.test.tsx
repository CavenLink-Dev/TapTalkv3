import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { TextField } from '../TextField';

describe('TextField', () => {
  it('renders with placeholder', () => {
    render(
      <TextField
        accessibilityLabel="Name input"
        placeholder="Enter name"
      />,
    );
    expect(screen.getByPlaceholderText('Enter name')).toBeTruthy();
  });

  it('calls onChangeText', () => {
    const onChange = jest.fn();
    render(
      <TextField
        accessibilityLabel="Name input"
        onChangeText={onChange}
      />,
    );
    fireEvent.changeText(screen.getByLabelText('Name input'), 'Sam');
    expect(onChange).toHaveBeenCalledWith('Sam');
  });
});
