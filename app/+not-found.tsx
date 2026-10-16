import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useStyles, type Theme } from '@/constants/theme';

export default function NotFoundScreen() {
  const styles = useStyles(makeStyles);
  return (
    <>
      <Stack.Screen options={{ title: 'Tela não encontrada' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Esta tela não existe.</Text>
        <Link href="/" style={styles.link} accessibilityRole="link">
          Voltar ao cadastro
        </Link>
      </View>
    </>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: t.bg },
    title: { fontSize: 20, fontWeight: '800', color: t.ink },
    link: { marginTop: 16, paddingVertical: 14, fontSize: 16, fontWeight: '700', color: t.ink, textDecorationLine: 'underline' },
  });
