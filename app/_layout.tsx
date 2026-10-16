import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useTheme } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/lib/auth';
import { ReportsProvider } from '@/lib/store';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <AuthProvider>
      <ReportsProvider>
        <RootLayoutNav />
      </ReportsProvider>
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const t = useTheme();
  const { user, loading } = useAuth();
  const base = t.scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: { ...base.colors, background: t.bg, card: t.surface, text: t.ink, border: t.border, primary: t.ink },
  };
  if (loading) return null;
  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Protected guard={!!user}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="scanner" options={{ presentation: 'modal', title: 'Escanear plaqueta' }} />
          <Stack.Screen name="ocorrencia/[id]" options={{ title: 'Ordem de serviço' }} />
          <Stack.Screen name="ocorrencia/concluir" options={{ presentation: 'modal', title: 'Concluir OS' }} />
        </Stack.Protected>
        <Stack.Protected guard={!user}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
