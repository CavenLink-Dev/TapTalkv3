export const colors = {
  primary: '#199aee',
  primaryDark: '#005d99',
  mascot: '#76baee',
  background: '#f1f5f9',
  surface: '#ffffff',
  softBlue: '#dcecf6',
  text: '#202020',
  textMuted: '#636366',
  textTertiary: '#8E8E93',
  border: '#E5E7EB',
  borderBlue: '#D1E8F5',
  input: '#F0F5FA',
  success: '#30D158',
  warning: '#FF9500',
  danger: '#FF3B30',
  disabled: '#C7C7CC',
} as const;

export const radii = {
  button: 10,
  input: 10,
  card: 16,
  pill: 22,
  sheet: 44,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const typography = {
  fontFamily: 'System',
  title: 30,
  heading: 24,
  subheading: 20,
  body: 17,
  callout: 15,
  caption: 12,
  tab: 10,
} as const;

export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;
