import { View, type ViewProps } from 'react-native';

import { useStyles, type Theme } from '@/constants/theme';

export function Card({ style, ...props }: ViewProps) {
  const styles = useStyles(makeStyles);
  return <View {...props} style={[styles.card, style]} />;
}

const makeStyles = (t: Theme) => ({
  card: {
    backgroundColor: t.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: t.scheme === 'light' ? 0 : 1,
    borderColor: t.border,
    shadowColor: '#2A2410',
    shadowOpacity: t.scheme === 'light' ? 0.08 : 0,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: t.scheme === 'light' ? 3 : 0,
  } as const,
});
