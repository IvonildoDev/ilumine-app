import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useStyles, useTheme, type Theme } from '@/constants/theme';
import { persistPhoto, useReports } from '@/lib/store';
import { defectById, type DefectId } from '@/lib/types';

type Place = { latitude: number; longitude: number; street: string; district: string };

const MAX_PHOTOS = 2;

export default function CadastroScreen() {
  const t = useTheme();
  const styles = useStyles(makeStyles);
  const { addReport, defects } = useReports();
  const { codigo } = useLocalSearchParams<{ codigo?: string }>();

  const [code, setCode] = useState('');
  const [defect, setDefect] = useState<DefectId | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [place, setPlace] = useState<Place | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);
  const [showMissing, setShowMissing] = useState(false);
  const [saved, setSaved] = useState<{ code: string; defect: string } | null>(null);

  // Code scanned on /scanner arrives as a route param; adopt it once per new value.
  const [seenCodigo, setSeenCodigo] = useState<string>();
  if (codigo && codigo !== seenCodigo) {
    setSeenCodigo(codigo);
    setCode(codigo.toUpperCase());
    setSaved(null);
  }

  const fetchPlace = useCallback(async () => {
    try {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setDenied(!canAskAgain);
        setLocationError('Sem permissão de localização');
        return;
      }
      setDenied(false);
      const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      let street = 'Endereço não identificado';
      let district = `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`;
      try {
        const [a] = await Location.reverseGeocodeAsync(coords);
        if (a) {
          const line = [a.street ?? a.name, a.streetNumber].filter(Boolean).join(', ');
          if (line) street = line;
          const rest = [a.district ?? a.subregion, a.city && a.region ? `${a.city}/${a.region}` : a.city].filter(Boolean);
          if (rest.length) district = rest.join(' • ');
        }
      } catch {
        // Geocoding is best-effort; coordinates are what matter.
      }
      setPlace({ latitude: coords.latitude, longitude: coords.longitude, street, district });
    } catch {
      setLocationError('Não foi possível obter o GPS');
    } finally {
      setLocating(false);
    }
  }, []);

  const locate = () => {
    setLocating(true);
    setLocationError(null);
    fetchPlace();
  };

  useEffect(() => {
    // Initial GPS fix: syncs with an external system; state is only set after awaits.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPlace();
  }, [fetchPlace]);

  const addPhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Câmera', 'Permita o acesso à câmera nas configurações para anexar fotos.', [
        { text: 'Agora não', style: 'cancel' },
        { text: 'Abrir configurações', onPress: () => Linking.openSettings() },
      ]);
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!res.canceled) {
      setPhotos((p) => [...p, persistPhoto(res.assets[0].uri)]);
      setSaved(null);
    }
  };

  const pickFromGallery = async () => {
    const left = MAX_PHOTOS - photos.length;
    if (left <= 0) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
      allowsMultipleSelection: left > 1,
      selectionLimit: left,
    });
    if (!res.canceled) {
      const uris = res.assets.slice(0, left).map((a) => persistPhoto(a.uri));
      setPhotos((p) => [...p, ...uris].slice(0, MAX_PHOTOS));
      setSaved(null);
    }
  };

  const missing = [!code.trim() && 'plaqueta', !defect && 'defeito', !place && 'GPS', photos.length === 0 && 'foto'].filter(
    Boolean,
  ) as string[];
  const miss = (k: string) => showMissing && missing.includes(k);

  const confirm = () => {
    if (missing.length || !defect || !place) {
      setShowMissing(true);
      return;
    }
    addReport({
      code: code.trim().toUpperCase(),
      defect,
      photos,
      latitude: place.latitude,
      longitude: place.longitude,
      street: place.street,
      district: place.district,
    });
    setSaved({ code: code.trim().toUpperCase(), defect: defectById(defect).label });
    setCode('');
    setDefect(null);
    setPhotos([]);
    setShowMissing(false);
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      <AppHeader title="Registrar defeito" hint="Registre defeitos na iluminação em poucos toques." />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.progress} accessible accessibilityLabel={`${4 - missing.length} de 4 etapas concluídas`}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.seg, i < 4 - missing.length && styles.segOn]} />
          ))}
          <Text style={styles.progressText}>{4 - missing.length}/4</Text>
        </View>
        {saved && (
          <View style={styles.saved} accessibilityLiveRegion="polite">
            <Ionicons name="bulb" size={26} color={t.onSuccessSoft} />
            <View style={styles.flex}>
              <Text style={styles.savedTitle}>Defeito em {saved.code} registrado</Text>
              <Text style={styles.savedSub}>
                {saved.defect} · salva neste aparelho e será enviada ao servidor. O local foi mantido para o próximo registro.
              </Text>
            </View>
          </View>
        )}

        <Card style={styles.row}>
          <View style={styles.pinBox}>
            <Ionicons name="location-outline" size={26} color={t.ink} />
          </View>
          <View style={styles.flex}>
            <View style={styles.gpsRow}>
              <View style={[styles.dot, { backgroundColor: place ? t.success : t.placeholder }]} />
              <Text style={styles.status}>{place ? 'GPS ativo' : locating ? 'Buscando GPS…' : 'GPS inativo'}</Text>
            </View>
            <Text style={styles.addr} numberOfLines={1}>
              {place?.street ?? locationError ?? 'Localizando…'}
            </Text>
            {place && <Text style={styles.muted}>{place.district}</Text>}
            {denied && !place && (
              <Pressable onPress={() => Linking.openSettings()} accessibilityRole="link" hitSlop={8}>
                <Text style={styles.link}>Abrir configurações do aparelho</Text>
              </Pressable>
            )}
          </View>
          <Pressable
            style={styles.crosshair}
            onPress={locate}
            disabled={locating}
            accessibilityRole="button"
            accessibilityLabel="Atualizar localização">
            {locating ? <ActivityIndicator color={t.ink} /> : <Ionicons name="locate" size={24} color={t.ink} />}
          </Pressable>
        </Card>
        {miss('GPS') && <Text style={styles.err}>Aguarde a localização GPS ou toque em atualizar.</Text>}

        <Card style={miss('plaqueta') ? styles.cardErr : undefined}>
          <Text style={styles.sectionTitle}>Plaqueta</Text>
          <View style={styles.row}>
            <View style={styles.codeInput}>
              <Text style={styles.hash}>#</Text>
              <TextInput
                style={styles.codeText}
                value={code}
                onChangeText={(v) => {
                  setCode(v);
                  setSaved(null);
                }}
                placeholder="PST-0000-0000"
                placeholderTextColor={t.placeholder}
                autoCapitalize="characters"
                autoCorrect={false}
                accessibilityLabel="Código da plaqueta"
              />
            </View>
            <Pressable style={styles.scanBtn} onPress={() => router.push('/scanner')} accessibilityRole="button">
              <Ionicons name="qr-code-outline" size={24} color={t.onPrimary} />
              <Text style={styles.scanText}>Escanear</Text>
            </Pressable>
          </View>
          {miss('plaqueta') && <Text style={styles.err}>Escaneie ou digite o código da plaqueta.</Text>}
        </Card>

        <Card style={miss('defeito') ? styles.cardErr : undefined}>
          <Text style={styles.sectionTitle}>Defeito identificado</Text>
          <View style={styles.grid} accessibilityRole="radiogroup">
            {defects.map((d) => {
              const selected = defect === d.id;
              const bg = selected ? t.primary : d.danger ? t.dangerSoft : t.chip;
              const fg = selected ? t.onPrimary : d.danger ? t.danger : t.chipText;
              return (
                <Pressable
                  key={d.id}
                  style={[styles.defect, { backgroundColor: bg }]}
                  onPress={() => {
                    setDefect(d.id);
                    setSaved(null);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}>
                  <Ionicons name={d.icon} size={22} color={selected ? t.accent : fg} />
                  <Text style={[styles.defectText, { color: fg }]}>{d.label}</Text>
                  {selected && <Ionicons name="checkmark" size={20} color={fg} />}
                </Pressable>
              );
            })}
          </View>
          {miss('defeito') && <Text style={styles.err}>Selecione o defeito.</Text>}
        </Card>

        <Card style={miss('foto') ? styles.cardErr : undefined}>
          <View style={styles.photoHeader}>
            <Text style={styles.sectionTitle}>Fotos do local</Text>
            <Text style={styles.muted}>
              {photos.length}/{MAX_PHOTOS}
            </Text>
          </View>
          <View style={styles.photos}>
            {photos.map((uri, i) => (
              <View key={uri} style={styles.photo}>
                <Image source={{ uri }} style={StyleSheet.absoluteFill} />
                <Pressable
                  style={styles.remove}
                  onPress={() => setPhotos((p) => p.filter((_, idx) => idx !== i))}
                  accessibilityRole="button"
                  accessibilityLabel={`Remover foto ${i + 1}`}>
                  <View style={styles.removeDot}>
                    <Ionicons name="close" size={18} color="#fff" />
                  </View>
                </Pressable>
              </View>
            ))}
          </View>
          {photos.length < MAX_PHOTOS && (
            <View style={styles.photoActions}>
              <Pressable style={styles.photoBtn} onPress={addPhoto} accessibilityRole="button">
                <Ionicons name="camera-outline" size={24} color={t.ink} />
                <Text style={styles.photoBtnText}>Câmera</Text>
              </Pressable>
              <Pressable style={styles.photoBtn} onPress={pickFromGallery} accessibilityRole="button">
                <Ionicons name="images-outline" size={24} color={t.ink} />
                <Text style={styles.photoBtnText}>Galeria</Text>
              </Pressable>
            </View>
          )}
          {miss('foto') &&<Text style={styles.err}>Anexe ao menos uma foto do local.</Text>}
        </Card>

        <Button
          size="lg"
          icon={missing.length ? 'ellipsis-horizontal-circle-outline' : 'checkmark-circle-outline'}
          label={missing.length ? `Falta: ${missing.join(', ')}` : 'Registrar defeito'}
          variant={missing.length ? 'secondary' : 'primary'}
          onPress={confirm}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: t.bg },
    content: { paddingHorizontal: 20, paddingVertical: 8, paddingBottom: 32, gap: 16 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    progress: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    seg: { flex: 1, height: 6, borderRadius: 3, backgroundColor: t.chip },
    segOn: { backgroundColor: t.accent },
    progressText: { marginLeft: 6, fontSize: 13, fontWeight: '800', color: t.inkMuted },
    saved: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: t.successSoft, borderRadius: 14, padding: 14 },
    savedTitle: { fontSize: 16, fontWeight: '800', color: t.onSuccessSoft },
    savedSub: { fontSize: 13, color: t.onSuccessSoft, marginTop: 2 },
    pinBox: { width: 52, height: 52, borderRadius: 14, backgroundColor: t.chip, alignItems: 'center', justifyContent: 'center' },
    gpsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { width: 9, height: 9, borderRadius: 5 },
    status: { fontSize: 13, fontWeight: '700', color: t.inkMuted },
    addr: { fontSize: 17, fontWeight: '800', color: t.ink },
    muted: { fontSize: 13, color: t.inkMuted },
    link: { fontSize: 14, fontWeight: '700', color: t.ink, textDecorationLine: 'underline', marginTop: 4 },
    err: { fontSize: 13, fontWeight: '700', color: t.danger, marginTop: 8 },
    cardErr: { borderColor: t.danger, borderWidth: 1.5 },
    crosshair: { width: 48, height: 48, borderRadius: 12, backgroundColor: t.chip, alignItems: 'center', justifyContent: 'center' },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: t.ink, marginBottom: 12 },
    codeInput: { flex: 1, height: 56, borderRadius: 12, backgroundColor: t.chip, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 8 },
    hash: { fontSize: 22, color: t.inkMuted },
    codeText: { flex: 1, fontSize: 20, fontWeight: '800', color: t.ink, letterSpacing: 1 },
    scanBtn: { height: 56, paddingHorizontal: 18, borderRadius: 12, backgroundColor: t.primary, flexDirection: 'row', alignItems: 'center', gap: 8 },
    scanText: { color: t.onPrimary, fontWeight: '800', fontSize: 15 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    defect: { width: '47.5%', minHeight: 60, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, flexGrow: 1 },
    defectText: { flex: 1, fontSize: 14, fontWeight: '700' },
    photoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
    photos: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    photo: { width: '47.5%', aspectRatio: 1.3, borderRadius: 12, overflow: 'hidden', backgroundColor: t.chip },
    remove: { position: 'absolute', top: 0, right: 0, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    removeDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: t.scrim, alignItems: 'center', justifyContent: 'center' },
    photoActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
    photoBtn: { flex: 1, minHeight: 56, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.placeholder, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    photoBtnText: { fontSize: 15, fontWeight: '800', color: t.ink },
  });
