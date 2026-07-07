import { tileA11yProps, messageStripA11yProps } from '../tileA11y';

describe('tileA11yProps', () => {
  it('word tile hint uses the spoken form', () => {
    const p = tileA11yProps({ label: 'More', speech: 'i want more', kind: 'word' });
    expect(p.accessibilityHint).toBe('Adds i want more to your message');
    expect(p.accessibilityRole).toBe('button');
  });

  it('folder tile hint says opens', () => {
    const p = tileA11yProps({ label: 'Food', kind: 'folder' });
    expect(p.accessibilityHint).toBe('Opens Food folder');
  });

  it('word type surfaces as accessibilityValue', () => {
    const p = tileA11yProps({ label: 'run', kind: 'word', wordType: 'verb' });
    expect(p.accessibilityValue).toEqual({ text: 'verb' });
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
