import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { cursosApi, mensajeError } from '../api';
import Icon from '../components/Icon';
import Degradado from '../components/Degradado';
import { Button, ErrorMsg, Loading, Presionable, Vacio, colors, gradienteCurso, s, sombraCoral } from '../ui';
import CursoForm from '../components/CursoForm';
import CursoDetalleScreen from './CursoDetalleScreen';

const ICONOS_CURSO = ['libroAbierto', 'birrete', 'documento', 'capas', 'rayo', 'panel'];

// Mosaico de curso con portada en degradado, icono grande translúcido, conteo de tareas y docente.
function CursoTile({ curso: c, indice, onVer }) {
  const total = Number(c.total_tareas) || 0;
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(indice, 8) * 70).springify().damping(15)} style={{ flex: 1 }}>
      <Presionable
        onPress={() => onVer(c)}
        accessibilityRole="button"
        accessibilityLabel={`Ver ${c.nombre}`}
        style={{ height: 210, borderRadius: 26, overflow: 'hidden', padding: 14, justifyContent: 'space-between' }}
      >
        <Degradado colores={gradienteCurso(c.id)} />
        <View style={{ position: 'absolute', right: -16, top: -8, opacity: 0.22, transform: [{ rotate: '-10deg' }] }}>
          <Icon nombre={ICONOS_CURSO[Math.abs(Number(c.id) || 0) % ICONOS_CURSO.length]} tamano={120} color="#fff" grosor={1.4} />
        </View>
        <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.24)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' }}>
          <Icon nombre={total ? 'tareas' : 'check'} tamano={12} color="#fff" grosor={2.6} />
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{total ? `${total} ${total === 1 ? 'tarea' : 'tareas'}` : 'Sin tareas'}</Text>
        </View>
        <View>
          <Text style={{ color: '#fff', fontSize: 19, lineHeight: 22, fontWeight: '800', letterSpacing: -0.5 }} numberOfLines={2}>
            {c.nombre}
          </Text>
          {c.docente ? (
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '700', marginTop: 3 }} numberOfLines={1}>
              {c.docente}
            </Text>
          ) : null}
        </View>
      </Presionable>
    </Animated.View>
  );
}

export default function CursosScreen({ focused }) {
  const [cursos, setCursos] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [refrescando, setRefrescando] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const cargar = useCallback(async () => {
    setError('');
    try {
      setCursos((await cursosApi.listar()).cursos);
    } catch (e) {
      setError(mensajeError(e));
    }
  }, []);

  useEffect(() => { if (focused) cargar(); }, [focused, cargar]);

  const texto = busqueda.trim().toLowerCase();
  const filtrados = (cursos ?? []).filter(
    (c) => !texto || c.nombre.toLowerCase().includes(texto) || (c.docente ?? '').toLowerCase().includes(texto),
  );
  const totalTareas = (cursos ?? []).reduce((suma, c) => suma + (Number(c.total_tareas) || 0), 0);

  // Agrupa en filas de dos para la cuadrícula.
  const filas = [];
  for (let i = 0; i < filtrados.length; i += 2) filas.push(filtrados.slice(i, i + 2));

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={s.paginaTitulo}>Mis cursos</Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textoSuave, marginTop: 2 }}>
              {cursos ? `${cursos.length} ${cursos.length === 1 ? 'curso' : 'cursos'} · ${totalTareas} tareas` : 'Cargando...'}
            </Text>
          </View>
          <Pressable
            onPress={() => setForm({})}
            accessibilityRole="button"
            accessibilityLabel="Nuevo curso"
            style={({ pressed }) => [{ width: 46, height: 46, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', transform: [{ scale: pressed ? 0.94 : 1 }] }, sombraCoral]}
          >
            <Degradado radio={16} />
            <Icon nombre="mas" tamano={24} color="#fff" grosor={2.6} />
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, borderRadius: 16, backgroundColor: colors.hundido, marginBottom: 16 }}>
          <Icon nombre="buscar" tamano={20} color={colors.textoSuave} />
          <TextInput
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar curso o docente"
            placeholderTextColor={colors.placeholder}
            style={{ flex: 1, minHeight: 48, fontSize: 15, fontWeight: '600', color: colors.texto }}
            returnKeyType="search"
          />
          {busqueda ? (
            <Pressable onPress={() => setBusqueda('')} hitSlop={10} accessibilityLabel="Limpiar búsqueda">
              <Icon nombre="cerrar" tamano={18} color={colors.textoSuave} />
            </Pressable>
          ) : null}
        </View>

        {error ? <ErrorMsg titulo="No se pudieron cargar los cursos">{error}</ErrorMsg> : null}

        {!cursos && !error ? (
          <Loading />
        ) : cursos && cursos.length === 0 ? (
          <View style={s.tarjeta}>
            <Vacio icono="birrete" titulo="Aún no tienes cursos" mensaje="Crea tu primer curso para empezar a registrar tareas.">
              <Button title="Crear curso" icono="mas" onPress={() => setForm({})} />
            </Vacio>
          </View>
        ) : filtrados.length === 0 && cursos ? (
          <Vacio icono="buscar" titulo="Sin resultados" mensaje={`No hay cursos que coincidan con "${busqueda}".`} />
        ) : (
          <View style={{ gap: 12 }}>
            {filas.map((fila, i) => (
              <View key={fila[0].id} style={{ flexDirection: 'row', gap: 12 }}>
                {fila.map((c, j) => (
                  <CursoTile key={c.id} curso={c} indice={i * 2 + j} onVer={setDetalle} />
                ))}
                {fila.length === 1 ? <View style={{ flex: 1 }} /> : null}
              </View>
            ))}
          </View>
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
