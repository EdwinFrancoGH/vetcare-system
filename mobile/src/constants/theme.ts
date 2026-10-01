import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    primary: '#6D28D9',
    text: '#1F2937',
    background: '#FFFFFF',
    backgroundElement: '#F9FAFB',
    backgroundSelected: '#EDE9FE',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    success: '#16A34A',
    warning: '#F59E0B',
    error: '#DC2626',
  },
  dark: {
    primary: '#8B5CF6',
    text: '#F9FAFB',
    background: '#111827',
    backgroundElement: '#1F2937',
    backgroundSelected: '#312E81',
    textSecondary: '#9CA3AF',
    border: '#374151',
    success: '#22C55E',
    warning: '#FBBF24',
    error: '#EF4444',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({
  ios: 50,
  android: 80,
}) ?? 0;

export const MaxContentWidth = 800;