import React from 'react';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';
import { colors, radii, typography } from '../../theme/tokens';

interface TextFieldProps extends TextInputProps {
  accessibilityLabel: string;
}

export function TextField(props: TextFieldProps) {
  return (
    <TextInput
      placeholderTextColor={colors.textTertiary}
      {...props}
      style={[styles.input, props.style]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 48,
    borderColor: colors.borderBlue,
    borderRadius: radii.input,
    borderWidth: 1.5,
    backgroundColor: colors.input,
    color: colors.text,
    fontSize: typography.body,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
});
