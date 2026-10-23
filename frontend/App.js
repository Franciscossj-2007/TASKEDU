import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/auth';
import { Avatar, Loading, Marca, colors, confirmarEliminar, s } from './src/ui';
import Icon from './src/components/Icon';
import AuthScreen from './src/screens/AuthScreen';
import SplashScreen from './src/screens/SplashScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import TareasScreen from './src/screens/TareasScreen';
import CursosScreen from './src/screens/CursosScreen';

const TABS = [
  { key: 'panel', label: 'Panel', icono: 'panel', Screen: DashboardScreen },
  { key: 'tareas', label: 'Tareas', icono: 'tareas', Screen: TareasScreen },
  { key: 'cursos', label: 'Cursos', icono: 'birrete', Screen: CursosScreen },
];

function Main() {
  const { usuario, cargando, logout } = useAuth();
  const [tab, setTab] = useState('panel');
  // Tareas vencidas segun el ultimo resumen del panel; enciende el punto de la campana.
  const [vencidas, setVencidas] = useState(0);
  const insets = useSafeAreaInsets();

  if (cargando) return <Loading />;
  if (!usuario) return <AuthScreen />;

  const confirmarSalir = () =>
    confirmarEliminar('Cerrar sesion', `Sesion iniciada como ${usuario.nombre} (${usuario.correo}). Deseas cerrar sesion?`, logout, 'Cerrar sesion');

  return (
    <View style={{ flex: 1, backgroundColor: colors.fondo }}>
      {/* Cabecera blanca con marca, avatar (cerrar sesion) y campana de vencidas */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.superficie }}>
        <View style={s.header}>
          <Marca />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Pressable
              onPress={confirmarSalir}
              hitSlop={4}
              accessibilityRole="button"
              accessibilityLabel={`Cuenta de ${usuario.nombre}. Cerrar sesion`}
              style={({ pressed }) => pressed && { opacity: 0.7 }}
            >
              <Avatar nombre={usuario.nombre} tamano={42} />
            </Pressable>
            <Pressable
              onPress={() => setTab('tareas')}
              hitSlop={4}
              accessibilityRole="button"
              accessibilityLabel={vencidas ? `${vencidas} tareas vencidas. Ver tareas` : 'Ver tareas'}
              style={({ pressed }) => [s.botonIcono, { width: 44, height: 44 }, pressed && { backgroundColor: colors.grisClaro }]}
            >
              <Icon nombre="campana" tamano={23} color={colors.tinta} />
              {vencidas ? <View style={s.campanaPunto} /> : null}
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <View style={{ flex: 1 }}>
        {/* Todas las pestañas permanecen montadas; "focused" indica cual esta activa. */}
        {TABS.map(({ key, Screen }) => (
          <View key={key} style={{ flex: 1, display: tab === key ? 'flex' : 'none' }}>
            <Screen
              focused={tab === key}
              onIrATareas={() => setTab('tareas')}
              onIrACursos={() => setTab('cursos')}
              onResumen={(r) => setVencidas(Number(r.vencidas) || 0)}
            />
          </View>
        ))}
      </View>

      {/* Barra inferior blanca; la pestaña activa lleva una pastilla celeste. */}
      <View style={[s.tabbar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {TABS.map(({ key, label, icono }) => {
          const activa = tab === key;
          const color = activa ? colors.primario : colors.textoSuave;
          return (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: activa }}
              style={s.tab}
            >
              <View style={[s.tabPastilla, activa && s.tabPastillaActiva]}>
                <Icon nombre={icono} tamano={22} color={color} relleno={activa && key === 'panel'} />
                <Text style={{ fontSize: 13, fontWeight: activa ? '700' : '500', color }}>{label}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// Muestra la pantalla de inicio con el logo encima de la app hasta que la
// sesion termina de restaurarse; despues la retira para revelar el panel.
function Arranque() {
  const { cargando, usuario } = useAuth();
  const [splashVisible, setSplashVisible] = useState(true);
  // Barra de estado clara sobre fondos indigo (inicio y acceso), oscura sobre la app.
  const barraClara = splashVisible || !usuario;

  return (
    <View style={{ flex: 1, backgroundColor: colors.sidebar }}>
      <Main />
      {splashVisible ? <SplashScreen listo={!cargando} onFin={() => setSplashVisible(false)} /> : null}
      <StatusBar style={barraClara ? 'light' : 'dark'} />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Arranque />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
