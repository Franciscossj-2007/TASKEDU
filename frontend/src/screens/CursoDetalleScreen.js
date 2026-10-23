import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { cursosApi, mensajeError, tareasApi } from '../api';
import Icon from '../components/Icon';
import { Button, ErrorMsg, Loading, Vacio, colors, confirmarEliminar, s } from '../ui';
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
    confirmarEliminar('Eliminar curso', 'Se eliminara el curso y todas sus tareas. Esta accion no se puede deshacer.', async () => {
      try {
        await cursosApi.eliminar(cursoInicial.id);
        onClose();
      } catch (e) {
        setError(mensajeError(e));
      }
    });

  return (
    <Modal animationType="slide" onRequestClose={onClose}>
      <SafeAreaProvider>
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.fondo }}>
          {/* Barra superior con volver */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4 }}>
            <Pressable
              onPress={onClose}
              hitSlop={6}
              accessibilityRole="button"
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 2,
                minHeight: 44,
                paddingHorizontal: 8,
                borderRadius: 10,
                backgroundColor: pressed ? colors.grisClaro : 'transparent',
              })}
            >
              <Icon nombre="atras" tamano={20} color={colors.primario} />
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.primario }}>Cursos</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={refrescando}
                tintColor={colors.primario}
                colors={[colors.primario]}
                onRefresh={async () => { setRefrescando(true); await cargar(); setRefrescando(false); }}
              />
            }
          >
            <Text style={s.paginaTitulo}>{curso?.nombre}</Text>
            {curso?.docente ? <Text style={s.paginaSubtitulo}>Docente: {curso.docente}</Text> : null}

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16, marginBottom: 18 }}>
              <Button small icono="mas" title="Nueva tarea" onPress={() => setFormTarea({})} />
              <Button kind="secundario" small icono="editar" title="Editar curso" onPress={() => setFormCurso(true)} />
              <Button kind="peligroSuave" small icono="borrar" title="Eliminar curso" onPress={confirmarBorrarCurso} />
            </View>

            {curso?.descripcion ? (
              <View style={[s.tarjeta, { padding: 16, marginBottom: 22 }]}>
                <Text style={{ fontSize: 14, lineHeight: 21, color: colors.textoSuave }}>{curso.descripcion}</Text>
              </View>
            ) : null}

            <Text style={[s.seccionTitulo, { marginBottom: 12 }]}>
              Tareas del curso <Text style={[s.tabular, { color: colors.textoSuave, fontWeight: '600' }]}>({tareas?.length ?? 0})</Text>
            </Text>

            {error ? <ErrorMsg>{error}</ErrorMsg> : null}

            {!tareas && !error ? (
              <Loading />
            ) : tareas && tareas.length === 0 ? (
              <View style={s.tarjeta}>
                <Vacio icono="bandeja" titulo="Este curso no tiene tareas" mensaje="Crea una tarea para este curso.">
                  <Button title="Crear tarea" icono="mas" onPress={() => setFormTarea({})} />
                </Vacio>
              </View>
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
        </SafeAreaView>
      </SafeAreaProvider>

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
