import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, type PressableProps } from 'react-native';

import { useTheme } from '@/constants/theme';

type Props = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'md' | 'lg';
};

export function Button({ label, icon, variant = 'primary', size = 'md', disabled, ...rest }: Props) {
  const t = useTheme();
  const palette =
    variant === 'primary'
      ? { bg: t.primary, fg: t.onPrimary, border: t.primary }
      : variant === 'danger'
        ? { bg: t.dangerSoft, fg: t.danger, border: t.dangerSoft }
        : { bg: 'transparent', fg: t.ink, border: t.border };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      {...rest}
      style={({ pressed }) => ({
        minHeight: size === 'lg' ? 60 : 52,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: palette.border,
        backgroundColor: palette.bg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingHorizontal: 18,
        opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
      })}>
      {icon && <Ionicons name={icon} size={size === 'lg' ? 26 : 22} color={palette.fg} />}
      <Text style={{ color: palette.fg, fontSize: size === 'lg' ? 18 : 16, fontWeight: '800' }}>{label}</Text>
    </Pressable>
  );
}
