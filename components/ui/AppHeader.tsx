import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStyles, useTheme, type Theme } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { useReports } from '@/lib/store';
import { ConfirmDialog } from './ConfirmDialog';

/** Brand row on top, the screen's own title large beneath it. */
export function AppHeader({ title, hint }: { title: string; hint?: string }) {
  const { top } = useSafeAreaInsets();
  const t = useTheme();
  const styles = useStyles(makeStyles);
  const { user, signOut } = useAuth();
  const { sync, syncNow } = useReports();

  const offline = sync.error === 'Sem conexão';
  const label = sync.syncing
    ? 'Sincronizando…'
    : sync.pending > 0
      ? `${sync.pending} ${sync.pending === 1 ? 'pendente' : 'pendentes'}`
      : offline
        ? 'Sem conexão'
        : sync.error
          ? 'Falha ao sincronizar'
          : 'Sincronizado';
  const icon = sync.syncing ? 'sync' : sync.pending > 0 || offline ? 'cloud-offline-outline' : sync.error ? 'alert-circle-outline' : 'cloud-done-outline';

  const [confirmando, setConfirmando] = useState(false);
  const sair = () => setConfirmando(true);
  const temPendentes = sync.pending > 0;

  const menu = () =>
    Alert.alert(user?.nome ?? 'Conta', sync.error ? `Último erro: ${sync.error}` : undefined, [
      { text: 'Sincronizar agora', onPress: () => void syncNow() },
      { text: 'Sair da conta', style: 'destructive', onPress: sair },
      { text: 'Fechar', style: 'cancel' },
    ]);

  return (
    <View style={[styles.wrap, { paddingTop: top + 10 }]}>
      <View style={styles.brandRow}>
        <View style={styles.logo}>
          <Ionicons name="bulb" size={20} color={t.accent} />
        </View>
        <Text style={styles.brand}>Ilumine</Text>
        <View style={{ flex: 1 }} />
        <Pressable
          style={styles.status}
          onPress={menu}
          accessibilityRole="button"
          accessibilityLabel={`${label}. Abrir menu da conta`}
          hitSlop={8}>
          <Ionicons name={icon} size={16} color={sync.pending > 0 || sync.error ? t.accentText : t.inkMuted} />
          <Text style={[styles.statusText, (sync.pending > 0 || sync.error) && { color: t.accentText }]}>{label}</Text>
        </Pressable>
      </View>
      {user?.nome ? (
        <View style={styles.userRow}>
          <Ionicons accessibilityLabel={`Usuário: ${user.nome}`} name="person-circle-outline" size={18} color={t.inkMuted} />
          <Text style={styles.userName} numberOfLines={1}>
            {user.nome}
          </Text>
          <View style={{ flex: 1 }} />
          <Pressable style={styles.logout} onPress={sair} accessibilityRole="button" accessibilityLabel="Sair da conta" hitSlop={8}>
            <Ionicons name="log-out-outline" size={18} color={t.ink} />
            <Text style={styles.logoutText}>Sair</Text>
          </Pressable>
        </View>
      ) : null}
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <ConfirmDialog
        visible={confirmando}
        icon={temPendentes ? 'warning-outline' : 'log-out-outline'}
        tone={temPendentes ? 'danger' : 'warning'}
        title={temPendentes ? 'Há OS não enviadas' : 'Sair da conta?'}
        message={
          temPendentes
            ? 'Ao sair, o que ainda não chegou ao servidor será perdido. Aguarde a sincronização ou saia mesmo assim.'
            : `${user?.nome ? `${user.nome}, você` : 'Você'} precisará entrar de novo para continuar.`
        }
        highlight={temPendentes ? `${sync.pending} ${sync.pending === 1 ? 'OS pendente' : 'OS pendentes'}` : undefined}
        confirmLabel={temPendentes ? 'Sair mesmo assim' : 'Sair'}
        cancelLabel={temPendentes ? 'Voltar' : 'Cancelar'}
        onCancel={() => setConfirmando(false)}
        onConfirm={() => {
          setConfirmando(false);
          void signOut();
        }}
      />
    </View>
  );
}

const makeStyles = (t: Theme) => ({
  wrap: { paddingHorizontal: 20, paddingBottom: 14, backgroundColor: t.bg, gap: 4 } as const,
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 } as const,
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 } as const,
  logout: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, backgroundColor: t.chip, paddingHorizontal: 12, minHeight: 36 } as const,
  logoutText: { fontSize: 12, fontWeight: '700', color: t.ink } as const,
  userName: { flexShrink: 1, fontSize: 14, fontWeight: '700', color: t.inkMuted } as const,
  logo: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: t.scheme === 'light' ? t.ink : t.chip,
    alignItems: 'center',
    justifyContent: 'center',
  } as const,
  brand: { fontSize: 16, fontWeight: '800', color: t.ink, letterSpacing: -0.2 } as const,
  title: { fontSize: 30, fontWeight: '800', color: t.ink, letterSpacing: -0.8 } as const,
  hint: { fontSize: 15, color: t.inkMuted } as const,
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: t.chip,
    paddingHorizontal: 12,
    minHeight: 36,
  } as const,
  statusText: { fontSize: 12, fontWeight: '700', color: t.inkMuted } as const,
});
