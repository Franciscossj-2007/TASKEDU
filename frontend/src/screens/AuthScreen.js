import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../auth';
import { colors, sombraCoral } from '../ui';
import Icon from '../components/Icon';
import Degradado from '../components/Degradado';
import MarcaTexto from '../components/MarcaTexto';

// Tarjetas inclinadas del collage superior (como publicaciones de tareas).
const COLLAGE = [
  { titulo: 'Ensayo de historia', etiqueta: 'Mañana', colores: ['#7a2a48', '#ff6b4a'], giro: -8, x: -92, y: 22, ancho: 140 },
  { titulo: 'Integrales', etiqueta: 'Cálculo II', colores: ['#e0a100', '#ffcf6e'], giro: 8, x: 92, y: 22, ancho: 140 },
  { titulo: 'Informe de laboratorio', etiqueta: 'Hoy · Alta', colores: ['#ff5470', '#ff6b4a', '#ffb020'], giro: 0, x: 0, y: 0, ancho: 156 },
];

function TarjetaCollage({ t, i }) {
  return (
    <Animated.View
      entering={ZoomIn.delay(120 + i * 110).springify().damping(13)}
      style={[
        styles.collageTarjeta,
        { width: t.ancho, transform: [{ translateX: t.x }, { translateY: t.y }, { rotate: `${t.giro}deg` }], zIndex: i },
      ]}
    >
      <Degradado colores={t.colores} />
      <View style={styles.collageChip}>
        <Text style={styles.collageChipTexto}>{t.etiqueta}</Text>
      </View>
      <View>
        <Text style={styles.collageTitulo} numberOfLines={2}>{t.titulo}</Text>
        <View style={styles.collageBarra}>
          <View style={[styles.collageRelleno, { width: `${40 + i * 20}%` }]} />
        </View>
      </View>
    </Animated.View>
  );
}

// Campo con etiqueta pequena dentro de la caja, al estilo de las apps sociales.
function Campo({ etiqueta, error, enfocado, derecha, ...props }) {
  return (
    <View style={{ gap: 6 }}>
      <View style={[styles.campo, enfocado && styles.campoEnfocado, error && styles.campoError]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.campoEtiqueta, enfocado && { color: colors.primario }, error && { color: colors.rojo }]}>{etiqueta}</Text>
          <TextInput placeholderTextColor={colors.placeholder} style={styles.campoEntrada} {...props} />
        </View>
        {derecha}
      </View>
      {error ? <Text style={styles.campoMensaje}>{error}</Text> : null}
    </View>
  );
}

export default function AuthScreen() {
  const { login, register } = useAuth();
  const insets = useSafeAreaInsets();
  const [modo, setModo] = useState('login'); // 'login' | 'registro'
  const [f, setF] = useState({ nombre: '', correo: '', password: '', confirmar: '' });
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [enfocado, setEnfocado] = useState(null);

  const esLogin = modo === 'login';

  function cambiarModo() {
    setModo(esLogin ? 'registro' : 'login');
    setErrores({});
    setErrorGeneral('');
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

  const foco = (campo) => ({ onFocus: () => setEnfocado(campo), onBlur: () => setEnfocado(null) });

  function validar() {
    const nuevos = {};
    if (!esLogin) {
      if (!f.nombre.trim()) nuevos.nombre = 'El nombre es obligatorio';
      if (!f.correo.trim()) {
        nuevos.correo = 'El correo es obligatorio';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.correo.trim())) {
        nuevos.correo = 'Ingresa un correo válido (ej. usuario@correo.com)';
      }
      if (f.password.length < 8) nuevos.password = 'Mínimo 8 caracteres';
      if (f.password.length > 72) nuevos.password = 'Máximo 72 caracteres';
      if (f.confirmar !== f.password) nuevos.confirmar = 'Las contraseñas no coinciden';
    } else {
      // En modo login se permite correo completo o nombre de usuario (ej. wilson, demo).
      if (!f.correo.trim()) nuevos.correo = 'El correo o usuario es obligatorio';
      if (!f.password) nuevos.password = 'La contraseña es obligatoria';
    }
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  }

  async function ingresar(datos) {
    setErrorGeneral('');
    setEnviando(true);
    // Normaliza el usuario: 'wilson' o '@wilson' -> wilson@taskedu.com
    let correoEnvio = datos.correo.trim();
    const limpio = correoEnvio.replace(/^@/, '').toLowerCase();
    if (limpio === 'wilson') correoEnvio = 'wilson@taskedu.com';
    if (limpio === 'demo') correoEnvio = 'demo@taskedu.com';
    try {
      if (!esLogin && datos === f) {
        await register({ nombre: f.nombre.trim(), correo: correoEnvio, password: f.password });
      } else {
        await login({ correo: correoEnvio, password: datos.password });
      }
    } catch (e) {
      setErrorGeneral(e.message || 'Error al conectar con el servidor. Verifica que el backend esté activo.');
      setEnviando(false);
    }
  }

  function enviar() {
    if (!validar()) return;
    ingresar(f);
  }

  function entrarConCuenta(correo, password) {
    const datos = { ...f, correo, password, confirmar: password };
    setF(datos);
    setErrores({});
    setModo('login');
    ingresar(datos);
  }

  const ojo = (
    <Pressable
      onPress={() => setMostrarPassword((v) => !v)}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      style={{ padding: 6 }}
    >
      <Icon nombre={mostrarPassword ? 'ojoCerrado' : 'ojo'} tamano={20} color={colors.textoSuave} />
    </Pressable>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.fondo }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brillos de fondo */}
        <View pointerEvents="none" style={[styles.brillo, { top: -120, right: -80, backgroundColor: 'rgba(255,176,32,0.22)' }]} />
        <View pointerEvents="none" style={[styles.brillo, { top: 20, left: -140, backgroundColor: 'rgba(255,84,112,0.14)' }]} />

        {/* Collage de tareas */}
        <View style={styles.collage}>
          {COLLAGE.map((t, i) => (
            <TarjetaCollage key={t.titulo} t={t} i={i} />
          ))}
        </View>

        <Animated.View entering={FadeInUp.delay(380).duration(500)} style={{ alignItems: 'center', marginTop: 18 }}>
          <MarcaTexto tamano={44} />
          <Text style={styles.lema}>
            {esLogin ? 'Tus tareas, como nunca las viste.' : 'Crea tu cuenta y organiza tu ciclo.'}
          </Text>
        </Animated.View>

        <Animated.View key={modo} entering={FadeInDown.delay(80).springify().damping(16)} style={styles.formulario}>
          {errorGeneral ? (
            <Animated.View entering={FadeIn} accessibilityRole="alert" style={styles.error}>
              <Icon nombre="alerta" tamano={18} color={colors.rojo} />
              <Text style={styles.errorTexto}>{errorGeneral}</Text>
            </Animated.View>
          ) : null}

          {!esLogin ? (
            <Campo
              etiqueta="Nombre completo"
              value={f.nombre}
              onChangeText={set('nombre')}
              placeholder="Ej. Wilson Duque"
              maxLength={100}
              enfocado={enfocado === 'nombre'}
              error={errores.nombre}
              {...foco('nombre')}
            />
          ) : null}

          <Campo
            etiqueta={esLogin ? 'Correo o usuario' : 'Correo'}
            value={f.correo}
            onChangeText={set('correo')}
            placeholder={esLogin ? 'demo@taskedu.com o wilson' : 'tucorreo@ejemplo.com'}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            enfocado={enfocado === 'correo'}
            error={errores.correo}
            {...foco('correo')}
          />

          <Campo
            etiqueta={esLogin ? 'Contraseña' : 'Contraseña (mínimo 8 caracteres)'}
            value={f.password}
            onChangeText={set('password')}
            placeholder="Tu contraseña"
            secureTextEntry={!mostrarPassword}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="go"
            onSubmitEditing={enviar}
            enfocado={enfocado === 'password'}
            error={errores.password}
            derecha={ojo}
            {...foco('password')}
          />

          {!esLogin ? (
            <Campo
              etiqueta="Confirmar contraseña"
              value={f.confirmar}
              onChangeText={set('confirmar')}
              placeholder="Repite tu contraseña"
              secureTextEntry={!mostrarPassword}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={enviar}
              enfocado={enfocado === 'confirmar'}
              error={errores.confirmar}
              {...foco('confirmar')}
            />
          ) : null}

          <Pressable
            onPress={enviar}
            disabled={enviando}
            accessibilityRole="button"
            style={({ pressed }) => [styles.boton, sombraCoral, pressed && { transform: [{ scale: 0.98 }] }, enviando && { opacity: 0.7 }]}
          >
            <Degradado radio={16} />
            {enviando ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.botonTexto}>Verificando...</Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.botonTexto}>{esLogin ? 'Iniciar sesión' : 'Crear mi cuenta'}</Text>
                <Icon nombre="flecha" tamano={18} color="#fff" grosor={2.4} />
              </View>
            )}
          </Pressable>

          {esLogin ? (
            <>
              <View style={styles.separador}>
                <View style={styles.linea} />
                <Text style={styles.separadorTexto}>o</Text>
                <View style={styles.linea} />
              </View>
              <Pressable
                onPress={() => entrarConCuenta('demo@taskedu.com', 'Demo1234')}
                disabled={enviando}
                accessibilityRole="button"
                style={({ pressed }) => [styles.botonSecundario, pressed && { backgroundColor: colors.grisClaro }]}
              >
                <Icon nombre="rayo" tamano={18} color={colors.primario} />
                <Text style={styles.botonSecundarioTexto}>Entrar con la cuenta demo</Text>
              </Pressable>
              <Pressable onPress={() => entrarConCuenta('wilson@taskedu.com', '12345')} disabled={enviando} hitSlop={8} style={{ alignSelf: 'center', padding: 4 }}>
                <Text style={styles.enlaceSuave}>
                  o usa la cuenta de <Text style={{ color: colors.primario, fontWeight: '800' }}>Wilson</Text>
                </Text>
              </Pressable>
            </>
          ) : null}
        </Animated.View>

        <View style={{ flex: 1 }} />
        <View style={[styles.pie, { paddingBottom: insets.bottom + 18 }]}>
          <Text style={styles.pieTexto}>{esLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}</Text>
          <Pressable onPress={cambiarModo} hitSlop={10} accessibilityRole="button">
            <Text style={styles.pieEnlace}>{esLogin ? 'Regístrate' : 'Inicia sesión'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  brillo: { position: 'absolute', width: 300, height: 300, borderRadius: 150 },
  collage: { height: 200, alignItems: 'center', justifyContent: 'center' },
  collageTarjeta: {
    position: 'absolute',
    height: 176,
    borderRadius: 24,
    overflow: 'hidden',
    padding: 12,
    justifyContent: 'space-between',
    shadowColor: '#8a3b1f',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  collageChip: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.25)' },
  collageChipTexto: { color: '#fff', fontSize: 10, fontWeight: '800' },
  collageTitulo: { color: '#fff', fontSize: 17, lineHeight: 20, fontWeight: '800', letterSpacing: -0.4, marginBottom: 10 },
  collageBarra: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.35)', overflow: 'hidden' },
  collageRelleno: { height: 4, borderRadius: 2, backgroundColor: '#fff' },
  lema: { fontSize: 14, fontWeight: '600', color: colors.textoSuave, marginTop: 2 },
  formulario: { paddingHorizontal: 24, paddingTop: 24, gap: 12 },
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.rojoClaro,
    borderColor: colors.rojoBorde,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  errorTexto: { color: '#b42325', fontSize: 13, fontWeight: '600', flex: 1 },
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 58,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borde,
    backgroundColor: colors.superficie,
  },
  campoEnfocado: {
    borderColor: colors.primario,
    borderWidth: 1.5,
    shadowColor: colors.primario,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  campoError: { borderColor: colors.rojo, backgroundColor: '#fffafa' },
  campoEtiqueta: { fontSize: 11, fontWeight: '700', color: colors.textoSuave },
  campoEntrada: { fontSize: 15, fontWeight: '600', color: colors.texto, paddingVertical: 2, paddingHorizontal: 0 },
  campoMensaje: { fontSize: 12, color: colors.rojo, fontWeight: '600', marginLeft: 4 },
  boton: {
    minHeight: 54,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  botonTexto: { color: '#fff', fontSize: 16, fontWeight: '800' },
  separador: { flexDirection: 'row', alignItems: 'center', gap: 14, marginVertical: 2 },
  linea: { flex: 1, height: 1, backgroundColor: '#e6d6c8' },
  separadorTexto: { fontSize: 13, fontWeight: '800', color: colors.placeholder },
  botonSecundario: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.borde,
    backgroundColor: colors.superficie,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  botonSecundarioTexto: { fontSize: 15, fontWeight: '800', color: colors.tinta },
  enlaceSuave: { fontSize: 13, color: colors.textoSuave, fontWeight: '600' },
  pie: {
    marginTop: 28,
    paddingTop: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: colors.borde,
    backgroundColor: colors.superficie,
  },
  pieTexto: { fontSize: 14, color: colors.textoSuave, fontWeight: '500' },
  pieEnlace: { fontSize: 14, color: colors.primario, fontWeight: '800' },
});
