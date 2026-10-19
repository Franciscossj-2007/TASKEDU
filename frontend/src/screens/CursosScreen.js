import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Modal, RefreshControl, ScrollView, Text, View } from 'react-native';
import { cursosApi, mensajeError } from '../api';
import { Pressable } from 'react-native';
import CursoDetalleScreen from './CursoDetalleScreen';
import { Button, Empty, ErrorMsg, Field, Loading, colors, s } from '../ui';

function CursoForm({ curso, onClose, onSaved }) {
  const [f, setF] = useState({ nombre: curso?.nombre ?? '', docente: curso?.docente ?? '', descripcion: curso?.descripcion ?? '' });
  const [error, setError] = useState('');
  const set = (k) => (v) => setF({ ...f, [k]: v });

  const guardar = async () => {
    const body = { nombre: f.nombre, docente: f.docente || null, descripcion: f.descripcion || null };
    try {
      if (curso) await cursosApi.actualizar(curso.id, body); else await cursosApi.crear(body);
      onSaved();
    } catch (e) { setError(mensajeError(e)); }
  };

  return (
    <Modal animationType="slide" onRequestClose={onClose}>
      <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingTop: 48 }} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>{curso ? 'Editar curso' : 'Nuevo curso'}</Text>
        <ErrorMsg>{error}</ErrorMsg>
        <Field label="Nombre" value={f.nombre} onChangeText={set('nombre')} />
        <Field label="Docente" value={f.docente} onChangeText={set('docente')} />
        <Field label="Descripcion" value={f.descripcion} onChangeText={set('descripcion')} multiline />
        <Button kind="primary" title="Guardar" onPress={guardar} />
        <View style={{ height: 10 }} />
        <Button title="Cancelar" onPress={onClose} />
      </ScrollView>
    </Modal>
  );
}

export default function CursosScreen({ focused }) {
  const [cursos, setCursos] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(async () => {
    setError('');
    try { setCursos((await cursosApi.listar()).cursos); } catch (e) { setError(mensajeError(e)); }
  }, []);
  useEffect(() => { if (focused) cargar(); }, [focused, cargar]);

  const confirmarBorrar = (c) =>
    Alert.alert('Eliminar curso', `Eliminar "${c.nombre}"? Tambien se eliminaran sus tareas.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => cursosApi.eliminar(c.id).then(cargar).catch((e) => setError(mensajeError(e))) },
    ]);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 16, paddingBottom: 8 }}>
        <View style={s.row}>
          <Text style={s.title}>Cursos</Text>
          <Button small kind="primary" title="+ Nuevo" onPress={() => setForm({})} />
        </View>
        <ErrorMsg>{error}</ErrorMsg>
      </View>
      {!cursos && !error ? <Loading /> : (
        <FlatList
          data={cursos || []}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={{ padding: 16, paddingTop: 4 }}
          ListEmptyComponent={<Empty>Aun no tiene cursos.</Empty>}
          refreshControl={<RefreshControl refreshing={refrescando} onRefresh={async () => { setRefrescando(true); await cargar(); setRefrescando(false); }} />}
          renderItem={({ item: c }) => (
            <Pressable style={s.card} onPress={() => setDetalle(c)}>
              <Text style={s.h3}>{c.nombre}</Text>
              {c.docente ? <Text style={s.muted}>Docente: {c.docente}</Text> : null}
              <Text style={s.muted}>{c.total_tareas} tarea(s)</Text>
              {c.descripcion ? <Text style={{ marginTop: 6 }}>{c.descripcion}</Text> : null}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <Button small title="Editar" onPress={() => setForm(c)} />
                <Button small kind="danger" title="Eliminar" onPress={() => confirmarBorrar(c)} />
              </View>
            </Pressable>
          )}
        />
      )}
      {detalle && <CursoDetalleScreen curso={detalle} onClose={() => { setDetalle(null); cargar(); }} />}
      {form && <CursoForm curso={form.id ? form : null} onClose={() => setForm(null)} onSaved={() => { setForm(null); cargar(); }} />}
    </View>
  );
}
