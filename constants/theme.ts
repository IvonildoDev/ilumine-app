import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

/**
 * Two schemes, one idea: light. Day is warm paper with ink; night is a dark street
 * with the lamp amber as the only bright thing. Contrast figures are text on its surface.
 */
const light = {
  scheme: 'light' as const,
  bg: '#F4F2EB',
  surface: '#FFFFFF',
  ink: '#0E1726',
  inkMuted: '#4B5260',
  chip: '#ECE9DF',
  chipText: '#0E1726',
  border: '#D9D5C7',
  placeholder: '#5E6472',
  primary: '#0E1726',
  onPrimary: '#FFFFFF',
  accent: '#F5A524',
  onAccent: '#1A1200',
  accentSoft: '#FFE7BD',
  accentText: '#5C3A00',
  high: '#8B4A00',
  onHigh: '#FFFFFF',
  danger: '#B3261E',
  onDanger: '#FFFFFF',
  dangerSoft: '#FFDAD6',
  info: '#2F6FED',
  success: '#1F7A3A',
  successSoft: '#C8F0CF',
  onSuccessSoft: '#06260F',
  scrim: 'rgba(14,23,38,0.78)',
};

export type Theme = typeof light | typeof dark;

const dark = {
  scheme: 'dark' as const,
  bg: '#0B1020',
  surface: '#151B2E',
  ink: '#F3F1EA',
  inkMuted: '#AAB0C0',
  chip: '#222A41',
  chipText: '#F3F1EA',
  border: '#2B3452',
  placeholder: '#9097AB',
  primary: '#FFB536',
  onPrimary: '#1A1200',
  accent: '#FFB536',
  onAccent: '#1A1200',
  accentSoft: '#4A3510',
  accentText: '#FFD791',
  high: '#D97F00',
  onHigh: '#1A0F00',
  danger: '#FF8A80',
  onDanger: '#3B0A07',
  dangerSoft: '#4A1F1C',
  info: '#8DB4FF',
  success: '#7BD88F',
  successSoft: '#1E4A2A',
  onSuccessSoft: '#D4F5DB',
  scrim: 'rgba(0,0,0,0.7)',
};

export const palettes = { light, dark };

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}

/** Build a StyleSheet once per scheme: `const styles = useStyles(makeStyles)`. */
export function useStyles<T>(factory: (t: Theme) => T): T {
  const t = useTheme();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => factory(t), [t]);
}
