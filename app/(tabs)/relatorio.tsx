import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { PriorityPill, priorityStyle } from '@/components/ui/PriorityPill';
import { useStyles, useTheme, type Theme } from '@/constants/theme';
import { photoSource } from '@/lib/api';
import { mapsUrl } from '@/lib/geo';
import { useReports } from '@/lib/store';
import { defectById, PRIORITY_RANK, STATUS_LABEL, type Report, type Status } from '@/lib/types';

type Filter = 'todos' | Status;

const STACK: { s: Status; color: (t: Theme) => string }[] = [
  { s: 'aguardando', color: (t) => t.accent },
  { s: 'em_rota', color: (t) => t.info },
  { s: 'concluido', color: (t) => t.success },
];

export default function RelatorioScreen() {
  const t = useTheme();
  const styles = useStyles(makeStyles);
  const { reports, syncNow, sync } = useReports();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('todos');
  const [view, setView] = useState<'lista' | 'local'>('lista');

  const sorted = useMemo(
    () =>
      [...reports].sort(
        (a, b) =>
          PRIORITY_RANK[defectById(a.defect).priority] - PRIORITY_RANK[defectById(b.defect).priority] ||
          b.createdAt - a.createdAt,
      ),
    [reports],
  );

  const count = (s: Filter) => (s === 'todos' ? reports.length : reports.filter((r) => r.status === s).length);

  const visible = sorted.filter((r) => {
    if (filter !== 'todos' && r.status !== filter) return false;
    const q = query.trim().toLowerCase();
    return !q || `${r.code} ${r.street} ${r.district}`.toLowerCase().includes(q);
  });

  const critical = reports.filter((r) => r.status !== 'concluido' && defectById(r.defect).priority === 'critica').length;
  const high = reports.filter((r) => r.status !== 'concluido' && defectById(r.defect).priority === 'alta').length;
  const open = reports.filter((r) => r.status !== 'concluido').length;

  const stackLabel = STACK.map(({ s }) => `${STATUS_LABEL[s]}: ${count(s)}`).join(', ');

  const filters: { id: Filter; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'aguardando', label: STATUS_LABEL.aguardando },
    { id: 'em_rota', label: STATUS_LABEL.em_rota },
    { id: 'concluido', label: STATUS_LABEL.concluido },
  ];

  return (
    <View style={styles.flex}>
      <AppHeader title="Ordens de serviço" hint="Acompanhe e priorize o trabalho das equipes." />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={sync.syncing} onRefresh={() => void syncNow()} />}>
        <View style={styles.search}>
          <Ionicons name="search" size={22} color={t.inkMuted} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar poste, rua ou bairro"
            placeholderTextColor={t.placeholder}
            accessibilityLabel="Buscar ocorrências"
          />
        </View>

        <Card style={styles.panel}>
          <Text style={styles.h3}>
            {open} {open === 1 ? 'OS aberta' : 'OS abertas'}
            <Text style={styles.muted}> · {reports.length} no total</Text>
          </Text>
          <View style={styles.stack} accessible accessibilityLabel={stackLabel}>
            {STACK.map(({ s, color }) => {
              const n = count(s);
              return n > 0 ? <View key={s} style={{ flex: n, backgroundColor: color(t) }} /> : null;
            })}
            {reports.length === 0 && <View style={{ flex: 1, backgroundColor: t.chip }} />}
          </View>
          <View style={styles.legend}>
            {STACK.map(({ s, color }) => (
              <View key={s} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: color(t) }]} />
                <Text style={styles.legendText}>
                  {STATUS_LABEL[s]} {count(s)}
                </Text>
              </View>
            ))}
          </View>
          {(critical > 0 || high > 0) && (
            <View style={styles.pills}>
              {critical > 0 && <CountPill priority="critica" n={critical} />}
              {high > 0 && <CountPill priority="alta" n={high} />}
            </View>
          )}
        </Card>

        <View style={styles.segment} accessibilityRole="tablist">
          {(
            [
              ['lista', 'list', 'Lista'],
              ['local', 'location-outline', 'Por localização'],
            ] as const
          ).map(([v, icon, label]) => (
            <Pressable
              key={v}
              style={[styles.segBtn, view === v && styles.segActive]}
              onPress={() => setView(v)}
              accessibilityRole="tab"
              accessibilityState={{ selected: view === v }}>
              <Ionicons name={icon} size={20} color={t.ink} />
              <Text style={styles.segText}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {filters.map((f) => {
            const on = filter === f.id;
            return (
              <Pressable
                key={f.id}
                style={[styles.chip, on && { backgroundColor: t.primary }]}
                onPress={() => setFilter(f.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}>
                <Text style={[styles.chipText, on && { color: t.onPrimary }]}>
                  {f.label} ({count(f.id)})
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.h2}>Por ordem de impacto</Text>

        {visible.length === 0 && (
          <Text style={[styles.muted, styles.empty]}>
            {reports.length === 0 ? 'Nenhum poste cadastrado ainda. Use a aba Cadastro.' : 'Nenhum resultado para o filtro.'}
          </Text>
        )}

        {visible.map((r) => (view === 'lista' ? <ReportRow key={r.id} report={r} /> : <LocationRow key={r.id} report={r} />))}
      </ScrollView>
    </View>
  );
}

function CountPill({ priority, n }: { priority: 'critica' | 'alta'; n: number }) {
  const t = useTheme();
  const s = priorityStyle(t, priority);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: s.bg }}>
      <Ionicons name={s.icon} size={14} color={s.fg} />
      <Text style={{ fontSize: 13, fontWeight: '800', color: s.fg }}>
        {n} {priority === 'critica' ? (n === 1 ? 'crítico' : 'críticos') : 'alta'}
      </Text>
    </View>
  );
}

/** A lamp is the status: lit when fixed, unlit while it waits. */
const STATUS_ICON: Record<Status, keyof typeof Ionicons.glyphMap> = {
  aguardando: 'bulb-outline',
  em_rota: 'navigate-circle-outline',
  concluido: 'bulb',
};

function ReportRow({ report: r }: { report: Report }) {
  const t = useTheme();
  const styles = useStyles(makeStyles);
  const d = defectById(r.defect);
  return (
    <Link href={{ pathname: '/ocorrencia/[id]', params: { id: r.id } }} asChild>
      <Pressable accessibilityRole="button" accessibilityLabel={`${r.code}, ${d.label}, ${STATUS_LABEL[r.status]}`}>
        <Card style={styles.item}>
          <Image source={r.photos[0] ? photoSource(r.photos[0]) : undefined} style={styles.thumb} />
          <View style={styles.flex}>
            <View style={styles.titleRow}>
              <Text style={styles.code}>{r.code}</Text>
              <PriorityPill priority={d.priority} />
            </View>
            <Text style={styles.muted} numberOfLines={1}>
              {r.street} • {r.district}
            </Text>
            <View style={styles.statusRow}>
              <Ionicons name={STATUS_ICON[r.status]} size={16} color={r.status === 'concluido' ? t.accent : t.inkMuted} />
              <Text style={[styles.defectName, d.priority === 'critica' && { color: t.danger }]}>
                {d.label} · {STATUS_LABEL[r.status]}
                {!r.synced || r.pendingConclusion ? ' · não enviada' : ''}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={t.inkMuted} />
        </Card>
      </Pressable>
    </Link>
  );
}

function LocationRow({ report: r }: { report: Report }) {
  const t = useTheme();
  const styles = useStyles(makeStyles);
  const d = defectById(r.defect);
  const s = priorityStyle(t, d.priority);
  return (
    <Card style={styles.item}>
      <View style={[styles.pin, { backgroundColor: s.bg }]}>
        <Ionicons name={s.icon} size={20} color={s.fg} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.code}>{r.code}</Text>
        <Text style={styles.muted} numberOfLines={1}>
          {r.street}
        </Text>
        <Text style={styles.muted}>
          {r.latitude.toFixed(5)}, {r.longitude.toFixed(5)}
        </Text>
      </View>
      <Pressable
        style={styles.chevron}
        onPress={() => Linking.openURL(mapsUrl(r))}
        accessibilityRole="button"
        accessibilityLabel={`Abrir ${r.code} no mapa`}>
        <Ionicons name="navigate" size={20} color={t.ink} />
      </Pressable>
    </Card>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: t.bg },
    content: { paddingHorizontal: 20, paddingVertical: 8, paddingBottom: 32, gap: 14 },
    search: { height: 54, borderRadius: 16, backgroundColor: t.surface, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 10 },
    searchInput: { flex: 1, fontSize: 16, color: t.ink },
    panel: { gap: 14 },
    h3: { fontSize: 20, fontWeight: '800', color: t.ink, letterSpacing: -0.3 },
    stack: { flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden', gap: 2 },
    legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: 13, fontWeight: '600', color: t.inkMuted },
    pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    muted: { fontSize: 14, color: t.inkMuted },
    segment: { flexDirection: 'row', backgroundColor: t.chip, borderRadius: 12, padding: 4 },
    segBtn: { flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10 },
    segActive: { backgroundColor: t.surface },
    segText: { fontSize: 14, fontWeight: '700', color: t.ink },
    chips: { gap: 10 },
    chip: { minHeight: 44, justifyContent: 'center', borderRadius: 999, backgroundColor: t.chip, paddingHorizontal: 18 },
    chipText: { fontSize: 14, fontWeight: '700', color: t.chipText },
    h2: { fontSize: 20, fontWeight: '800', color: t.ink, marginTop: 6 },
    empty: { textAlign: 'center', marginTop: 24 },
    item: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
    thumb: { width: 64, height: 76, borderRadius: 12, backgroundColor: t.chip },
    pin: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    code: { fontSize: 20, fontWeight: '800', color: t.ink },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    defectName: { flex: 1, fontSize: 14, fontWeight: '600', color: t.inkMuted },
    chevron: { width: 48, height: 48, borderRadius: 12, backgroundColor: t.chip, alignItems: 'center', justifyContent: 'center' },
  });
