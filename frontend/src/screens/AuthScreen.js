import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useAuth } from '../auth';
import { Button, ErrorMsg, Field, colors, s } from '../ui';

// Pantalla de acceso replicando el AuthLayout del frontend web:
// panel de marca arriba (gradiente simulado con el color primario) y
// el formulario de login/registro debajo.
export default function AuthScreen() {
  const { login, register } = useAuth();
  const [modo, setModo] = useState('login');
  const [f, setF] = useState({ nombre: '', correo: '', password: '', confirmar: '' });
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [enviando, setEnviando] = useState(false);

  const set = (campo) => (valor) => setF((actual) => ({ ...actual, [campo]: valor }));

  function validar() {
    const nuevos = {};
    if (modo === 'registro' && !f.nombre.trim()) nuevos.nombre = 'El nombre es obligatorio';
    if (!f.correo.trim()) nuevos.correo = 'El correo es obligatorio';
    if (modo === 'login') {
      if (!f.password) nuevos.password = 'La contrasena es obligatoria';
    } else {
      if (f.password.length < 8) nuevos.password = 'Minimo 8 caracteres';
      if (f.password.length > 72) nuevos.password = 'Maximo 72 caracteres';
      if (f.confirmar !== f.password) nuevos.confirmar = 'Las contrasenas no coinciden';
    }
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  }

  async function enviar() {
    setErrorGeneral('');
    if (!validar()) return;
    setEnviando(true);
    try {
      if (modo === 'registro') {
        await register({ nombre: f.nombre.trim(), correo: f.correo.trim(), password: f.password });
      } else {
        await login({ correo: f.correo.trim(), password: f.password });
      }
    } catch (e) {
      setErrorGeneral(e.message || 'Error inesperado');
      setErrores({});
      setEnviando(false);
    }
  }

  function cambiarModo(nuevo) {
    setModo(nuevo);
    setErrores({});
    setErrorGeneral('');
    setF({ nombre: '', correo: '', password: '', confirmar: '' });
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.fondo }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {/* Panel de marca (como .auth-layout__marca del web) */}
        <View style={s.authMarca}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 24 }}>✓</Text>
            </View>
            <Text style={{ fontWeight: '700', fontSize: 22, color: '#fff', letterSpacing: -0.4 }}>TaskEdu</Text>
          </View>
          <Text style={s.authTitulo}>Organiza tus tareas academicas</Text>
          <Text style={s.authTexto}>
            Registra tus cursos, controla fechas de entrega, define prioridades y sigue tu progreso desde un solo
            lugar.
          </Text>
          <View style={{ gap: 10 }}>
            {[
              'Panel con estadisticas de tu avance',
              'Filtros por curso, estado, prioridad y vencimiento',
              'Detecta tareas vencidas y proximas entregas',
            ].map((item) => (
              <View key={item} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>✓</Text>
                <Text style={{ color: '#fff', fontSize: 14, opacity: 0.9, flex: 1 }}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Formulario (como .auth-form del web) */}
        <View style={{ paddingHorizontal: 24, paddingTop: 28 }}>
          <Text style={{ fontSize: 26, fontWeight: '700', color: colors.texto }}>
            {modo === 'login' ? 'Iniciar sesion' : 'Crear cuenta'}
          </Text>
          <Text style={{ color: colors.textoSuave, marginTop: 4, marginBottom: 26 }}>
            {modo === 'login' ? 'Bienvenido de nuevo a TaskEdu' : 'Empieza a organizar tus tareas'}
          </Text>

          <ErrorMsg>{errorGeneral}</ErrorMsg>

          {modo === 'registro' && (
            <Field
              label="Nombre completo"
              requerido
              value={f.nombre}
              onChangeText={set('nombre')}
              error={errores.nombre}
              maxLength={100}
              placeholder="Tu nombre"
            />
          )}
          <Field
            label="Correo electronico"
            requerido
            value={f.correo}
            onChangeText={set('correo')}
            error={errores.correo}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="tucorreo@ejemplo.com"
          />
          <Field
            label="Contrasena"
            requerido
            value={f.password}
            onChangeText={set('password')}
            error={errores.password}
            ayuda={modo === 'registro' ? 'Entre 8 y 72 caracteres' : undefined}
            secureTextEntry
            autoCapitalize="none"
            placeholder="Tu contrasena"
          />
          {modo === 'registro' && (
            <Field
              label="Confirmar contrasena"
              requerido
              value={f.confirmar}
              onChangeText={set('confirmar')}
              error={errores.confirmar}
              secureTextEntry
              autoCapitalize="none"
            />
          )}

          <Button title={modo === 'login' ? 'Entrar' : 'Crear cuenta'} bloque cargando={enviando} onPress={enviar} />

          <Pressable onPress={() => cambiarModo(modo === 'login' ? 'registro' : 'login')} style={{ marginTop: 22 }}>
            <Text style={{ textAlign: 'center', color: colors.textoSuave, fontSize: 14 }}>
              {modo === 'login' ? 'No tienes cuenta? ' : 'Ya tienes cuenta? '}
              <Text style={{ color: colors.primario, fontWeight: '700' }}>
                {modo === 'login' ? 'Registrate' : 'Inicia sesion'}
              </Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
