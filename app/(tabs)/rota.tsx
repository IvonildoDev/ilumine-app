import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { PriorityPill } from '@/components/ui/PriorityPill';
import { useStyles, useTheme, type Theme } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { planRoute } from '@/lib/geo';
import { useReports } from '@/lib/store';
import { defectById, PRIORITY_RANK, STATUS_LABEL } from '@/lib/types';

/** As OS que a gestão atribuiu à equipe do usuário, na ordem de visita (críticas primeiro). */
export default function RotaScreen() {
  const t = useTheme();
  const styles = useStyles(makeStyles);
  const { user } = useAuth();
  const { reports, sync, syncNow } = useReports();

  const minhas = useMemo(
    () => reports.filter((r) => r.status !== 'concluido' && r.equipeId && r.equipeId === user?.equipe_id),
    [reports, user?.equipe_id],
  );

  const { urgentes, rota, km } = useMemo(() => {
    const crit = minhas.filter((r) => defectById(r.defect).priority === 'critica');
    const resto = minhas.filter((r) => defectById(r.defect).priority !== 'critica');
    const plano = planRoute(resto.sort((a, b) => PRIORITY_RANK[defectById(a.defect).priority] - PRIORITY_RANK[defectById(b.defect).priority]));
    return { urgentes: crit, rota: plano.ordered, km: plano.km };
  }, [minhas]);

  const ordenadas = [...urgentes, ...rota];

  return (
    <View style={styles.flex}>
      <AppHeader title="Minha rota" hint={user?.equipe_nome ? `Equipe ${user.equipe_nome}` : 'As OS da sua equipe aparecem aqui.'} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={sync.syncing} onRefresh={() => void syncNow()} />}>
        {!user?.equipe_id ? (
          <Card style={styles.vazio}>
            <Ionicons name="people-outline" size={32} color={t.inkMuted} />
            <Text style={styles.vazioTitulo}>Você ainda não está em uma equipe</Text>
            <Text style={styles.muted}>Peça ao administrador para ligar seu usuário a uma equipe no painel.</Text>
          </Card>
        ) : ordenadas.length === 0 ? (
          <Card style={styles.vazio}>
            <Ionicons name="bulb-outline" size={32} color={t.inkMuted} />
            <Text style={styles.vazioTitulo}>Nenhuma OS na sua rota</Text>
            <Text style={styles.muted}>Quando a gestão atribuir OS à sua equipe, elas aparecem aqui. Puxe a tela para atualizar.</Text>
          </Card>
        ) : (
          <>
            <Text style={styles.resumo}>
              {ordenadas.length} {ordenadas.length === 1 ? 'OS' : 'OS'} · rota de {km.toFixed(1)} km
            </Text>
            {ordenadas.map((r, i) => {
              const d = defectById(r.defect);
              return (
                <Link key={r.id} href={{ pathname: '/ocorrencia/[id]', params: { id: r.id } }} asChild>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Parada ${i + 1}: ${r.code}, ${d.label}`}>
                    <Card style={styles.item}>
                      <View style={styles.ordem}>
                        <Text style={styles.ordemNum}>{i + 1}</Text>
                      </View>
                      <View style={styles.flex}>
                        <View style={styles.titulo}>
                          <Text style={styles.code}>{r.code}</Text>
                          <PriorityPill priority={d.priority} />
                        </View>
                        <Text style={styles.muted} numberOfLines={1}>
                          {r.street} • {r.district}
                        </Text>
                        <Text style={styles.def}>
                          {d.label} · {STATUS_LABEL[r.status]}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={t.inkMuted} />
                    </Card>
                  </Pressable>
                </Link>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: t.bg },
    content: { paddingHorizontal: 20, paddingVertical: 8, paddingBottom: 32, gap: 14 },
    resumo: { fontSize: 15, fontWeight: '700', color: t.inkMuted },
    muted: { fontSize: 14, color: t.inkMuted },
    vazio: { alignItems: 'center', gap: 8, paddingVertical: 32 },
    vazioTitulo: { fontSize: 18, fontWeight: '800', color: t.ink, textAlign: 'center' },
    item: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
    ordem: { width: 36, height: 36, borderRadius: 18, backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center' },
    ordemNum: { color: t.onPrimary, fontWeight: '800', fontSize: 16 },
    titulo: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    code: { fontSize: 18, fontWeight: '800', color: t.ink },
    def: { fontSize: 14, fontWeight: '600', color: t.inkMuted, marginTop: 2 },
  });
