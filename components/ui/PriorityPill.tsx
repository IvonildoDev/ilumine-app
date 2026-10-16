import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { useTheme, type Theme } from '@/constants/theme';
import { PRIORITY_LABEL, type Priority } from '@/lib/types';

/** Priority is carried by fill, icon and label together, never by color alone. */
export function priorityStyle(t: Theme, p: Priority) {
  switch (p) {
    case 'critica':
      return { bg: t.danger, fg: t.onDanger, icon: 'alert-circle' as const };
    case 'alta':
      return { bg: t.high, fg: t.onHigh, icon: 'warning' as const };
    default:
      return { bg: t.accentSoft, fg: t.accentText, icon: 'remove-circle-outline' as const };
  }
}

export function PriorityPill({ priority }: { priority: Priority }) {
  const t = useTheme();
  const s = priorityStyle(t, priority);
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: s.bg }}>
      <Ionicons name={s.icon} size={14} color={s.fg} />
      <Text style={{ fontSize: 13, fontWeight: '700', color: s.fg }}>{PRIORITY_LABEL[priority]}</Text>
    </View>
  );
}
