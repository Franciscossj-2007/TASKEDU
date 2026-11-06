import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { cursosApi, mensajeError, tareasApi } from '../api';
import Icon from '../components/Icon';
import Degradado from '../components/Degradado';
import NumeroAnimado from '../components/NumeroAnimado';
import { AnilloHistoria, Button, ErrorMsg, Loading, Vacio, colors, confirmarEliminar, fechaCorta, gradienteCurso, iniciales, s } from '../ui';
import TareaCard, { OpcionesTarea } from '../components/TareaCard';
import TareaForm from '../components/TareaForm';
import CursoForm from '../components/CursoForm';

// Mosaico cuadrado de una tarea para la vista de cuadrícula (como las fotos de un perfil).
function MosaicoTarea({ tarea: t, indice, onPress }) {
  const completada = t.estado === 'completada';
  return (
    <Animated.View entering={ZoomIn.delay(Math.min(indice, 12) * 40).springify().damping(16)} style={{ width: '33.333%', padding: 1.5 }}>
      <Pressable onPress={() => onPress(t)} accessibilityRole="button" accessibilityLabel={t.titulo} style={({ pressed }) => ({ aspectRatio: 0.86, overflow: 'hidden', padding: 10, justifyContent: 'flex-end', opacity: pressed ? 0.85 : 1 })}>
        <Degradado colores={gradienteCurso(t.id)} />
        {completada ? <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(43,26,18,0.35)' }} /> : null}
        <View style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: completada ? 'rgba(255,255,255,0.92)' : t.vencida ? colors.rojo : 'rgba(255,255,255,0.25)' }}>
          <Icon nombre={completada ? 'check' : t.vencida ? 'alerta' : 'reloj'} tamano={13} color={completada ? colors.verde : '#fff'} grosor={2.8} />
        </View>
        <Text style={{ color: '#fff', fontSize: 13, lineHeight: 16, fontWeight: '800' }} numberOfLines={3}>{t.titulo}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: '700', marginTop: 3 }}>
          {completada ? 'Lista' : fechaCorta(t.fecha_entrega)}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// Detalle de un curso al estilo de un perfil: foto con anillo, números, descripción,
// acciones y las tareas en cuadrícula o en lista.
export default function CursoDetalleScreen({ curso: cursoInicial, onClose }) {
  const [curso, setCurso] = useState(cursoInicial);
  const [tareas, setTareas] = useState(null);
  const [error, setError] = useState('');
  const [formTarea, setFormTarea] = useState(null);
  const [formCurso, setFormCurso] = useState(false);
  const [refrescando, setRefrescando] = useState(false);
  const [vista, setVista] = useState('cuadricula');
  const [seleccionada, setSeleccionada] = useState(null);

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
      // El backend responde { tarea }; se acepta tambien la tarea directa por compatibilidad.
      const res = await tareasApi.cambiarEstado(tarea.id, estado);
      const actualizada = res?.tarea ?? res;
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
    confirmarEliminar('Eliminar curso', 'Se eliminará el curso y todas sus tareas. Esta acción no se puede deshacer.', async () => {
      try {
        await cursosApi.eliminar(cursoInicial.id);
        onClose();
      } catch (e) {
        setError(mensajeError(e));
      }
    });

  const lista = tareas ?? [];
  const completadas = lista.filter((t) => t.estado === 'completada').length;
  const pendientes = lista.length - completadas;
  const avance = lista.length ? Math.round((completadas / lista.length) * 100) : 0;
  const colores = gradienteCurso(cursoInicial.id);
  // Las tareas del curso llevan el id del curso para pintar su color en las filas.
  const conCurso = lista.map((t) => ({ ...t, curso_id: t.curso_id ?? cursoInicial.id, curso_nombre: curso?.nombre }));

  return (
    <Modal animationType="slide" onRequestClose={onClose}>
      <SafeAreaProvider>
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.fondo }}>
          {/* Barra superior */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4 }}>
            <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Volver a cursos" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <Icon nombre="atras" tamano={26} color={colors.tinta} grosor={2.4} />
            </Pressable>
            <Text style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: colors.tinta }} numberOfLines={1}>{curso?.nombre}</Text>
            <Pressable onPress={confirmarBorrarCurso} hitSlop={8} accessibilityRole="button" accessibilityLabel="Eliminar curso" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <Icon nombre="borrar" tamano={22} color={colors.rojo} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingBottom: 40 }}
            refreshControl={
              <RefreshControl
                refreshing={refrescando}
                tintColor={colors.primario}
                colors={[colors.primario]}
                onRefresh={async () => { setRefrescando(true); await cargar(); setRefrescando(false); }}
              />
            }
          >
            {/* Perfil del curso */}
            <Animated.View entering={FadeIn.duration(300)} style={{ flexDirection: 'row', alignItems: 'center', gap: 20, paddingHorizontal: 20, paddingTop: 8 }}>
              <AnilloHistoria tamano={96} activo={pendientes > 0}>
                <Degradado colores={colores} />
                <Text style={{ color: '#fff', fontSize: 30, fontWeight: '800' }}>{iniciales(curso?.nombre)}</Text>
              </AnilloHistoria>
              <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
                {[
                  [lista.length, 'Tareas', ''],
                  [pendientes, 'Pendientes', ''],
                  [avance, 'Avance', '%'],
                ].map(([valor, etiqueta, sufijo]) => (
                  <View key={etiqueta} style={{ alignItems: 'center' }}>
                    <NumeroAnimado valor={valor} sufijo={sufijo} style={{ fontSize: 21, fontWeight: '800', color: colors.tinta }} />
                    <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textoSuave }}>{etiqueta}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>

            <View style={{ paddingHorizontal: 20, paddingTop: 14, gap: 3 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: colors.tinta }}>{curso?.nombre}</Text>
              {curso?.docente ? <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primario }}>Docente: {curso.docente}</Text> : null}
              {curso?.descripcion ? <Text style={{ fontSize: 14, lineHeight: 20, color: colors.texto }}>{curso.descripcion}</Text> : null}
            </View>

            <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 16 }}>
              <View style={{ flex: 1 }}>
                <Button small bloque icono="mas" title="Nueva tarea" onPress={() => setFormTarea({})} />
              </View>
              <View style={{ flex: 1 }}>
                <Button small bloque kind="secundario" icono="editar" title="Editar curso" onPress={() => setFormCurso(true)} />
              </View>
            </View>

            {/* Pestañas cuadrícula / lista */}
            <View style={{ flexDirection: 'row', marginTop: 20, borderTopWidth: 1, borderTopColor: colors.borde }}>
              {[
                ['cuadricula', 'cuadricula', 'Ver en cuadrícula'],
                ['lista', 'lista', 'Ver en lista'],
              ].map(([valor, icono, etiqueta]) => {
                const activo = vista === valor;
                return (
                  <Pressable key={valor} onPress={() => setVista(valor)} accessibilityRole="tab" accessibilityLabel={etiqueta} accessibilityState={{ selected: activo }} style={{ flex: 1, alignItems: 'center', paddingTop: 12, gap: 10 }}>
                    <Icon nombre={icono} tamano={22} color={activo ? colors.tinta : colors.placeholder} grosor={activo ? 2.4 : 2} />
                    <View style={{ width: 64, height: 2, backgroundColor: activo ? colors.tinta : 'transparent' }} />
                  </Pressable>
                );
              })}
            </View>

            {error ? <View style={{ padding: 16 }}><ErrorMsg>{error}</ErrorMsg></View> : null}

            {!tareas && !error ? (
              <Loading />
            ) : lista.length === 0 ? (
              <View style={[s.tarjeta, { margin: 16 }]}>
                <Vacio icono="bandeja" titulo="Este curso no tiene tareas" mensaje="Crea la primera tarea de este curso.">
                  <Button title="Crear tarea" icono="mas" onPress={() => setFormTarea({})} />
                </Vacio>
              </View>
            ) : vista === 'cuadricula' ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingTop: 2 }}>
                {conCurso.map((t, i) => (
                  <MosaicoTarea key={t.id} tarea={t} indice={i} onPress={setSeleccionada} />
                ))}
              </View>
            ) : (
              <View style={{ padding: 16 }}>
                {conCurso.map((t, i) => (
                  <TareaCard key={t.id} tarea={t} indice={i} mostrarCurso={false} onEstado={cambiarEstado} onEdit={setFormTarea} onDelete={eliminarTarea} />
                ))}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>

      <OpcionesTarea
        tarea={seleccionada}
        visible={!!seleccionada}
        onCerrar={() => setSeleccionada(null)}
        onEstado={cambiarEstado}
        onEdit={setFormTarea}
        onDelete={eliminarTarea}
      />

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
