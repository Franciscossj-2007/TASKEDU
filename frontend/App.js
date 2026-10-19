import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/auth';
import { colors, Loading } from './src/ui';
import AuthScreen from './src/screens/AuthScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import TareasScreen from './src/screens/TareasScreen';
import CursosScreen from './src/screens/CursosScreen';

const TABS = [
  { key: 'panel', label: 'Panel', Screen: DashboardScreen },
  { key: 'tareas', label: 'Tareas', Screen: TareasScreen },
  { key: 'cursos', label: 'Cursos', Screen: CursosScreen },
];

function Main() {
  const { usuario, cargando, logout } = useAuth();
  const [tab, setTab] = useState('panel');

  if (cargando) return <Loading />;
  if (!usuario) return <AuthScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 18 }}>TaskEdu</Text>
        <Pressable onPress={logout}><Text style={{ color: colors.muted }}>{usuario.nombre} · Salir</Text></Pressable>
      </View>
      <View style={{ flex: 1 }}>
        {/* Todas las pestañas permanecen montadas; "focused" indica cual esta activa. */}
        {TABS.map(({ key, Screen }) => (
          <View key={key} style={{ flex: 1, display: tab === key ? 'flex' : 'none' }}>
            <Screen focused={tab === key} />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border }}>
        {TABS.map(({ key, label }) => (
          <Pressable key={key} onPress={() => setTab(key)} style={{ flex: 1, alignItems: 'center', paddingVertical: 14 }}>
            <Text style={{ color: tab === key ? colors.primary : colors.muted, fontWeight: tab === key ? '700' : '400' }}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Main />
        <StatusBar style="dark" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
