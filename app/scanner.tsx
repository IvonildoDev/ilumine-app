import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useStyles, type Theme } from '@/constants/theme';

export default function ScannerScreen() {
  const styles = useStyles(makeStyles);
  const [permission, requestPermission] = useCameraPermissions();
  const done = useRef(false);

  if (!permission) return <View style={styles.center} />;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>Precisamos da câmera para ler a plaqueta do poste.</Text>
        <Pressable style={styles.btn} onPress={requestPermission} accessibilityRole="button">
          <Text style={styles.btnText}>Permitir câmera</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <CameraView
        style={styles.flex}
        barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'code39', 'ean13'] }}
        onBarcodeScanned={({ data }) => {
          if (done.current) return;
          done.current = true;
          router.dismissTo({ pathname: '/', params: { codigo: data } });
        }}
      />
      <View pointerEvents="none" style={styles.frame} />
      <Text style={styles.hint}>Aponte para o QR code ou código de barras da plaqueta</Text>
    </View>
  );
}

const makeStyles = (theme: Theme) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16, backgroundColor: theme.bg },
  msg: { textAlign: 'center', fontSize: 16, color: theme.ink },
  btn: { backgroundColor: theme.primary, paddingHorizontal: 24, minHeight: 48, justifyContent: 'center', borderRadius: 12 },
  btnText: { color: theme.onPrimary, fontWeight: '800' },
  frame: {
    position: 'absolute',
    alignSelf: 'center',
    top: '30%',
    width: 240,
    height: 240,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: theme.accent,
  },
  hint: { position: 'absolute', bottom: 48, alignSelf: 'center', color: '#fff', fontWeight: '600', textAlign: 'center', paddingHorizontal: 24 },
});
