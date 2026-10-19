import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/auth';
import { Avatar, Loading, colors, s } from './src/ui';
import AuthScreen from './src/screens/AuthScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import TareasScreen from './src/screens/TareasScreen';
import CursosScreen from './src/screens/CursosScreen';

// Pestañas con los mismos iconos que el sidebar del web.
const TABS = [
  { key: 'panel', label: 'Panel', icono: '▤', Screen: DashboardScreen },
  { key: 'tareas', label: 'Tareas', icono: '✎', Screen: TareasScreen },
  { key: 'cursos', label: 'Cursos', icono: '▦', Screen: CursosScreen },
];

function Main() {
  const { usuario, cargando, logout } = useAuth();
  const [tab, setTab] = useState('panel');

  if (cargando) return <Loading />;
  if (!usuario) return <AuthScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.fondo }}>
      {/* Cabecera blanca con marca, usuario y salir */}
      <View style={s.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={s.logo}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 18 }}>✓</Text>
          </View>
          <Text style={{ fontWeight: '700', fontSize: 18, color: colors.texto, letterSpacing: -0.4 }}>TaskEdu</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontWeight: '600', fontSize: 13, color: colors.texto }} numberOfLines={1}>
              {usuario.nombre}
            </Text>
            <Text style={{ fontSize: 11, color: colors.textoSuave }} numberOfLines={1}>
              {usuario.correo}
            </Text>
          </View>
          <Avatar nombre={usuario.nombre} />
          <Pressable onPress={logout} hitSlop={8}>
            <Text style={{ color: colors.primario, fontWeight: '700', fontSize: 13 }}>Salir</Text>
          </Pressable>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {/* Todas las pestañas permanecen montadas; "focused" indica cual esta activa. */}
        {TABS.map(({ key, Screen }) => (
          <View key={key} style={{ flex: 1, display: tab === key ? 'flex' : 'none' }}>
            <Screen focused={tab === key} onIrATareas={() => setTab('tareas')} onIrACursos={() => setTab('cursos')} />
          </View>
        ))}
      </View>

      {/* Barra inferior oscura estilo sidebar (#1e1b4b) */}
      <View style={s.tabbar}>
        {TABS.map(({ key, label, icono }) => {
          const activa = tab === key;
          return (
            <Pressable key={key} onPress={() => setTab(key)} style={[s.tab, activa && s.tabActivo]}>
              <Text style={{ fontSize: 16, color: activa ? '#fff' : colors.sidebarEnlace }}>{icono}</Text>
              <Text style={{ fontSize: 12, fontWeight: activa ? '700' : '600', color: activa ? '#fff' : colors.sidebarEnlace }}>
                {label}
              </Text>
            </Pressable>
          );
        })}
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
