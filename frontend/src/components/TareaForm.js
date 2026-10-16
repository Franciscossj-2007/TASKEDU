import { useState } from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';
import { mensajeError, tareasApi } from '../api';
import { Button, Chip, ESTADOS, Empty, ErrorMsg, Field, PRIORIDADES, colors, isoATexto, s, textoAIso } from '../ui';

// Formulario modal para crear o editar una tarea.
export default function TareaForm({ tarea, cursos, cursoIdInicial, onClose, onSaved }) {
  const [f, setF] = useState({
    curso_id: tarea?.curso_id ?? cursoIdInicial ?? cursos[0]?.id,
    titulo: tarea?.titulo ?? '',
    descripcion: tarea?.descripcion ?? '',
    fecha: tarea ? isoATexto(tarea.fecha_entrega) : isoATexto(new Date(Date.now() + 86400000).toISOString()),
    prioridad: tarea?.prioridad ?? 'media',
    estado: tarea?.estado ?? 'pendiente',
  });
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const set = (k) => (v) => setF({ ...f, [k]: v });

  const guardar = async () => {
    const fecha_entrega = textoAIso(f.fecha);
    if (!fecha_entrega) return setError('La fecha debe tener el formato AAAA-MM-DD HH:MM');
    const body = {
      curso_id: f.curso_id, titulo: f.titulo, descripcion: f.descripcion || null,
      fecha_entrega, prioridad: f.prioridad, estado: f.estado,
    };
    setGuardando(true);
    try {
      if (tarea) await tareasApi.actualizar(tarea.id, body); else await tareasApi.crear(body);
      onSaved();
    } catch (e) {
      setError(mensajeError(e));
      setGuardando(false);
    }
  };

  return (
    <Modal animationType="slide" onRequestClose={onClose}>
      <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingTop: 48 }} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>{tarea ? 'Editar tarea' : 'Nueva tarea'}</Text>
        <ErrorMsg>{error}</ErrorMsg>
        {cursos.length === 0 ? <Empty>Primero debe crear un curso.</Empty> : (
          <>
            <Text style={s.label}>Curso</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {cursos.map((c) => <Chip key={c.id} label={c.nombre} active={f.curso_id === c.id} onPress={() => set('curso_id')(c.id)} />)}
            </View>
            <Field label="Titulo" value={f.titulo} onChangeText={set('titulo')} maxLength={150} />
            <Field label="Descripcion" value={f.descripcion} onChangeText={set('descripcion')} multiline />
            <Field label="Fecha de entrega (AAAA-MM-DD HH:MM)" value={f.fecha} onChangeText={set('fecha')} autoCapitalize="none" />
            <Text style={s.label}>Prioridad</Text>
            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              {Object.entries(PRIORIDADES).map(([k, v]) => <Chip key={k} label={v} active={f.prioridad === k} onPress={() => set('prioridad')(k)} />)}
            </View>
            <Text style={s.label}>Estado</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
              {Object.entries(ESTADOS).map(([k, v]) => <Chip key={k} label={v} active={f.estado === k} onPress={() => set('estado')(k)} />)}
            </View>
            <Button kind="primary" title={guardando ? 'Guardando...' : 'Guardar'} onPress={guardar} disabled={guardando} />
            <View style={{ height: 10 }} />
          </>
        )}
        <Button title="Cancelar" onPress={onClose} />
      </ScrollView>
    </Modal>
  );
}
