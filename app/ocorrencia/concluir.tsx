import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useStyles, useTheme, type Theme } from '@/constants/theme';
import { useReports } from '@/lib/store';
import { defectById } from '@/lib/types';

/** Conclusão da OS: materiais usados e observação. Fica salva no aparelho e segue para o servidor. */
export default function ConcluirScreen() {
  const t = useTheme();
  const styles = useStyles(makeStyles);
  const { bottom } = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { reports, materials, concludeReport } = useReports();
  const r = reports.find((x) => x.id === id);

  const [qtd, setQtd] = useState<Record<string, number>>({});
  const [obs, setObs] = useState('');

  if (!r) return <Text style={styles.missing}>Ocorrência não encontrada.</Text>;

  const mudar = (mid: string, delta: number) =>
    setQtd((q) => {
      const next = Math.max(0, (q[mid] ?? 0) + delta);
      const { [mid]: _, ...rest } = q;
      return next === 0 ? rest : { ...rest, [mid]: next };
    });

  const usados = Object.entries(qtd);

  const concluir = () => {
    concludeReport(r.id, {
      materiais: usados.map(([material_id, quantidade]) => ({ material_id, quantidade })),
      observacao: obs.trim() || undefined,
    });
    router.dismiss();
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.titulo}>
          {r.code} · {defectById(r.defect).label}
        </Text>

        <Card>
          <Text style={styles.secao}>Materiais usados</Text>
          {materials.length === 0 ? (
            <Text style={styles.muted}>Nenhum material no catálogo. Você pode concluir sem informar materiais.</Text>
          ) : (
            materials.map((m) => {
              const n = qtd[m.id] ?? 0;
              return (
                <View key={m.id} style={styles.linha}>
                  <View style={styles.flexTxt}>
                    <Text style={styles.nome}>{m.nome}</Text>
                    <Text style={styles.muted}>{m.unidade}</Text>
                  </View>
                  <Pressable
                    style={[styles.passo, n === 0 && { opacity: 0.4 }]}
                    onPress={() => mudar(m.id, -1)}
                    disabled={n === 0}
                    accessibilityRole="button"
                    accessibilityLabel={`Diminuir ${m.nome}`}>
                    <Ionicons name="remove" size={22} color={t.ink} />
                  </Pressable>
                  <Text style={styles.qtd} accessibilityLiveRegion="polite">
                    {n}
                  </Text>
                  <Pressable style={styles.passo} onPress={() => mudar(m.id, 1)} accessibilityRole="button" accessibilityLabel={`Aumentar ${m.nome}`}>
                    <Ionicons name="add" size={22} color={t.ink} />
                  </Pressable>
                </View>
              );
            })
          )}
        </Card>

        <Card>
          <Text style={styles.secao}>Observação</Text>
          <TextInput
            style={styles.obs}
            value={obs}
            onChangeText={setObs}
            multiline
            placeholder="O que foi feito? (opcional)"
            placeholderTextColor={t.placeholder}
            maxLength={2000}
            accessibilityLabel="Observação"
          />
        </Card>
      </ScrollView>

      <View style={[styles.bar, { paddingBottom: bottom + 12 }]}>
        <Button
          size="lg"
          icon="bulb"
          label={usados.length ? `Concluir com ${usados.length} ${usados.length === 1 ? 'material' : 'materiais'}` : 'Concluir sem materiais'}
          onPress={concluir}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: t.bg },
    flexTxt: { flex: 1 },
    content: { padding: 16, gap: 14 },
    missing: { padding: 24, textAlign: 'center', color: t.inkMuted, backgroundColor: t.bg, flex: 1 },
    titulo: { fontSize: 18, fontWeight: '800', color: t.ink },
    secao: { fontSize: 16, fontWeight: '800', color: t.ink, marginBottom: 8 },
    muted: { fontSize: 14, color: t.inkMuted },
    linha: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
    nome: { fontSize: 16, fontWeight: '700', color: t.ink },
    passo: { width: 44, height: 44, borderRadius: 12, backgroundColor: t.chip, alignItems: 'center', justifyContent: 'center' },
    qtd: { minWidth: 28, textAlign: 'center', fontSize: 18, fontWeight: '800', color: t.ink },
    obs: { minHeight: 96, borderRadius: 12, backgroundColor: t.chip, padding: 12, fontSize: 16, color: t.ink, textAlignVertical: 'top' },
    bar: { paddingHorizontal: 16, paddingTop: 12, backgroundColor: t.surface, borderTopWidth: 1, borderTopColor: t.border },
  });
