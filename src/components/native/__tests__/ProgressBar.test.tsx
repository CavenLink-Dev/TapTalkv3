import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ProgressBar } from '../ProgressBar';

describe('ProgressBar', () => {
  it('renders with correct accessibility label', () => {
    render(<ProgressBar currentStep={1} />);
    expect(screen.getByLabelText('Onboarding progress, step 1')).toBeTruthy();
  });

  it('updates accessibility label with step number', () => {
    render(<ProgressBar currentStep={3} />);
    expect(screen.getByLabelText('Onboarding progress, step 3')).toBeTruthy();
  });

  it('renders two pill tracks (phase 1 and phase 2)', () => {
    const { toJSON } = render(<ProgressBar currentStep={4} />);
    const tree = toJSON();
    expect(tree).not.toBeNull();
    if (tree && !Array.isArray(tree) && tree.children) {
      expect(tree.children).toHaveLength(2);
    }
  });
});
