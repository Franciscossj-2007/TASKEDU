import { useCallback, useEffect, useState } from 'react';
import { Modal, RefreshControl, ScrollView, Text, View } from 'react-native';
import { cursosApi, mensajeError, tareasApi } from '../api';
import { Button, Empty, ErrorMsg, Loading, colors, s } from '../ui';
import TareaCard from '../components/TareaCard';
import TareaForm from '../components/TareaForm';

// Detalle de un curso: informacion y tareas relacionadas.
export default function CursoDetalleScreen({ curso: cursoInicial, onClose }) {
  const [curso, setCurso] = useState(cursoInicial);
  const [tareas, setTareas] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null);
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(async () => {
    setError('');
    try {
      const [c, t] = await Promise.all([cursosApi.obtener(cursoInicial.id), cursosApi.tareas(cursoInicial.id)]);
      setCurso(c.curso);
      setTareas(t.tareas);
    } catch (e) { setError(mensajeError(e)); }
  }, [cursoInicial.id]);
  useEffect(() => { cargar(); }, [cargar]);

  const accion = (p) => p.then(cargar).catch((e) => setError(mensajeError(e)));

  return (
    <Modal animationType="slide" onRequestClose={onClose}>
      <ScrollView
        style={{ backgroundColor: colors.bg }}
        contentContainerStyle={{ padding: 16, paddingTop: 48 }}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={async () => { setRefrescando(true); await cargar(); setRefrescando(false); }} />}
      >
        <Button small title="< Volver a cursos" onPress={onClose} />
        <Text style={[s.title, { marginTop: 14 }]}>{curso.nombre}</Text>
        {curso.docente ? <Text style={s.muted}>Docente: {curso.docente}</Text> : null}
        {curso.descripcion ? <Text style={{ marginTop: 6, marginBottom: 6 }}>{curso.descripcion}</Text> : null}
        <View style={{ marginVertical: 12 }}>
          <Button kind="primary" title="+ Nueva tarea" onPress={() => setForm({})} />
        </View>
        <ErrorMsg>{error}</ErrorMsg>
        {!tareas && !error ? <Loading /> : tareas && (tareas.length === 0 ? <Empty>Este curso no tiene tareas.</Empty> : tareas.map((t) => (
          <TareaCard
            key={t.id}
            tarea={t}
            onEstado={(x, estado) => accion(tareasApi.cambiarEstado(x.id, estado))}
            onEdit={setForm}
            onDelete={(x) => accion(tareasApi.eliminar(x.id))}
          />
        )))}
      </ScrollView>
      {form && (
        <TareaForm
          tarea={form.id ? form : null}
          cursos={[curso]}
          cursoIdInicial={curso.id}
          onClose={() => setForm(null)}
          onSaved={() => { setForm(null); cargar(); }}
        />
      )}
    </Modal>
  );
}
