import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { cursosApi, mensajeError } from '../api';
import Icon from '../components/Icon';
import { BotonIcono, Button, EncabezadoPagina, ErrorMsg, Loading, Vacio, colors, confirmarEliminar, s } from '../ui';
import CursoForm from '../components/CursoForm';
import CursoDetalleScreen from './CursoDetalleScreen';

// Tarjeta de curso replicando el .curso del web. La zona superior abre el detalle;
// las acciones van aparte para no anidar botones.
function CursoCard({ curso: c, onVer, onEditar, onEliminar }) {
  return (
    <View style={[s.tarjeta, { padding: 0, overflow: 'hidden' }]}>
      <Pressable
        onPress={() => onVer(c)}
        accessibilityRole="button"
        accessibilityLabel={`Ver tareas de ${c.nombre}`}
        style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18 }, pressed && { backgroundColor: colors.grisClaro }]}
      >
        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.azulClaro, alignItems: 'center', justifyContent: 'center' }}>
          <Icon nombre="birrete" tamano={22} color={colors.primario} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.texto, letterSpacing: -0.2 }}>{c.nombre}</Text>
          {c.docente ? (
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primarioOscuro }} numberOfLines={1}>
              Docente: {c.docente}
            </Text>
          ) : null}
          {c.descripcion ? (
            <Text style={{ fontSize: 14, lineHeight: 20, color: colors.textoSuave, marginTop: 2 }} numberOfLines={2}>
              {c.descripcion}
            </Text>
          ) : null}
        </View>
        <Icon nombre="derecha" tamano={18} color={colors.placeholder} />
      </Pressable>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 18, paddingRight: 8, paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.grisClaro }}>
        <Icon nombre="tareas" tamano={15} color={colors.textoSuave} />
        <Text style={[s.tabular, { fontSize: 13, color: colors.textoSuave, flex: 1, marginLeft: 4 }]}>
          {c.total_tareas} {Number(c.total_tareas) === 1 ? 'tarea' : 'tareas'}
        </Text>
        <BotonIcono icono="editar" onPress={() => onEditar(c)} etiqueta="Editar curso" />
        <BotonIcono icono="borrar" onPress={() => onEliminar(c)} color={colors.rojo} fondoPresionado={colors.rojoClaro} etiqueta="Eliminar curso" />
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
    confirmarEliminar(
      'Eliminar curso',
      `Seguro que deseas eliminar el curso "${curso.nombre}"? Se eliminaran tambien sus tareas.`,
      async () => {
        try {
          await cursosApi.eliminar(curso.id);
          setCursos((actual) => actual.filter((c) => c.id !== curso.id));
        } catch (e) {
          setError(mensajeError(e));
        }
      },
    );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            tintColor={colors.primario}
            colors={[colors.primario]}
            onRefresh={async () => { setRefrescando(true); await cargar(); setRefrescando(false); }}
          />
        }
      >
        <EncabezadoPagina titulo="Mis cursos" subtitulo="Administra tus asignaturas y sus tareas">
          <Button title="Nuevo" icono="mas" small onPress={() => setForm({})} />
        </EncabezadoPagina>

        {error ? <ErrorMsg titulo="No se pudieron cargar los cursos">{error}</ErrorMsg> : null}

        {!cursos && !error ? (
          <Loading />
        ) : cursos && cursos.length === 0 ? (
          <View style={s.tarjeta}>
            <Vacio icono="birrete" titulo="Aun no tienes cursos" mensaje="Crea tu primer curso para empezar a registrar tareas.">
              <Button title="Crear curso" icono="mas" onPress={() => setForm({})} />
            </Vacio>
          </View>
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
