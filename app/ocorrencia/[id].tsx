import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Image, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PriorityPill } from '@/components/ui/PriorityPill';
import { useStyles, type Theme } from '@/constants/theme';
import { photoSource } from '@/lib/api';
import { mapsUrl } from '@/lib/geo';
import { useReports } from '@/lib/store';
import { defectById, STATUS_LABEL } from '@/lib/types';

export default function OcorrenciaScreen() {
  const styles = useStyles(makeStyles);
  const { bottom } = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { reports, removeReport } = useReports();
  const r = reports.find((x) => x.id === id);

  if (!r) return <Text style={styles.missing}>Ocorrência não encontrada.</Text>;

  const d = defectById(r.defect);
  const done = r.status === 'concluido';
  const naoEnviada = !r.synced || !!r.pendingConclusion;

  const remove = () =>
    Alert.alert('Excluir ocorrência', `Remover ${r.code}? Ela ainda não foi enviada ao servidor e isso não pode ser desfeito.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          removeReport(r.id);
          router.back();
        },
      },
    ]);

  return (
    <View style={styles.flex}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
        {naoEnviada && (
          <Text style={styles.aviso} accessibilityRole="alert">
            {r.synced ? 'A conclusão ainda não foi enviada.' : 'Esta OS ainda não foi enviada ao servidor.'} Ela será enviada quando houver conexão.
          </Text>
        )}
        <Card>
          <View style={styles.top}>
            <Text style={styles.code}>{r.code}</Text>
            <PriorityPill priority={d.priority} />
          </View>
          <Text style={styles.defect}>{d.label}</Text>
          <Text style={styles.muted}>
            {STATUS_LABEL[r.status]}
            {r.equipeNome ? ` · ${r.equipeNome}` : ''}
          </Text>
          <Text style={[styles.muted, { marginTop: 8 }]}>
            {r.street} • {r.district}
          </Text>
          <Text style={styles.muted}>
            {r.latitude.toFixed(5)}, {r.longitude.toFixed(5)}
          </Text>
          {r.observacao ? <Text style={[styles.muted, { marginTop: 8 }]}>Observação: {r.observacao}</Text> : null}
        </Card>

        {r.photos.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photos}>
            {r.photos.map((uri) => (
              <Image key={uri} source={photoSource(uri)} style={styles.photo} accessibilityLabel="Foto do defeito" />
            ))}
          </ScrollView>
        )}

        {!r.synced && <Button variant="danger" icon="trash-outline" label="Excluir ocorrência" onPress={remove} />}
      </ScrollView>

      <View style={[styles.bar, { paddingBottom: bottom + 12 }]}>
        <Button variant="secondary" icon="navigate" label="Abrir no mapa" onPress={() => Linking.openURL(mapsUrl(r))} />
        {!done && (
          <Button
            size="lg"
            icon="bulb"
            label="Concluir OS"
            onPress={() => router.push({ pathname: '/ocorrencia/concluir', params: { id: r.id } })}
          />
        )}
      </View>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: t.bg },
    content: { padding: 16, gap: 14 },
    missing: { padding: 24, textAlign: 'center', color: t.inkMuted, backgroundColor: t.bg, flex: 1 },
    aviso: { backgroundColor: t.accentSoft, color: t.accentText, fontWeight: '700', padding: 12, borderRadius: 12, fontSize: 14 },
    top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
    code: { fontSize: 26, fontWeight: '800', color: t.ink },
    defect: { fontSize: 18, fontWeight: '700', color: t.ink, marginTop: 4 },
    muted: { fontSize: 14, color: t.inkMuted },
    photos: { gap: 12 },
    photo: { width: 260, aspectRatio: 4 / 3, borderRadius: 12, backgroundColor: t.chip },
    bar: { gap: 10, paddingHorizontal: 16, paddingTop: 12, backgroundColor: t.surface, borderTopWidth: 1, borderTopColor: t.border },
  });
