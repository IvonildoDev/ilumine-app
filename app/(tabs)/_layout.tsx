import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { useTheme } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

export default function TabLayout() {
  const theme = useTheme();
  const { access } = useAuth();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.scheme === 'light' ? theme.ink : theme.accent,
        tabBarInactiveTintColor: theme.inkMuted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
        tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.border },
      }}>
      <Tabs.Protected guard={access.registrar}>
        <Tabs.Screen name="index" options={{ title: 'Registrar', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'add-circle' : 'add-circle-outline'} size={26} color={color} /> }} />
      </Tabs.Protected>
      <Tabs.Protected guard={access.ordens}>
        <Tabs.Screen name="relatorio" options={{ title: 'Ordens', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'clipboard' : 'clipboard-outline'} size={26} color={color} /> }} />
      </Tabs.Protected>
      <Tabs.Protected guard={access.rota}>
        <Tabs.Screen name="rota" options={{ title: 'Minha rota', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'navigate-circle' : 'navigate-circle-outline'} size={26} color={color} /> }} />
      </Tabs.Protected>
    </Tabs>
  );
}
