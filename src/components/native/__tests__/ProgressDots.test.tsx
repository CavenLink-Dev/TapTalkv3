import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ProgressDots } from '../ProgressDots';

describe('ProgressDots', () => {
  it('renders the correct number of dots', () => {
    const { toJSON } = render(<ProgressDots current={2} total={5} />);
    const tree = toJSON();
    expect(tree).not.toBeNull();
    if (tree && !Array.isArray(tree) && tree.children) {
      expect(tree.children).toHaveLength(5);
    }
  });

  it('sets accessibility label with current and total', () => {
    render(<ProgressDots current={2} total={4} />);
    expect(screen.getByLabelText('Onboarding progress 2 of 4')).toBeTruthy();
  });

  it('renders zero active dots when current is 0', () => {
    render(<ProgressDots current={0} total={3} />);
    expect(screen.getByLabelText('Onboarding progress 0 of 3')).toBeTruthy();
  });
});
