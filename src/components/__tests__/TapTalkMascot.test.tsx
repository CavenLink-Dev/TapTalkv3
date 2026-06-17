import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { TapTalkMascot } from '../TapTalkMascot';

describe('TapTalkMascot', () => {
  it('renders with correct accessibility label for head variant', () => {
    render(<TapTalkMascot variant="head" />);
    expect(screen.getByLabelText('TapTalk head mascot')).toBeTruthy();
  });

  it('renders with correct accessibility label for business variant', () => {
    render(<TapTalkMascot variant="business" />);
    expect(screen.getByLabelText('TapTalk business mascot')).toBeTruthy();
  });

  it('renders accessory symbol for business variant', () => {
    render(<TapTalkMascot variant="business" />);
    expect(screen.getByText('✦')).toBeTruthy();
  });

  it('renders accessory symbol for astronaut variant', () => {
    render(<TapTalkMascot variant="astronaut" />);
    expect(screen.getByText('★')).toBeTruthy();
  });

  it('does not render accessory for head variant', () => {
    render(<TapTalkMascot variant="head" />);
    expect(screen.queryByText('✦')).toBeNull();
    expect(screen.queryByText('★')).toBeNull();
  });
});
