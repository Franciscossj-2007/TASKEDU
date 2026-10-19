import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { cursosApi, mensajeError } from '../api';
import { Button, ErrorMsg, Loading, Vacio, colors, s } from '../ui';
import CursoForm from '../components/CursoForm';
import CursoDetalleScreen from './CursoDetalleScreen';

// Tarjeta de curso replicando el .curso del web.
function CursoCard({ curso: c, onVer, onEditar, onEliminar }) {
  return (
    <View style={[s.tarjeta, { padding: 20, gap: 8 }]}>
      <Pressable onPress={() => onVer(c)}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: colors.texto }}>{c.nombre}</Text>
      </Pressable>
      {c.docente ? (
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primarioOscuro }}>Docente: {c.docente}</Text>
      ) : null}
      {c.descripcion ? <Text style={{ fontSize: 14, color: colors.textoSuave }}>{c.descripcion}</Text> : null}
      <Text style={{ fontSize: 13, color: colors.textoSuave }}>{c.total_tareas} tarea(s)</Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.borde }}>
        <Button kind="secundario" small title="Ver tareas" onPress={() => onVer(c)} />
        <Pressable onPress={() => onEditar(c)} style={({ pressed }) => ({ marginLeft: 'auto', paddingVertical: 6, paddingHorizontal: 8, borderRadius: 6, backgroundColor: pressed ? colors.grisClaro : 'transparent' })} hitSlop={6}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textoSuave }}>Editar</Text>
        </Pressable>
        <Pressable onPress={() => onEliminar(c)} style={({ pressed }) => ({ paddingVertical: 6, paddingHorizontal: 8, borderRadius: 6, backgroundColor: pressed ? colors.rojoClaro : 'transparent' })} hitSlop={6}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.rojo }}>Eliminar</Text>
        </Pressable>
      </View>
    </View>
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
    try {
      setCursos((await cursosApi.listar()).cursos);
    } catch (e) {
      setError(mensajeError(e));
    }
  }, []);

  useEffect(() => { if (focused) cargar(); }, [focused, cargar]);

  const confirmarBorrar = (curso) =>
    Alert.alert('Eliminar curso', `Seguro que deseas eliminar el curso "${curso.nombre}"? Se eliminaran tambien sus tareas.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await cursosApi.eliminar(curso.id);
            setCursos((actual) => actual.filter((c) => c.id !== curso.id));
          } catch (e) {
            setError(mensajeError(e));
          }
        },
      },
    ]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={async () => { setRefrescando(true); await cargar(); setRefrescando(false); }} />
        }
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 18 }}>
          <View style={{ flex: 1 }}>
            <Text style={s.paginaTitulo}>Mis cursos</Text>
            <Text style={s.paginaSubtitulo}>Administra tus asignaturas y sus tareas</Text>
          </View>
          <Button title="Nuevo curso" small onPress={() => setForm({})} />
        </View>

        {error ? <ErrorMsg titulo="No se pudieron cargar los cursos">{error}</ErrorMsg> : null}

        {!cursos && !error ? (
          <Loading />
        ) : cursos && cursos.length === 0 ? (
          <Vacio icono="▦" titulo="Aun no tienes cursos" mensaje="Crea tu primer curso para empezar a registrar tareas.">
            <Button title="Crear curso" onPress={() => setForm({})} />
          </Vacio>
        ) : (
          cursos?.map((c) => (
            <CursoCard
              key={c.id}
              curso={c}
              onVer={setDetalle}
              onEditar={setForm}
              onEliminar={confirmarBorrar}
            />
          ))
        )}
      </ScrollView>

      {form ? (
        <CursoForm
          curso={form.id ? form : null}
          onClose={() => setForm(null)}
          onSaved={() => { setForm(null); cargar(); }}
        />
      ) : null}

      {detalle ? (
        <CursoDetalleScreen curso={detalle} onClose={() => { setDetalle(null); cargar(); }} />
      ) : null}
    </View>
  );
}
