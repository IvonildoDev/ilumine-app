import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { useStyles, useTheme, type Theme } from '@/constants/theme';
import { API_URL } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function LoginScreen() {
  const t = useTheme();
  const styles = useStyles(makeStyles);
  const { top, bottom } = useSafeAreaInsets();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const senhaRef = useRef<TextInput>(null);

  const entrar = async () => {
    if (!email.trim() || !senha) {
      setErro('Informe e-mail e senha.');
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      await signIn(email, senha);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível entrar.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: top + 48, paddingBottom: bottom + 24 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.logo}>
          <Ionicons name="bulb" size={34} color={t.accent} />
        </View>
        <Text style={styles.title} accessibilityRole="header">
          Ilumine
        </Text>
        <Text style={styles.sub}>Entre com a conta fornecida pela prefeitura.</Text>

        <View style={styles.form}>
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="username"
            autoComplete="email"
            returnKeyType="next"
            onSubmitEditing={() => senhaRef.current?.focus()}
            placeholder="nome@prefeitura.gov.br"
            placeholderTextColor={t.placeholder}
          />
          <Text style={styles.label}>Senha</Text>
          <TextInput
            ref={senhaRef}
            style={styles.input}
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            textContentType="password"
            autoComplete="password"
            returnKeyType="go"
            onSubmitEditing={entrar}
            placeholder="Sua senha"
            placeholderTextColor={t.placeholder}
          />
          {erro && (
            <Text style={styles.err} accessibilityLiveRegion="polite">
              {erro}
            </Text>
          )}
          <Button size="lg" label={enviando ? 'Entrando…' : 'Entrar'} onPress={entrar} disabled={enviando} />
        </View>
        {__DEV__ && <Text style={styles.dev}>Servidor: {API_URL}</Text>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    flex: { flex: 1, backgroundColor: t.bg },
    content: { paddingHorizontal: 24, gap: 8 },
    logo: { width: 64, height: 64, borderRadius: 20, backgroundColor: t.scheme === 'light' ? t.ink : t.chip, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    title: { fontSize: 34, fontWeight: '800', color: t.ink, letterSpacing: -1 },
    sub: { fontSize: 16, color: t.inkMuted, marginBottom: 20 },
    form: { gap: 8 },
    label: { fontSize: 14, fontWeight: '700', color: t.ink, marginTop: 8 },
    input: { height: 56, borderRadius: 14, backgroundColor: t.surface, borderWidth: 1.5, borderColor: t.border, paddingHorizontal: 16, fontSize: 17, color: t.ink },
    err: { fontSize: 14, fontWeight: '700', color: t.danger, marginVertical: 4 },
    dev: { marginTop: 24, fontSize: 12, color: t.inkMuted },
  });
