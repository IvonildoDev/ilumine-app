import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, Text, View } from 'react-native';

import { useStyles, useTheme, type Theme } from '@/constants/theme';
import { Button } from './Button';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** `warning` pinta o ícone de âmbar, `danger` de vermelho. */
  tone?: 'warning' | 'danger';
  /** Linha de destaque opcional, ex.: contagem de itens não enviados. */
  highlight?: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  icon,
  tone = 'warning',
  highlight,
  confirmLabel,
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
}: Props) {
  const t = useTheme();
  const styles = useStyles(makeStyles);
  const danger = tone === 'danger';

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <Pressable style={styles.scrim} onPress={onCancel} accessibilityLabel="Fechar aviso">
        <Pressable style={styles.card} accessibilityViewIsModal onPress={() => {}}>
          <View style={[styles.badge, { backgroundColor: danger ? t.dangerSoft : t.accentSoft }]}>
            <Ionicons name={icon} size={30} color={danger ? t.danger : t.accentText} />
          </View>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          <Text style={styles.message}>{message}</Text>
          {highlight ? (
            <View style={styles.highlight}>
              <Ionicons name="cloud-offline-outline" size={18} color={t.accentText} />
              <Text style={styles.highlightText}>{highlight}</Text>
            </View>
          ) : null}
          <View style={styles.actions}>
            <Button label={confirmLabel} icon="log-out-outline" variant={danger ? 'danger' : 'primary'} onPress={onConfirm} />
            <Button label={cancelLabel} variant="secondary" onPress={onCancel} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (t: Theme) => ({
  scrim: { flex: 1, backgroundColor: t.scrim, alignItems: 'center', justifyContent: 'center', padding: 24 } as const,
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: t.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: t.border,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  } as const,
  badge: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 6 } as const,
  title: { fontSize: 22, fontWeight: '800', color: t.ink, letterSpacing: -0.4, textAlign: 'center' } as const,
  message: { fontSize: 15, lineHeight: 22, color: t.inkMuted, textAlign: 'center' } as const,
  highlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: t.accentSoft,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 4,
  } as const,
  highlightText: { fontSize: 14, fontWeight: '700', color: t.accentText } as const,
  actions: { alignSelf: 'stretch', gap: 10, marginTop: 14 } as const,
});
