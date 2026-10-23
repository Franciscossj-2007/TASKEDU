import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { cursosApi, mensajeError, tareasApi } from '../api';
import Icon from '../components/Icon';
import {
  Button,
  EncabezadoPagina,
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
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

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
  // Filtros activos sin contar la busqueda (que siempre esta visible).
  const filtrosActivos = ['estado', 'prioridad', 'curso_id', 'vencimiento'].filter((c) => filtros[c] !== '').length;

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
      contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
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
      <EncabezadoPagina titulo="Mis tareas" subtitulo="Filtra, ordena y gestiona tus tareas academicas">
        <Button title="Nueva" icono="mas" small onPress={abrirNueva} />
      </EncabezadoPagina>

      {cursos.length === 0 ? (
        <ErrorMsg tipo="info">Aun no tienes cursos. Crea un curso antes de registrar tareas.</ErrorMsg>
      ) : null}

      {/* Busqueda siempre visible; el resto de filtros se pliega (como .filtros del web) */}
      <View style={[s.tarjeta, { padding: 14, marginBottom: 16 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Field
            style={{ flex: 1, marginBottom: 0 }}
            icono="buscar"
            value={filtros.busqueda}
            onChangeText={cambiar('busqueda')}
            placeholder="Buscar por titulo"
            accessibilityLabel="Buscar por titulo"
            returnKeyType="search"
          />
          <Pressable
            onPress={() => setFiltrosAbiertos((v) => !v)}
            accessibilityRole="button"
            accessibilityState={{ expanded: filtrosAbiertos }}
            accessibilityLabel="Mostrar filtros"
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              minHeight: 46,
              paddingHorizontal: 12,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: filtrosAbiertos || filtrosActivos ? colors.primarioBorde : colors.borde,
              backgroundColor: filtrosAbiertos || filtrosActivos || pressed ? colors.primarioClaro : colors.superficie,
            })}
          >
            <Icon nombre="filtro" tamano={17} color={filtrosAbiertos || filtrosActivos ? colors.primario : colors.textoSuave} />
            {filtrosActivos ? (
              <Text style={[s.tabular, { fontSize: 13, fontWeight: '700', color: colors.primario }]}>{filtrosActivos}</Text>
            ) : null}
          </Pressable>
        </View>

        {filtrosAbiertos ? (
          <View style={{ marginTop: 16 }}>
            <View style={s.fila}>
              <SelectCampo style={s.filaItem} label="Estado" value={filtros.estado} opciones={OPCIONES_ESTADO} onChange={cambiar('estado')} placeholder="Todos" />
              <SelectCampo style={s.filaItem} label="Prioridad" value={filtros.prioridad} opciones={OPCIONES_PRIORIDAD} onChange={cambiar('prioridad')} placeholder="Todas" />
            </View>
            <View style={s.fila}>
              <SelectCampo style={s.filaItem} label="Curso" value={filtros.curso_id} opciones={opcionesCursos} onChange={cambiar('curso_id')} placeholder="Todos" />
              <SelectCampo style={s.filaItem} label="Vencimiento" value={filtros.vencimiento} opciones={OPCIONES_VENCIMIENTO} onChange={cambiar('vencimiento')} placeholder="Cualquiera" />
            </View>
            <View style={s.fila}>
              <SelectCampo style={s.filaItem} label="Ordenar por" value={filtros.orden} opciones={OPCIONES_ORDEN} onChange={cambiar('orden')} />
              <SelectCampo style={s.filaItem} label="Direccion" value={filtros.dir} opciones={OPCIONES_DIR} onChange={cambiar('dir')} />
            </View>
          </View>
        ) : null}
        {hayFiltros ? (
          <View style={{ alignItems: 'flex-start', marginTop: filtrosAbiertos ? 0 : 10 }}>
            <Button kind="fantasma" small icono="cerrar" title="Limpiar filtros" onPress={limpiar} />
          </View>
        ) : null}
      </View>

      {error ? <ErrorMsg titulo="No se pudieron cargar las tareas">{error}</ErrorMsg> : null}

      {cargando ? (
        <Loading />
      ) : datos.tareas.length === 0 ? (
        <Vacio
          icono={hayFiltros ? 'buscar' : 'bandeja'}
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
            <Button title="Crear tarea" icono="mas" onPress={abrirNueva} disabled={cursos.length === 0} />
          )}
        </Vacio>
      ) : (
        <>
          <Text style={[s.tabular, { fontSize: 13, color: colors.textoSuave, marginBottom: 10 }]}>
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
              <Text style={[s.tabular, { fontSize: 14, color: colors.textoSuave }]}>
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
