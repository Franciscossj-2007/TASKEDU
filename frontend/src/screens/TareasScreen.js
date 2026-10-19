import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { cursosApi, mensajeError, tareasApi } from '../api';
import {
  Button,
  ErrorMsg,
  Field,
  Loading,
  OPCIONES_ESTADO,
  OPCIONES_PRIORIDAD,
  SelectCampo,
  Vacio,
  colors,
  s,
} from '../ui';
import TareaCard from '../components/TareaCard';
import TareaForm from '../components/TareaForm';

const LIMITE = 9;

const FILTROS_INICIALES = {
  busqueda: '',
  estado: '',
  prioridad: '',
  curso_id: '',
  vencimiento: '',
  orden: 'fecha_entrega',
  dir: 'asc',
};

const OPCIONES_VENCIMIENTO = [
  { valor: 'proximas', etiqueta: 'Proximas (7 dias)' },
  { valor: 'vencidas', etiqueta: 'Vencidas' },
];
const OPCIONES_ORDEN = [
  { valor: 'fecha_entrega', etiqueta: 'Fecha de entrega' },
  { valor: 'prioridad', etiqueta: 'Prioridad' },
  { valor: 'creado_en', etiqueta: 'Fecha de creacion' },
];
const OPCIONES_DIR = [
  { valor: 'asc', etiqueta: 'Ascendente' },
  { valor: 'desc', etiqueta: 'Descendente' },
];

export default function TareasScreen({ focused }) {
  const [cursos, setCursos] = useState([]);
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [busquedaDebounced, setBusquedaDebounced] = useState('');
  const [page, setPage] = useState(1);

  const [datos, setDatos] = useState({ tareas: [], total: 0 });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(null);
  const [recarga, setRecarga] = useState(0);
  const [refrescando, setRefrescando] = useState(false);

  useEffect(() => {
    let activo = true;
    cursosApi
      .listar()
      .then((res) => { if (activo) setCursos(res.cursos); })
      .catch(() => {});
    return () => { activo = false; };
  }, []);

  // Debounce de 400 ms igual al web.
  useEffect(() => {
    const id = setTimeout(() => {
      setBusquedaDebounced(filtros.busqueda);
      setPage(1);
    }, 400);
    return () => clearTimeout(id);
  }, [filtros.busqueda]);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const res = await tareasApi.listar({ ...filtros, busqueda: busquedaDebounced, page, limit: LIMITE });
      setDatos({ tareas: res.tareas, total: res.total });
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }, [filtros, busquedaDebounced, page, recarga]);

  useEffect(() => { if (focused) cargar(); }, [focused, cargar]);

  const totalPaginas = Math.max(1, Math.ceil(datos.total / LIMITE));
  const hayFiltros = Object.entries(filtros).some(([clave, valor]) => clave !== 'orden' && clave !== 'dir' && valor !== '');

  const cambiar = (campo) => (valor) => {
    setFiltros((actual) => ({ ...actual, [campo]: valor }));
    if (campo !== 'busqueda') setPage(1);
  };

  function limpiar() {
    setFiltros(FILTROS_INICIALES);
    setPage(1);
  }

  function abrirNueva() {
    setForm({});
  }

  async function cambiarEstado(tarea, estado) {
    try {
      const actualizada = await tareasApi.cambiarEstado(tarea.id, estado);
      setDatos((actual) => ({
        ...actual,
        tareas: actual.tareas.map((t) =>
          t.id === actualizada.id
            ? { ...t, ...actualizada, curso_nombre: t.curso_nombre }
            : t,
        ),
      }));
    } catch (e) {
      setError(mensajeError(e));
    }
  }

  async function eliminarTarea(tarea) {
    try {
      await tareasApi.eliminar(tarea.id);
      setRecarga((n) => n + 1);
    } catch (e) {
      setError(mensajeError(e));
    }
  }

  const opcionesCursos = cursos.map((c) => ({ valor: String(c.id), etiqueta: c.nombre }));

  return (
    <ScrollView
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refrescando}
          onRefresh={async () => { setRefrescando(true); await cargar(); setRefrescando(false); }}
        />
      }
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 18 }}>
        <View style={{ flex: 1 }}>
          <Text style={s.paginaTitulo}>Mis tareas</Text>
          <Text style={s.paginaSubtitulo}>Filtra, ordena y gestiona tus tareas academicas</Text>
        </View>
        <Button title="Nueva tarea" small onPress={abrirNueva} />
      </View>

      {cursos.length === 0 ? (
        <ErrorMsg tipo="info">Aun no tienes cursos. Crea un curso antes de registrar tareas.</ErrorMsg>
      ) : null}

      {/* Filtros (como .filtros del web) */}
      <View style={[s.tarjeta, { padding: 18, marginBottom: 18 }]}>
        <Field
          label="Buscar por titulo"
          value={filtros.busqueda}
          onChangeText={cambiar('busqueda')}
          placeholder="Escribe para buscar..."
        />
        <SelectCampo label="Estado" value={filtros.estado} opciones={OPCIONES_ESTADO} onChange={cambiar('estado')} placeholder="Todos" />
        <SelectCampo label="Prioridad" value={filtros.prioridad} opciones={OPCIONES_PRIORIDAD} onChange={cambiar('prioridad')} placeholder="Todas" />
        <SelectCampo label="Curso" value={filtros.curso_id} opciones={opcionesCursos} onChange={cambiar('curso_id')} placeholder="Todos" />
        <SelectCampo label="Vencimiento" value={filtros.vencimiento} opciones={OPCIONES_VENCIMIENTO} onChange={cambiar('vencimiento')} placeholder="Cualquiera" />
        <SelectCampo label="Ordenar por" value={filtros.orden} opciones={OPCIONES_ORDEN} onChange={cambiar('orden')} />
        <SelectCampo label="Direccion" value={filtros.dir} opciones={OPCIONES_DIR} onChange={cambiar('dir')} />
        {hayFiltros ? (
          <Button kind="fantasma" small title="Limpiar filtros" onPress={limpiar} />
        ) : null}
      </View>

      {error ? <ErrorMsg titulo="No se pudieron cargar las tareas">{error}</ErrorMsg> : null}

      {cargando ? (
        <Loading />
      ) : datos.tareas.length === 0 ? (
        <Vacio
          icono={hayFiltros ? '🔍' : '📝'}
          titulo={hayFiltros ? 'Sin resultados' : 'Aun no tienes tareas'}
          mensaje={
            hayFiltros
              ? 'Prueba ajustando o limpiando los filtros.'
              : 'Crea tu primera tarea para empezar a organizarte.'
          }
        >
          {hayFiltros ? (
            <Button kind="secundario" title="Limpiar filtros" onPress={limpiar} />
          ) : (
            <Button title="Crear tarea" onPress={abrirNueva} disabled={cursos.length === 0} />
          )}
        </Vacio>
      ) : (
        <>
          <Text style={{ fontSize: 13, color: colors.textoSuave, marginBottom: 10 }}>
            Mostrando {datos.tareas.length} de {datos.total} tareas
          </Text>
          {datos.tareas.map((t) => (
            <TareaCard
              key={t.id}
              tarea={t}
              onEstado={cambiarEstado}
              onEdit={setForm}
              onDelete={eliminarTarea}
            />
          ))}

          {totalPaginas > 1 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 8 }}>
              <Button kind="secundario" small title="Anterior" disabled={page <= 1} onPress={() => setPage((p) => Math.max(1, p - 1))} />
              <Text style={{ fontSize: 14, color: colors.textoSuave }}>
                Pagina {page} de {totalPaginas}
              </Text>
              <Button kind="secundario" small title="Siguiente" disabled={page >= totalPaginas} onPress={() => setPage((p) => Math.min(totalPaginas, p + 1))} />
            </View>
          ) : null}
        </>
      )}

      {form ? (
        <TareaForm
          tarea={form.id ? form : null}
          cursos={cursos}
          onClose={() => setForm(null)}
          onSaved={() => { setForm(null); setRecarga((n) => n + 1); }}
        />
      ) : null}
    </ScrollView>
  );
}
