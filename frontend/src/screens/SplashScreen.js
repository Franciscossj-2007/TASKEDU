import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import * as NativeSplash from 'expo-splash-screen';
import Logo from '../components/Logo';
import FondoAzul from '../components/FondoAzul';
import { colors } from '../ui';

// Mantiene el splash nativo hasta que esta pantalla pinta su primer frame,
// asi el cambio de nativo a JS no se nota (mismo fondo y mismo logo centrado).
NativeSplash.preventAutoHideAsync().catch(() => {});

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const TAMANO_LOGO = 96;
// Tiempo minimo en pantalla para que la marca se alcance a ver.
const MINIMO_MS = 1500;

// Pantalla de inicio con el logo de TaskEdu. Se muestra encima de la app
// mientras se restaura la sesion y luego se desvanece revelando el panel.
export default function SplashScreen({ listo, onFin }) {
  const reducido = useReducedMotion();
  const [minimoCumplido, setMinimoCumplido] = useState(false);
  const pintado = useRef(false);

  const logo = useSharedValue(0);
  const texto = useSharedValue(0);
  const salida = useSharedValue(1);

  useEffect(() => {
    const id = setTimeout(() => setMinimoCumplido(true), MINIMO_MS);
    return () => clearTimeout(id);
  }, []);

  function alPintar() {
    if (pintado.current) return;
    pintado.current = true;
    NativeSplash.hideAsync().catch(() => {});
    logo.set(withTiming(1, { duration: 600, easing: EASE_OUT }));
    texto.set(withDelay(180, withTiming(1, { duration: 500, easing: EASE_OUT })));
  }

  useEffect(() => {
    if (!listo || !minimoCumplido) return;
    salida.set(withTiming(0, { duration: 320, easing: EASE_OUT }));
    const id = setTimeout(onFin, 340);
    return () => clearTimeout(id);
  }, [listo, minimoCumplido]);

  // El logo arranca ya visible a escala 0.92 para empalmar con el splash nativo.
  const estiloLogo = useAnimatedStyle(() => ({
    transform: [{ scale: reducido ? 1 : 0.92 + logo.get() * 0.08 }],
  }));
  const estiloTexto = useAnimatedStyle(() => ({
    opacity: texto.get(),
    transform: [{ translateY: reducido ? 0 : (1 - texto.get()) * 10 }],
  }));
  const estiloSalida = useAnimatedStyle(() => ({
    opacity: salida.get(),
    transform: [{ scale: reducido ? 1 : 1 + (1 - salida.get()) * 0.04 }],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.fondo, estiloSalida]} onLayout={alPintar}>
      <FondoAzul />
      <Animated.View style={[styles.aro, estiloLogo]}>
        <Logo tamano={TAMANO_LOGO - 10} />
      </Animated.View>

      {/* El texto va posicionado bajo el logo para que este quede exactamente centrado. */}
      <Animated.View style={[styles.textos, estiloTexto]}>
        <Text style={styles.nombre}>
          Task<Text style={{ color: colors.acento }}>Edu</Text>
        </Text>
        <Text style={styles.lema}>Tus tareas académicas, en orden</Text>
      </Animated.View>

      <Animated.View style={[styles.pie, estiloTexto]}>
        <Text style={styles.pieTexto}>Sistema de Gestión de Tareas Académicas</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fondo: {
    backgroundColor: colors.primario,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  // Aro blanco translucido: separa el isotipo azul del fondo azul (igual que splash-icon.png).
  aro: {
    padding: 5,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  textos: {
    position: 'absolute',
    top: '50%',
    marginTop: TAMANO_LOGO / 2 + 22,
    alignItems: 'center',
    gap: 6,
  },
  nombre: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  lema: {
    color: colors.sidebarEnlace,
    fontSize: 15,
  },
  pie: {
    position: 'absolute',
    bottom: 48,
  },
  pieTexto: {
    color: colors.sidebarEnlace,
    fontSize: 12,
    letterSpacing: 0.2,
  },
});
