import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useAuth } from '../auth';
import { mensajeError } from '../api';
import { Button, ErrorMsg, Field, colors, s } from '../ui';

export default function AuthScreen() {
  const { login, register } = useAuth();
  const [registro, setRegistro] = useState(false);
  const [f, setF] = useState({ nombre: '', correo: '', password: '', confirmar: '' });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const set = (k) => (v) => setF({ ...f, [k]: v });

  const enviar = async () => {
    setError('');
    if (registro && f.password !== f.confirmar) return setError('Las contrasenas no coinciden');
    setEnviando(true);
    try {
      if (registro) await register({ nombre: f.nombre, correo: f.correo, password: f.password });
      else await login({ correo: f.correo, password: f.password });
    } catch (e) {
      setError(mensajeError(e));
      setEnviando(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }} keyboardShouldPersistTaps="handled">
        <Text style={[s.title, { textAlign: 'center', color: colors.primary, fontSize: 30 }]}>TaskEdu</Text>
        <Text style={[s.muted, { textAlign: 'center', marginBottom: 20 }]}>
          {registro ? 'Cree su cuenta' : 'Inicie sesion para gestionar sus tareas'}
        </Text>
        <ErrorMsg>{error}</ErrorMsg>
        {registro && <Field label="Nombre" value={f.nombre} onChangeText={set('nombre')} />}
        <Field label="Correo" value={f.correo} onChangeText={set('correo')} autoCapitalize="none" keyboardType="email-address" />
        <Field label="Contrasena" value={f.password} onChangeText={set('password')} secureTextEntry autoCapitalize="none" />
        {registro && <Field label="Confirmar contrasena" value={f.confirmar} onChangeText={set('confirmar')} secureTextEntry autoCapitalize="none" />}
        <Button kind="primary" title={enviando ? 'Enviando...' : registro ? 'Registrarse' : 'Entrar'} onPress={enviar} disabled={enviando} />
        <View style={{ height: 12 }} />
        <Button title={registro ? 'Ya tengo cuenta' : 'Crear cuenta'} onPress={() => { setError(''); setRegistro(!registro); }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
