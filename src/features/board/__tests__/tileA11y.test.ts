import { tileA11yProps, messageStripA11yProps } from '../tileA11y';

describe('tileA11yProps', () => {
  it('word tile hint uses the spoken form', () => {
    const p = tileA11yProps({ label: 'More', speech: 'i want more', kind: 'word' });
    expect(p.accessibilityHint).toBe('Double tap to add i want more to your message');
    expect(p.accessibilityRole).toBe('button');
  });

  it('word tile hint says when activation speaks immediately', () => {
    const p = tileA11yProps(
      { label: 'More', speech: 'i want more', kind: 'word' },
      { speaksOnPress: true },
    );
    expect(p.accessibilityHint).toBe('Double tap to add and speak i want more');
  });

  it('folder tile hint says opens', () => {
    const p = tileA11yProps({ label: 'Food', kind: 'folder' });
    expect(p.accessibilityHint).toBe('Double tap to open the Food board');
  });

  it('word type surfaces as accessibilityValue', () => {
    const p = tileA11yProps({ label: 'run', kind: 'word', wordType: 'verb' });
    expect(p.accessibilityValue).toEqual({ text: 'verb' });
  });

  it('select mode reports selected state without changing the label', () => {
    const p = tileA11yProps(
      { label: 'More', kind: 'word' },
      { mode: 'select', isSelected: true },
    );
    expect(p.accessibilityLabel).toBe('More');
    expect(p.accessibilityState).toEqual({ selected: true });
    expect(p.accessibilityHint).toBe('Double tap to remove this tile from the selection');
  });

  it('move mode disables non-folder destinations', () => {
    const p = tileA11yProps({ label: 'More', kind: 'word' }, { mode: 'move' });
    expect(p.accessibilityState).toEqual({ disabled: true });
    expect(p.accessibilityHint).toBe('Only folders can be move destinations');
  });

  it('layout mode only exposes edit actions that are available', () => {
    const p = tileA11yProps(
      { label: 'More', kind: 'word' },
      { mode: 'layout', canReorder: true, canRemove: true },
    );
    expect(p.accessibilityActions).toEqual([
      { name: 'increment', label: 'Move tile forward' },
      { name: 'decrement', label: 'Move tile back' },
      { name: 'remove', label: 'Remove tile' },
    ]);
  });
});

describe('messageStripA11yProps', () => {
  it('reports empty when no words', () => {
    expect(messageStripA11yProps([]).accessibilityLabel).toBe('Message empty');
  });
  it('joins words into a live-region sentence', () => {
    const p = messageStripA11yProps(['i', 'want', 'more']);
    expect(p.accessibilityLabel).toBe('Message: i want more');
    expect(p.accessibilityLiveRegion).toBe('polite');
  });
});
