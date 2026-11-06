import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/auth';
import { AnilloHistoria, Avatar, Loading, colors, confirmarEliminar, s, sombraCoral } from './src/ui';
import Icon from './src/components/Icon';
import Degradado from './src/components/Degradado';
import AuthScreen from './src/screens/AuthScreen';
import SplashScreen from './src/screens/SplashScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import TareasScreen from './src/screens/TareasScreen';
import CursosScreen from './src/screens/CursosScreen';

const TABS = [
  { key: 'panel', label: 'Inicio', icono: 'inicio', Screen: DashboardScreen },
  { key: 'cursos', label: 'Cursos', icono: 'libroAbierto', Screen: CursosScreen },
  { key: 'tareas', label: 'Tareas', icono: 'listaCheck', Screen: TareasScreen },
];

// Boton de una pestana: icono (mas grueso y oscuro si esta activa) y un punto coral debajo.
function BotonTab({ activa, etiqueta, onPress, children }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={etiqueta}
      accessibilityState={{ selected: activa }}
      style={({ pressed }) => [s.tab, pressed && { opacity: 0.6 }]}
    >
      <View style={{ alignItems: 'center', gap: 5, minHeight: 44, justifyContent: 'center' }}>
        {children}
        <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: activa ? colors.primario : 'transparent' }} />
      </View>
    </Pressable>
  );
}

function Main() {
  const { usuario, cargando, logout } = useAuth();
  const [tab, setTab] = useState('panel');
  // Cada vez que se toca "+" se incrementa; la pantalla de tareas abre el formulario.
  const [pedirNueva, setPedirNueva] = useState(0);
  const [vencidas, setVencidas] = useState(0);
  const insets = useSafeAreaInsets();

  if (cargando) return <Loading />;
  if (!usuario) return <AuthScreen />;

  const confirmarSalir = () =>
    confirmarEliminar('Cerrar sesión', `Sesión iniciada como ${usuario.nombre} (${usuario.correo}). ¿Deseas cerrar sesión?`, logout, 'Cerrar sesión');

  const nuevaTarea = () => {
    setTab('tareas');
    setPedirNueva((n) => n + 1);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.fondo }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.fondo }} />

      <View style={{ flex: 1 }}>
        {/* Todas las pestañas permanecen montadas; "focused" indica cuál está activa. */}
        {TABS.map(({ key, Screen }) => (
          <View key={key} style={{ flex: 1, display: tab === key ? 'flex' : 'none' }}>
            <Screen
              focused={tab === key}
              pedirNueva={key === 'tareas' ? pedirNueva : undefined}
              vencidas={vencidas}
              onIrATareas={() => setTab('tareas')}
              onIrACursos={() => setTab('cursos')}
              onNuevaTarea={nuevaTarea}
              onResumen={(r) => setVencidas(Number(r.vencidas) || 0)}
            />
          </View>
        ))}
      </View>

      {/* Barra inferior: Inicio, Cursos, crear (+), Tareas y la foto del perfil (cerrar sesión). */}
      <View style={[s.tabbar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {TABS.slice(0, 2).map(({ key, label, icono }) => (
          <BotonTab key={key} activa={tab === key} etiqueta={label} onPress={() => setTab(key)}>
            <Icon nombre={icono} tamano={26} color={tab === key ? colors.tinta : colors.placeholder} grosor={tab === key ? 2.4 : 2} />
          </BotonTab>
        ))}
        <BotonTab activa={false} etiqueta="Nueva tarea" onPress={nuevaTarea}>
          <View style={[{ width: 50, height: 36, borderRadius: 13, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, sombraCoral]}>
            <Degradado radio={13} />
            <Icon nombre="mas" tamano={22} color="#fff" grosor={2.8} />
          </View>
        </BotonTab>
        {TABS.slice(2).map(({ key, label, icono }) => (
          <BotonTab key={key} activa={tab === key} etiqueta={label} onPress={() => setTab(key)}>
            <View>
              <Icon nombre={icono} tamano={26} color={tab === key ? colors.tinta : colors.placeholder} grosor={tab === key ? 2.4 : 2} />
              {vencidas ? <View style={s.campanaPunto} /> : null}
            </View>
          </BotonTab>
        ))}
        <BotonTab activa={false} etiqueta={`Cuenta de ${usuario.nombre}. Cerrar sesión`} onPress={confirmarSalir}>
          <AnilloHistoria tamano={32} grosor={1.5} fondo={colors.superficie}>
            <Avatar nombre={usuario.nombre} tamano={26} />
          </AnilloHistoria>
        </BotonTab>
      </View>
    </View>
  );
}

// Muestra la pantalla de inicio encima de la app hasta que la sesión termina
// de restaurarse; después la retira para revelar el contenido.
function Arranque() {
  const { cargando } = useAuth();
  const [splashVisible, setSplashVisible] = useState(true);

  return (
    <View style={{ flex: 1, backgroundColor: colors.fondo }}>
      <Main />
      {splashVisible ? <SplashScreen listo={!cargando} onFin={() => setSplashVisible(false)} /> : null}
      <StatusBar style={splashVisible ? 'light' : 'dark'} />
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
