import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { cursosApi, mensajeError, tareasApi } from '../api';
import { Button, Chip, ESTADOS, Empty, ErrorMsg, Loading, PRIORIDADES, colors, s } from '../ui';
import TareaCard from '../components/TareaCard';
import TareaForm from '../components/TareaForm';

const POR_PAGINA = 10;
const VENCIMIENTOS = { proximas: 'Proximas (7d)', vencidas: 'Vencidas' };
const ORDENES = {
  'fecha_entrega:asc': 'Entrega cercana',
  'fecha_entrega:desc': 'Entrega lejana',
  'prioridad:asc': 'Prioridad',
  'creado_en:desc': 'Recientes',
};

// Fila horizontal de chips con opcion "Todos".
function FiltroFila({ titulo, opciones, valor, onChange }) {
  return (
    <View style={{ marginBottom: 6 }}>
      <Text style={[s.muted, { marginBottom: 4 }]}>{titulo}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Chip label="Todos" active={valor === ''} onPress={() => onChange('')} />
        {Object.entries(opciones).map(([k, v]) => <Chip key={k} label={v} active={String(valor) === k} onPress={() => onChange(k)} />)}
      </ScrollView>
    </View>
  );
}

export default function TareasScreen({ focused }) {
  const [filtros, setFiltros] = useState({ estado: '', prioridad: '', curso_id: '', vencimiento: '', orden: 'fecha_entrega:asc' });
  const [busqueda, setBusqueda] = useState('');
  const [busquedaAplicada, setBusquedaAplicada] = useState('');
  const [verFiltros, setVerFiltros] = useState(false);
  const [paginas, setPaginas] = useState(1);
  const [datos, setDatos] = useState(null);
  const [cursos, setCursos] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null);
  const [refrescando, setRefrescando] = useState(false);

  // Espera 300 ms tras escribir antes de buscar.
  useEffect(() => {
    const t = setTimeout(() => { setBusquedaAplicada(busqueda); setPaginas(1); }, 300);
    return () => clearTimeout(t);
  }, [busqueda]);

  const cargar = useCallback(async () => {
    setError('');
    const [orden, dir] = filtros.orden.split(':');
    try {
      const [t, c] = await Promise.all([
        tareasApi.listar({ ...filtros, orden, dir, busqueda: busquedaAplicada, limit: paginas * POR_PAGINA }),
        cursosApi.listar(),
      ]);
      setDatos(t);
      setCursos(c.cursos);
    } catch (e) { setError(mensajeError(e)); }
  }, [filtros, busquedaAplicada, paginas]);

  useEffect(() => { if (focused) cargar(); }, [focused, cargar]);

  const cambiarFiltro = (k) => (v) => { setPaginas(1); setFiltros({ ...filtros, [k]: v }); };
  const accion = (p) => p.then(cargar).catch((e) => setError(mensajeError(e)));
  const hayFiltros = filtros.estado || filtros.prioridad || filtros.curso_id || filtros.vencimiento || busquedaAplicada;
  const cursosOpciones = Object.fromEntries(cursos.map((c) => [String(c.id), c.nombre]));

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 16, paddingBottom: 8 }}>
        <View style={s.row}>
          <Text style={s.title}>Tareas</Text>
          <Button small kind="primary" title="+ Nueva" onPress={() => setForm({})} />
        </View>
        <View style={[s.row, { gap: 8 }]}>
          <TextInput style={[s.input, { flex: 1 }]} placeholder="Buscar por titulo..." placeholderTextColor="#9aa3b5" value={busqueda} onChangeText={setBusqueda} />
          <Button small title={verFiltros ? 'Ocultar' : 'Filtros'} onPress={() => setVerFiltros(!verFiltros)} />
        </View>
        {verFiltros && (
          <View style={{ marginTop: 10 }}>
            <FiltroFila titulo="Estado" opciones={ESTADOS} valor={filtros.estado} onChange={cambiarFiltro('estado')} />
            <FiltroFila titulo="Prioridad" opciones={PRIORIDADES} valor={filtros.prioridad} onChange={cambiarFiltro('prioridad')} />
            <FiltroFila titulo="Curso" opciones={cursosOpciones} valor={filtros.curso_id} onChange={cambiarFiltro('curso_id')} />
            <FiltroFila titulo="Fecha" opciones={VENCIMIENTOS} valor={filtros.vencimiento} onChange={cambiarFiltro('vencimiento')} />
            <Text style={[s.muted, { marginBottom: 4 }]}>Ordenar por</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {Object.entries(ORDENES).map(([k, v]) => <Chip key={k} label={v} active={filtros.orden === k} onPress={() => cambiarFiltro('orden')(k)} />)}
            </ScrollView>
          </View>
        )}
        <ErrorMsg>{error}</ErrorMsg>
      </View>
      {!datos && !error ? <Loading /> : (
        <FlatList
          data={datos?.tareas || []}
          keyExtractor={(t) => String(t.id)}
          contentContainerStyle={{ padding: 16, paddingTop: 4 }}
          ListEmptyComponent={<Empty>{hayFiltros ? 'Ninguna tarea coincide con los filtros.' : 'Aun no tiene tareas. Cree la primera.'}</Empty>}
          refreshControl={<RefreshControl refreshing={refrescando} onRefresh={async () => { setRefrescando(true); await cargar(); setRefrescando(false); }} />}
          renderItem={({ item }) => (
            <TareaCard
              tarea={item}
              onEstado={(t, estado) => accion(tareasApi.cambiarEstado(t.id, estado))}
              onEdit={setForm}
              onDelete={(t) => accion(tareasApi.eliminar(t.id))}
            />
          )}
          ListFooterComponent={datos && datos.tareas.length < datos.total ? (
            <Button title={`Cargar mas (${datos.tareas.length} de ${datos.total})`} onPress={() => setPaginas(paginas + 1)} />
          ) : null}
        />
      )}
      {form && <TareaForm tarea={form.id ? form : null} cursos={cursos} onClose={() => setForm(null)} onSaved={() => { setForm(null); cargar(); }} />}
    </View>
  );
}
