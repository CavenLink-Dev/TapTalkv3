import { colors, radii, spacing, typography, shadows } from '../tokens';

describe('theme tokens', () => {
  describe('colors', () => {
    it('primary is a hex color string', () => {
      expect(colors.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it('contains all required keys', () => {
      const expected = [
        'background', 'surface', 'navBackground', 'primary', 'primaryDark',
        'primaryPressed', 'softBlue', 'mascot', 'mascotOutline', 'mascotWhite',
        'text', 'textMuted', 'textTertiary', 'textOnDark', 'inputBg',
        'inputBgWhite', 'input', 'progressFill', 'progressTrack', 'border',
        'symbolOutline', 'borderBlue', 'danger', 'success', 'warning', 'disabled',
        'folderBg', 'folderFlap', 'folderFlapSecondary',
      ];
      for (const key of expected) {
        expect(colors).toHaveProperty(key);
      }
    });

    it('all values are valid color strings', () => {
      for (const value of Object.values(colors)) {
        expect(value).toMatch(/^(#[0-9a-fA-F]{6}|rgba?\(.+\))$/);
      }
    });
  });

  describe('radii', () => {
    it('all values are positive numbers', () => {
      for (const value of Object.values(radii)) {
        expect(typeof value).toBe('number');
        expect(value).toBeGreaterThan(0);
      }
    });

    it('contains button, input, card, pill, sheet', () => {
      expect(radii).toHaveProperty('button');
      expect(radii).toHaveProperty('input');
      expect(radii).toHaveProperty('card');
      expect(radii).toHaveProperty('pill');
      expect(radii).toHaveProperty('sheet');
    });
  });

  describe('spacing', () => {
    it('values increase monotonically', () => {
      const keys = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as const;
      for (let i = 1; i < keys.length; i++) {
        expect(spacing[keys[i]!]).toBeGreaterThan(spacing[keys[i - 1]!]);
      }
    });
  });

  describe('typography', () => {
    it('body size is 17', () => {
      expect(typography.body).toBe(17);
    });

    it('exposes SF Compact font families', () => {
      expect(typeof typography.fontFamily).toBe('string');
      expect(typeof typography.fontFamilyDisplay).toBe('string');
    });

    it('title is the largest size', () => {
      const sizes = [
        typography.title,
        typography.heading,
        typography.subheading,
        typography.body,
        typography.callout,
        typography.caption,
        typography.tab,
      ];
      expect(typography.title).toBe(Math.max(...sizes));
    });
  });

  describe('shadows', () => {
    it('card shadow has expected shape', () => {
      expect(shadows.card).toEqual(
        expect.objectContaining({
          shadowColor: expect.any(String),
          shadowOffset: expect.objectContaining({ width: expect.any(Number), height: expect.any(Number) }),
          shadowOpacity: expect.any(Number),
          shadowRadius: expect.any(Number),
          elevation: expect.any(Number),
        }),
      );
    });
  });
});
