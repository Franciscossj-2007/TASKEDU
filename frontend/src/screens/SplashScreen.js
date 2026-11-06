import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as NativeSplash from 'expo-splash-screen';
import Logo from '../components/Logo';
import FondoAzul from '../components/FondoAzul';
import Icon from '../components/Icon';
import MarcaTexto from '../components/MarcaTexto';

// Mantiene el splash nativo hasta que esta pantalla pinta su primer frame.
NativeSplash.preventAutoHideAsync().catch(() => {});

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const TAMANO_LOGO = 104;
// Tiempo minimo en pantalla para que la marca se alcance a ver.
const MINIMO_MS = 1800;

// Tarjeta de vidrio que aparece con rebote y luego flota suavemente.
function Flotante({ retraso, giro, style, children }) {
  const reducido = useReducedMotion();
  const entrada = useSharedValue(0);
  const flote = useSharedValue(0);

  useEffect(() => {
    entrada.value = withDelay(retraso, withSpring(1, { damping: 12, stiffness: 120 }));
    if (!reducido) {
      flote.value = withDelay(
        retraso + 400,
        withRepeat(withSequence(withTiming(-8, { duration: 1600, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.sin) })), -1),
      );
    }
  }, []);

  const estilo = useAnimatedStyle(() => ({
    opacity: entrada.value,
    transform: [{ translateY: flote.value + (1 - entrada.value) * 24 }, { scale: 0.85 + entrada.value * 0.15 }, { rotate: `${giro}deg` }],
  }));

  return <Animated.View style={[styles.flotante, style, estilo]}>{children}</Animated.View>;
}

// Pantalla de inicio con el degradado Atardecer. Se muestra encima de la app
// mientras se restaura la sesion y luego se desvanece revelando el contenido.
export default function SplashScreen({ listo, onFin }) {
  const reducido = useReducedMotion();
  const [minimoCumplido, setMinimoCumplido] = useState(false);
  const pintado = useRef(false);

  const logo = useSharedValue(0);
  const texto = useSharedValue(0);
  const salida = useSharedValue(1);
  const carga = useSharedValue(0);

  useEffect(() => {
    const id = setTimeout(() => setMinimoCumplido(true), MINIMO_MS);
    return () => clearTimeout(id);
  }, []);

  function alPintar() {
    if (pintado.current) return;
    pintado.current = true;
    NativeSplash.hideAsync().catch(() => {});
    logo.value = withSpring(1, { damping: 10, stiffness: 140 });
    texto.value = withDelay(220, withTiming(1, { duration: 520, easing: EASE_OUT }));
    carga.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }), -1, true);
  }

  useEffect(() => {
    if (!listo || !minimoCumplido) return;
    salida.value = withTiming(0, { duration: 340, easing: EASE_OUT });
    const id = setTimeout(onFin, 360);
    return () => clearTimeout(id);
  }, [listo, minimoCumplido]);

  const estiloLogo = useAnimatedStyle(() => ({
    transform: [{ scale: reducido ? 1 : 0.6 + logo.value * 0.4 }, { rotate: `${(1 - logo.value) * -12}deg` }],
  }));
  const estiloTexto = useAnimatedStyle(() => ({
    opacity: texto.value,
    transform: [{ translateY: reducido ? 0 : (1 - texto.value) * 14 }],
  }));
  const estiloSalida = useAnimatedStyle(() => ({
    opacity: salida.value,
    transform: [{ scale: reducido ? 1 : 1 + (1 - salida.value) * 0.05 }],
  }));
  const estiloCarga = useAnimatedStyle(() => ({ width: 18 + carga.value * 26 }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.fondo, estiloSalida]} onLayout={alPintar}>
      <FondoAzul />

      <Flotante retraso={350} giro={-7} style={{ top: '17%', left: 24 }}>
        <View style={[styles.cuadro, { backgroundColor: '#2a9d8f' }]}>
          <Icon nombre="check" tamano={16} color="#fff" grosor={3} />
        </View>
        <View>
          <Text style={styles.flotanteTitulo}>Informe entregado</Text>
          <Text style={styles.flotanteTexto}>Física II · hace 2 min</Text>
        </View>
      </Flotante>
      <Flotante retraso={520} giro={6} style={{ top: '27%', right: 22, borderRadius: 999 }}>
        <Icon nombre="llama" tamano={16} color="#fff" />
        <Text style={styles.flotanteTitulo}>Racha de 5 días</Text>
      </Flotante>
      <Flotante retraso={680} giro={5} style={{ bottom: '20%', left: 28, borderRadius: 999 }}>
        <Icon nombre="reloj" tamano={16} color="#fff" />
        <Text style={styles.flotanteTitulo}>Ensayo · mañana</Text>
      </Flotante>

      <Animated.View style={[styles.logo, estiloLogo]}>
        <Logo tamano={TAMANO_LOGO - 8} blanco />
      </Animated.View>

      <Animated.View style={[styles.textos, estiloTexto]}>
        <MarcaTexto tamano={46} blanco />
        <Text style={styles.lema}>Tus tareas, como nunca las viste.</Text>
      </Animated.View>

      <Animated.View style={[styles.pie, estiloTexto]}>
        <Animated.View style={[styles.carga, estiloCarga]} />
        <Text style={styles.pieTexto}>Sistema de Gestión de Tareas Académicas</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fondo: {
    backgroundColor: '#ff6b4a',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  logo: {
    width: TAMANO_LOGO,
    height: TAMANO_LOGO,
    borderRadius: 34,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#9b2c1a',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 18 },
    elevation: 12,
  },
  textos: {
    position: 'absolute',
    top: '50%',
    marginTop: TAMANO_LOGO / 2 + 18,
    alignItems: 'center',
    gap: 2,
  },
  lema: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '600',
  },
  flotante: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  cuadro: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flotanteTitulo: { color: '#fff', fontSize: 13, fontWeight: '800' },
  flotanteTexto: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600' },
  pie: {
    position: 'absolute',
    bottom: 48,
    alignItems: 'center',
    gap: 14,
  },
  carga: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  pieTexto: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    letterSpacing: 0.2,
  },
});
