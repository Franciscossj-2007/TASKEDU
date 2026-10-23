import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../auth';
import { colors } from '../ui';
import Icon from '../components/Icon';
import Logo from '../components/Logo';
import FondoAzul from '../components/FondoAzul';

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

export default function AuthScreen() {
  const { login, register } = useAuth();
  const insets = useSafeAreaInsets();
  const [modo, setModo] = useState('login'); // 'login' | 'registro'
  const [f, setF] = useState({ nombre: '', correo: '', password: '', confirmar: '' });
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // Animaciones del sistema
  const fadeHero = useRef(new Animated.Value(0)).current;
  const slideHero = useRef(new Animated.Value(-16)).current;
  const fadeCard = useRef(new Animated.Value(0)).current;
  const slideCard = useRef(new Animated.Value(30)).current;
  const formOpacity = useRef(new Animated.Value(1)).current;
  const formTranslateY = useRef(new Animated.Value(0)).current;
  const errorOpacity = useRef(new Animated.Value(0)).current;
  const errorTranslateY = useRef(new Animated.Value(-10)).current;

  // Animación de entrada inicial al montar la pantalla
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeHero, {
        toValue: 1,
        duration: 350,
        easing: EASE_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(slideHero, {
        toValue: 0,
        duration: 350,
        easing: EASE_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(fadeCard, {
        toValue: 1,
        duration: 400,
        delay: 80,
        easing: EASE_OUT,
        useNativeDriver: true,
      }),
      Animated.spring(slideCard, {
        toValue: 0,
        friction: 8,
        tension: 45,
        delay: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Animación cuando aparece un error
  useEffect(() => {
    if (errorGeneral) {
      errorOpacity.setValue(0);
      errorTranslateY.setValue(-12);
      Animated.parallel([
        Animated.timing(errorOpacity, {
          toValue: 1,
          duration: 220,
          easing: EASE_OUT,
          useNativeDriver: true,
        }),
        Animated.spring(errorTranslateY, {
          toValue: 0,
          friction: 6,
          tension: 70,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [errorGeneral]);

  // Transición suave entre Iniciar sesión y Crear cuenta
  function cambiarModo(nuevo) {
    if (modo === nuevo) return;

    Animated.timing(formOpacity, {
      toValue: 0,
      duration: 120,
      easing: EASE_OUT,
      useNativeDriver: true,
    }).start(() => {
      setModo(nuevo);
      setErrores({});
      setErrorGeneral('');
      formTranslateY.setValue(nuevo === 'registro' ? 12 : -12);

      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 200,
          easing: EASE_OUT,
          useNativeDriver: true,
        }),
        Animated.spring(formTranslateY, {
          toValue: 0,
          friction: 7,
          tension: 65,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }

  const set = (campo) => (valor) => {
    setF((actual) => ({ ...actual, [campo]: valor }));
    if (errores[campo]) {
      setErrores((prev) => {
        const copia = { ...prev };
        delete copia[campo];
        return copia;
      });
    }
  };

  function validar() {
    const nuevos = {};
    if (modo === 'registro') {
      if (!f.nombre.trim()) nuevos.nombre = 'El nombre es obligatorio';
      if (!f.correo.trim()) {
        nuevos.correo = 'El correo es obligatorio';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.correo.trim())) {
        nuevos.correo = 'Ingresa un correo valido (ej. usuario@correo.com)';
      }
      if (f.password.length < 8) nuevos.password = 'Minimo 8 caracteres';
      if (f.password.length > 72) nuevos.password = 'Maximo 72 caracteres';
      if (f.confirmar !== f.password) nuevos.confirmar = 'Las contrasenas no coinciden';
    } else {
      // En modo login: permite correo completo O nombre de usuario (ej. wilson, demo)
      if (!f.correo.trim()) {
        nuevos.correo = 'El correo o usuario es obligatorio';
      }
      if (!f.password) {
        nuevos.password = 'La contrasena es obligatoria';
      }
    }
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  }

  async function enviar() {
    setErrorGeneral('');
    if (!validar()) return;
    setEnviando(true);

    // Normaliza el usuario/correo: si escribe 'wilson' o '@wilson', lo convierte a wilson@taskedu.com
    let correoEnvio = f.correo.trim();
    const limpio = correoEnvio.replace(/^@/, '').toLowerCase();
    if (limpio === 'wilson') correoEnvio = 'wilson@taskedu.com';
    if (limpio === 'demo') correoEnvio = 'demo@taskedu.com';

    try {
      if (modo === 'registro') {
        await register({ nombre: f.nombre.trim(), correo: correoEnvio, password: f.password });
      } else {
        await login({ correo: correoEnvio, password: f.password });
      }
    } catch (e) {
      setErrorGeneral(e.message || 'Error al conectar con el servidor. Verifica que el backend este activo.');
      setEnviando(false);
    }
  }

  function llenarDemo() {
    setF({
      nombre: 'Estudiante Demo',
      correo: 'demo@taskedu.com',
      password: 'Demo1234',
      confirmar: 'Demo1234',
    });
    setErrores({});
    setErrorGeneral('');
  }

  function llenarWilson() {
    setF({
      nombre: 'Wilson',
      correo: 'wilson@taskedu.com',
      password: '12345',
      confirmar: '12345',
    });
    setErrores({});
    setErrorGeneral('');
  }

  // Icono a la izquierda del campo; se pinta azul mientras el campo tiene el foco.
  const iconoCampo = (campo, nombre) => (
    <View style={styles.inputIcono} pointerEvents="none">
      <Icon nombre={nombre} tamano={19} color={focusedField === campo ? colors.primario : colors.placeholder} />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.fondo }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 28 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Cabecera azul con logo, nombre y ventajas */}
        <Animated.View
          style={[
            styles.hero,
            {
              paddingTop: insets.top + 28,
              opacity: fadeHero,
              transform: [{ translateY: slideHero }],
            },
          ]}
        >
          <FondoAzul ola />

          <View style={styles.heroLogoAro}>
            <Logo tamano={68} />
          </View>
          <Text style={styles.heroTitulo}>
            Task<Text style={{ color: colors.acento }}>Edu</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            Organiza tus cursos, entregas y prioridades en un solo espacio limpio.
          </Text>

          <View style={styles.heroVentajas}>
            <View style={styles.heroVentaja}>
              <View style={styles.heroVentajaIcono}>
                <Icon nombre="campana" tamano={18} color="#ffffff" />
              </View>
              <Text style={styles.heroVentajaTexto}>Alertas de{'\n'}vencimiento</Text>
            </View>
            <View style={styles.heroDivisor} />
            <View style={styles.heroVentaja}>
              <View style={styles.heroVentajaIcono}>
                <Icon nombre="rayo" tamano={18} color="#ffffff" />
              </View>
              <Text style={styles.heroVentajaTexto}>Control de{'\n'}avance</Text>
            </View>
          </View>
        </Animated.View>

        {/* Tarjeta del formulario, sube sobre la cabecera */}
        <Animated.View
          style={[
            styles.cardContainer,
            {
              opacity: fadeCard,
              transform: [{ translateY: slideCard }],
            },
          ]}
        >
          {/* Selector de modo */}
          <View style={styles.segmentedControl}>
            {[
              { valor: 'login', texto: 'Iniciar sesión' },
              { valor: 'registro', texto: 'Crear cuenta' },
            ].map((op) => {
              const activo = modo === op.valor;
              return (
                <Pressable
                  key={op.valor}
                  onPress={() => cambiarModo(op.valor)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: activo }}
                  style={[styles.segmentedTab, activo && styles.segmentedTabActivo]}
                >
                  <Text style={[styles.segmentedText, activo && styles.segmentedTextActivo]}>{op.texto}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Contenido animado del Formulario en transición */}
          <Animated.View
            style={{
              opacity: formOpacity,
              transform: [{ translateY: formTranslateY }],
            }}
          >
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>
                {modo === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
              </Text>
              <Text style={styles.formSubtitle}>
                {modo === 'login'
                  ? 'Ingresa tus credenciales para acceder a tus tareas'
                  : 'Regístrate gratis para empezar a planificar tu ciclo'}
              </Text>
            </View>

            {errorGeneral ? (
              <Animated.View
                accessibilityRole="alert"
                style={[
                  styles.errorBanner,
                  {
                    opacity: errorOpacity,
                    transform: [{ translateY: errorTranslateY }],
                  },
                ]}
              >
                <Icon nombre="alerta" tamano={18} color={colors.rojo} />
                <Text style={styles.errorText}>{errorGeneral}</Text>
              </Animated.View>
            ) : null}

            <View style={styles.formBody}>
              {modo === 'registro' && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    Nombre completo <Text style={styles.fieldRequired}>*</Text>
                  </Text>
                  <View style={styles.inputFila}>
                    {iconoCampo('nombre', 'usuario')}
                    <TextInput
                      value={f.nombre}
                      onChangeText={set('nombre')}
                      onFocus={() => setFocusedField('nombre')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Ej. Wilson Duque"
                      placeholderTextColor={colors.placeholder}
                      maxLength={100}
                      style={[styles.input, focusedField === 'nombre' && styles.inputFocused, errores.nombre && styles.inputError]}
                    />
                  </View>
                  {errores.nombre ? <Text style={styles.fieldError}>{errores.nombre}</Text> : null}
                </View>
              )}

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  {modo === 'login' ? 'Correo o Usuario' : 'Correo'} <Text style={styles.fieldRequired}>*</Text>
                </Text>
                <View style={styles.inputFila}>
                  {iconoCampo('correo', 'correo')}
                  <TextInput
                    value={f.correo}
                    onChangeText={set('correo')}
                    onFocus={() => setFocusedField('correo')}
                    onBlur={() => setFocusedField(null)}
                    placeholder={modo === 'login' ? 'demo@taskedu.com o wilson' : 'tucorreo@ejemplo.com'}
                    placeholderTextColor={colors.placeholder}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                    style={[styles.input, focusedField === 'correo' && styles.inputFocused, errores.correo && styles.inputError]}
                  />
                </View>
                {errores.correo ? <Text style={styles.fieldError}>{errores.correo}</Text> : null}
              </View>

              <View style={styles.fieldGroup}>
                <View style={styles.passwordLabelRow}>
                  <Text style={styles.fieldLabel}>
                    Contraseña <Text style={styles.fieldRequired}>*</Text>
                  </Text>
                  {modo === 'registro' && <Text style={styles.fieldHint}>Mínimo 8 caracteres</Text>}
                </View>
                <View style={styles.inputFila}>
                  {iconoCampo('password', 'candado')}
                  <TextInput
                    value={f.password}
                    onChangeText={set('password')}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    onSubmitEditing={enviar}
                    returnKeyType="go"
                    placeholder="Tu contraseña"
                    placeholderTextColor={colors.placeholder}
                    secureTextEntry={!mostrarPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[
                      styles.input,
                      styles.passwordInput,
                      focusedField === 'password' && styles.inputFocused,
                      errores.password && styles.inputError,
                    ]}
                  />
                  <Pressable
                    onPress={() => setMostrarPassword((prev) => !prev)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    style={styles.showPasswordBtn}
                  >
                    <Icon nombre={mostrarPassword ? 'ojoCerrado' : 'ojo'} tamano={20} color={colors.textoSuave} />
                  </Pressable>
                </View>
                {errores.password ? <Text style={styles.fieldError}>{errores.password}</Text> : null}
              </View>

              {modo === 'registro' && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    Confirmar contraseña <Text style={styles.fieldRequired}>*</Text>
                  </Text>
                  <View style={styles.inputFila}>
                    {iconoCampo('confirmar', 'candado')}
                    <TextInput
                      value={f.confirmar}
                      onChangeText={set('confirmar')}
                      onFocus={() => setFocusedField('confirmar')}
                      onBlur={() => setFocusedField(null)}
                      onSubmitEditing={enviar}
                      returnKeyType="go"
                      placeholder="Repite tu contraseña"
                      placeholderTextColor={colors.placeholder}
                      secureTextEntry={!mostrarPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={[styles.input, focusedField === 'confirmar' && styles.inputFocused, errores.confirmar && styles.inputError]}
                    />
                  </View>
                  {errores.confirmar ? <Text style={styles.fieldError}>{errores.confirmar}</Text> : null}
                </View>
              )}

              <Pressable
                onPress={enviar}
                disabled={enviando}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.submitBtn,
                  pressed && styles.submitBtnPressed,
                  enviando && styles.submitBtnDisabled,
                ]}
              >
                {enviando ? (
                  <View style={styles.btnLoadingRow}>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text style={styles.submitBtnText}>Verificando...</Text>
                  </View>
                ) : (
                  <Text style={styles.submitBtnText}>
                    {modo === 'login' ? 'Iniciar sesión' : 'Crear mi cuenta'}
                  </Text>
                )}
              </Pressable>

              {/* Accesos rápidos de prueba */}
              {modo === 'login' ? (
                <View style={styles.demoBloque}>
                  <Text style={styles.demoTitulo}>Cuentas de prueba</Text>
                  <View style={styles.demoFila}>
                    <Pressable
                      onPress={llenarDemo}
                      accessibilityRole="button"
                      accessibilityLabel="Usar la cuenta demo"
                      style={({ pressed }) => [styles.demoBtn, pressed && styles.demoBtnPressed]}
                    >
                      <Icon nombre="rayo" tamano={16} color={colors.primario} />
                      <Text style={styles.demoBtnText}>Demo</Text>
                    </Pressable>
                    <Pressable
                      onPress={llenarWilson}
                      accessibilityRole="button"
                      accessibilityLabel="Usar la cuenta de Wilson"
                      style={({ pressed }) => [styles.demoBtn, pressed && styles.demoBtnPressed]}
                    >
                      <Icon nombre="usuario" tamano={16} color={colors.primario} />
                      <Text style={styles.demoBtnText}>Wilson</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </View>
          </Animated.View>
        </Animated.View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>TaskEdu · Sistema de Gestión de Tareas Académicas</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const sombraTarjeta = Platform.select({
  ios: { shadowColor: '#0b3a8f', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 24 },
  android: { elevation: 6 },
  default: { boxShadow: '0 12px 32px rgba(11, 58, 143, 0.12)' },
});

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingBottom: 64,
    paddingHorizontal: 24,
    overflow: 'hidden',
    backgroundColor: colors.primario,
  },
  // Aro claro alrededor del isotipo para separarlo del fondo azul.
  heroLogoAro: {
    padding: 5,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 14,
  },
  heroTitulo: {
    color: '#ffffff',
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1.2,
    marginBottom: 8,
  },
  heroSubtitle: {
    color: colors.sidebarTexto,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: 22,
  },
  heroVentajas: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  heroVentaja: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroVentajaIcono: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  heroVentajaTexto: {
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '500',
  },
  heroDivisor: {
    width: 1,
    height: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },

  /* Tarjeta del formulario */
  cardContainer: {
    backgroundColor: colors.superficie,
    marginHorizontal: 16,
    marginTop: -36,
    borderRadius: 24,
    padding: 22,
    ...sombraTarjeta,
  },

  /* Selector de modo */
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.primarioClaro,
    borderRadius: 14,
    padding: 4,
    marginBottom: 22,
  },
  segmentedTab: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  segmentedTabActivo: {
    backgroundColor: colors.primario,
  },
  segmentedText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.tinta,
  },
  segmentedTextActivo: {
    color: '#ffffff',
    fontWeight: '700',
  },

  formHeader: {
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.tinta,
    letterSpacing: -0.7,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    color: colors.textoSuave,
    lineHeight: 20,
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.rojoClaro,
    borderColor: colors.rojoBorde,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#be123c',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },

  formBody: {
    gap: 16,
  },
  fieldGroup: {
    gap: 7,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.tinta,
  },
  fieldRequired: {
    color: colors.rojo,
  },
  fieldHint: {
    fontSize: 12,
    color: colors.textoSuave,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputFila: {
    justifyContent: 'center',
  },
  inputIcono: {
    position: 'absolute',
    left: 15,
    zIndex: 1,
  },
  input: {
    width: '100%',
    minHeight: 52,
    backgroundColor: colors.superficie,
    borderWidth: 1.5,
    borderColor: colors.borde,
    borderRadius: 14,
    paddingVertical: 12,
    paddingLeft: 46,
    paddingRight: 14,
    fontSize: 15,
    color: colors.texto,
  },
  inputFocused: {
    borderColor: colors.primario,
    backgroundColor: '#fbfdff',
  },
  inputError: {
    borderColor: colors.rojo,
    backgroundColor: '#fffbfc',
  },
  passwordInput: {
    paddingRight: 52,
  },
  showPasswordBtn: {
    position: 'absolute',
    right: 4,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldError: {
    fontSize: 12,
    color: colors.rojo,
    fontWeight: '500',
  },

  submitBtn: {
    backgroundColor: colors.primario,
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    ...Platform.select({
      ios: {
        shadowColor: colors.primario,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
      default: { boxShadow: '0 6px 16px rgba(11, 102, 240, 0.32)' },
    }),
  },
  submitBtnPressed: {
    backgroundColor: colors.primarioOscuro,
    transform: [{ scale: 0.98 }],
  },
  submitBtnDisabled: {
    opacity: 0.65,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  btnLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  demoBloque: {
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  demoTitulo: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textoSuave,
  },
  demoFila: {
    flexDirection: 'row',
    gap: 10,
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: colors.primarioClaro,
    borderWidth: 1,
    borderColor: colors.primarioBorde,
  },
  demoBtnPressed: {
    backgroundColor: colors.primarioBorde,
  },
  demoBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primarioOscuro,
  },

  footer: {
    marginTop: 26,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.textoSuave,
  },
});
