import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, RefreshControl, ScrollView, Text, View } from 'react-native';
import { cursosApi, mensajeError, tareasApi } from '../api';
import { Button, ErrorMsg, Loading, Vacio, colors, s } from '../ui';
import TareaCard from '../components/TareaCard';
import TareaForm from '../components/TareaForm';
import CursoForm from '../components/CursoForm';

// Detalle de un curso replicando la pagina CursoDetalle del web:
// volver, titulo, docente, acciones (editar/eliminar curso, nueva tarea),
// descripcion en tarjeta y "Tareas del curso (N)".
export default function CursoDetalleScreen({ curso: cursoInicial, onClose }) {
  const [curso, setCurso] = useState(cursoInicial);
  const [tareas, setTareas] = useState(null);
  const [error, setError] = useState('');
  const [formTarea, setFormTarea] = useState(null);
  const [formCurso, setFormCurso] = useState(false);
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(async () => {
    setError('');
    try {
      const [c, t] = await Promise.all([cursosApi.obtener(cursoInicial.id), cursosApi.tareas(cursoInicial.id)]);
      setCurso(c.curso);
      setTareas(t.tareas);
    } catch (e) {
      setError(mensajeError(e));
    }
  }, [cursoInicial.id]);

  useEffect(() => { cargar(); }, [cargar]);

  async function cambiarEstado(tarea, estado) {
    try {
      const actualizada = await tareasApi.cambiarEstado(tarea.id, estado);
      setTareas((actual) => actual.map((t) => (t.id === actualizada.id ? { ...t, ...actualizada, curso_nombre: t.curso_nombre } : t)));
    } catch (e) {
      setError(mensajeError(e));
    }
  }

  async function eliminarTarea(tarea) {
    try {
      await tareasApi.eliminar(tarea.id);
      setTareas((actual) => actual.filter((t) => t.id !== tarea.id));
    } catch (e) {
      setError(mensajeError(e));
    }
  }

  const confirmarBorrarCurso = () =>
    Alert.alert('Eliminar curso', 'Se eliminara el curso y todas sus tareas. Esta accion no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await cursosApi.eliminar(cursoInicial.id);
            onClose();
          } catch (e) {
            setError(mensajeError(e));
          }
        },
      },
    ]);

  return (
    <Modal animationType="slide" onRequestClose={onClose}>
      <ScrollView
        style={{ backgroundColor: colors.fondo }}
        contentContainerStyle={{ padding: 20, paddingTop: 48, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={async () => { setRefrescando(true); await cargar(); setRefrescando(false); }} />
        }
      >
        <Button kind="fantasma" small title="← Volver a cursos" onPress={onClose} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginTop: 16, marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={s.paginaTitulo}>{curso?.nombre}</Text>
            {curso?.docente ? <Text style={s.paginaSubtitulo}>Docente: {curso.docente}</Text> : null}
          </View>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          <Button kind="secundario" small title="Editar curso" onPress={() => setFormCurso(true)} />
          <Button kind="peligro" small title="Eliminar curso" onPress={confirmarBorrarCurso} />
          <Button small title="Nueva tarea" onPress={() => setFormTarea({})} />
        </View>

        {curso?.descripcion ? (
          <View style={[s.tarjeta, { padding: 16, marginBottom: 18 }]}>
            <Text style={{ color: colors.textoSuave }}>{curso.descripcion}</Text>
          </View>
        ) : null}

        <Text style={{ fontSize: 17, fontWeight: '700', color: colors.texto, marginBottom: 12 }}>
          Tareas del curso ({tareas?.length ?? 0})
        </Text>

        {error ? <ErrorMsg>{error}</ErrorMsg> : null}

        {!tareas && !error ? (
          <Loading />
        ) : tareas && tareas.length === 0 ? (
          <Vacio icono="📝" titulo="Este curso no tiene tareas" mensaje="Crea una tarea para este curso.">
            <Button title="Crear tarea" onPress={() => setFormTarea({})} />
          </Vacio>
        ) : (
          tareas?.map((t) => (
            <TareaCard
              key={t.id}
              tarea={t}
              mostrarCurso={false}
              onEstado={cambiarEstado}
              onEdit={setFormTarea}
              onDelete={eliminarTarea}
            />
          ))
        )}
      </ScrollView>

      {formTarea ? (
        <TareaForm
          tarea={formTarea.id ? formTarea : null}
          cursos={curso ? [curso] : []}
          cursoIdInicial={curso?.id}
          onClose={() => setFormTarea(null)}
          onSaved={() => { setFormTarea(null); cargar(); }}
        />
      ) : null}

      {formCurso ? (
        <CursoForm
          curso={curso}
          onClose={() => setFormCurso(false)}
          onSaved={() => { setFormCurso(false); cargar(); }}
        />
      ) : null}
    </Modal>
  );
}
