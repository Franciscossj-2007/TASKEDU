import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { cursosApi, dashboardApi, mensajeError, tareasApi } from '../api';
import Icon from '../components/Icon';
import Degradado from '../components/Degradado';
import {
  Button,
  Chip,
  ErrorMsg,
  Loading,
  OPCIONES_PRIORIDAD,
  SelectCampo,
  Vacio,
  colors,
  diasRestantes,
  s,
  sombraCoral,
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

// Pastillas rápidas: cada una fija estado y/o vencimiento.
const RAPIDOS = [
  { clave: 'todas', etiqueta: 'Todas', estado: '', vencimiento: '', conteo: 'total' },
  { clave: 'pendiente', etiqueta: 'Pendientes', estado: 'pendiente', vencimiento: '', conteo: 'pendientes' },
  { clave: 'en_progreso', etiqueta: 'En progreso', estado: 'en_progreso', vencimiento: '', conteo: 'en_progreso' },
  { clave: 'proximas', etiqueta: 'Próximas 7 días', estado: '', vencimiento: 'proximas', conteo: 'proximas' },
  { clave: 'vencidas', etiqueta: 'Vencidas', estado: '', vencimiento: 'vencidas', conteo: 'vencidas', alerta: true },
  { clave: 'completada', etiqueta: 'Completadas', estado: 'completada', vencimiento: '', conteo: 'completadas' },
];

const OPCIONES_ORDEN = [
  { valor: 'fecha_entrega', etiqueta: 'Fecha de entrega' },
  { valor: 'prioridad', etiqueta: 'Prioridad' },
  { valor: 'creado_en', etiqueta: 'Fecha de creación' },
];
const OPCIONES_DIR = [
  { valor: 'asc', etiqueta: 'Ascendente' },
  { valor: 'desc', etiqueta: 'Descendente' },
];
const DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

// Tira de la semana actual: el día de hoy con degradado y puntos según las entregas de la página.
function Semana({ tareas }) {
  const hoy = new Date();
  const lunes = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - ((hoy.getDay() + 6) % 7));
  const dias = DIAS.map((letra, i) => {
    const fecha = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + i);
    const cantidad = tareas.filter((t) => {
      const f = new Date(t.fecha_entrega);
      return f.getFullYear() === fecha.getFullYear() && f.getMonth() === fecha.getMonth() && f.getDate() === fecha.getDate();
    }).length;
    return { letra, numero: fecha.getDate(), esHoy: fecha.toDateString() === hoy.toDateString(), cantidad };
  });
  return (
    <View style={[s.tarjeta, { flexDirection: 'row', justifyContent: 'space-between', padding: 8, marginBottom: 14 }]}>
      {dias.map((d, i) => (
        <View
          key={i}
          style={[
            { width: 42, paddingVertical: 10, borderRadius: 16, alignItems: 'center', gap: 4, overflow: 'hidden' },
            d.esHoy && sombraCoral,
          ]}
        >
          {d.esHoy ? <Degradado radio={16} /> : null}
          <Text style={{ fontSize: 11, fontWeight: '700', color: d.esHoy ? '#fff' : colors.textoSuave }}>{d.letra}</Text>
          <Text style={{ fontSize: 17, fontWeight: '800', color: d.esHoy ? '#fff' : colors.tinta, fontVariant: ['tabular-nums'] }}>{d.numero}</Text>
          <View style={{ flexDirection: 'row', gap: 3, height: 5 }}>
            {Array.from({ length: Math.min(d.cantidad, 3) }).map((_, k) => (
              <View key={k} style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: d.esHoy ? '#fff' : colors.primario }} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

// Agrupa las tareas por cercanía de la entrega (solo cuando se ordena por fecha).
function agrupar(tareas) {
  const grupos = [
    { titulo: 'Vencidas', alerta: true, items: [] },
    { titulo: 'Hoy', items: [] },
    { titulo: 'Esta semana', items: [] },
    { titulo: 'Más adelante', items: [] },
    { titulo: 'Completadas', items: [] },
  ];
  for (const t of tareas) {
    const dias = diasRestantes(t.fecha_entrega);
    if (t.estado === 'completada') grupos[4].items.push(t);
    else if (t.vencida) grupos[0].items.push(t);
    else if (dias === 0) grupos[1].items.push(t);
    else if (dias !== null && dias <= 7) grupos[2].items.push(t);
    else grupos[3].items.push(t);
  }
  return grupos.filter((g) => g.items.length);
}

export default function TareasScreen({ focused, pedirNueva }) {
  const [cursos, setCursos] = useState([]);
  const [conteos, setConteos] = useState({});
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
  const ultimaPeticion = useRef(pedirNueva);

  // Cursos (para el formulario y el filtro) y conteos por estado (para las pastillas).
  const cargarApoyo = useCallback(() => {
    cursosApi.listar().then((res) => setCursos(res.cursos)).catch(() => {});
    dashboardApi.resumen().then((res) => setConteos(res.resumen ?? {})).catch(() => {});
  }, []);

  useEffect(() => { if (focused) cargarApoyo(); }, [focused, recarga]);

  // El botón "+" de la barra inferior pide abrir el formulario de nueva tarea.
  useEffect(() => {
    if (pedirNueva && pedirNueva !== ultimaPeticion.current) {
      ultimaPeticion.current = pedirNueva;
      setForm({});
    }
  }, [pedirNueva]);

  // Debounce de 400 ms en la búsqueda.
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
  const filtrosAvanzados = ['prioridad', 'curso_id'].filter((c) => filtros[c] !== '').length;
  const rapidoActivo = RAPIDOS.find((r) => r.estado === filtros.estado && r.vencimiento === filtros.vencimiento)?.clave;

  const cambiar = (campo) => (valor) => {
    setFiltros((actual) => ({ ...actual, [campo]: valor }));
    if (campo !== 'busqueda') setPage(1);
  };

  function elegirRapido(r) {
    setFiltros((actual) => ({ ...actual, estado: r.estado, vencimiento: r.vencimiento }));
    setPage(1);
  }

  function limpiar() {
    setFiltros(FILTROS_INICIALES);
    setPage(1);
  }

  async function cambiarEstado(tarea, estado) {
    try {
      // El backend responde { tarea }; se acepta tambien la tarea directa por compatibilidad.
      const res = await tareasApi.cambiarEstado(tarea.id, estado);
      const actualizada = res?.tarea ?? res;
      setDatos((actual) => ({
        ...actual,
        tareas: actual.tareas.map((t) => (t.id === actualizada.id ? { ...t, ...actualizada, curso_nombre: t.curso_nombre } : t)),
      }));
      cargarApoyo();
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
  const grupos = filtros.orden === 'fecha_entrega' ? agrupar(datos.tareas) : [{ titulo: 'Resultados', items: datos.tareas }];
  let indice = 0;

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refrescando}
          tintColor={colors.primario}
          colors={[colors.primario]}
          onRefresh={async () => { setRefrescando(true); cargarApoyo(); await cargar(); setRefrescando(false); }}
        />
      }
    >
      {/* Encabezado */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <View style={{ flex: 1 }}>
          <Text style={s.paginaTitulo}>Tareas</Text>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textoSuave, marginTop: 2 }}>
            {conteos.total ?? 0} en total
            {conteos.vencidas ? ` · ${conteos.vencidas} vencidas` : ''}
          </Text>
        </View>
        <Pressable
          onPress={() => setFiltrosAbiertos((v) => !v)}
          accessibilityRole="button"
          accessibilityState={{ expanded: filtrosAbiertos }}
          accessibilityLabel="Más filtros"
          style={({ pressed }) => ({
            width: 46,
            height: 46,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: filtrosAbiertos || filtrosAvanzados ? colors.tinta : colors.borde,
            backgroundColor: filtrosAbiertos || filtrosAvanzados ? colors.tinta : pressed ? colors.grisClaro : colors.superficie,
          })}
        >
          <Icon nombre="filtro" tamano={19} color={filtrosAbiertos || filtrosAvanzados ? '#fff' : colors.tinta} />
        </Pressable>
      </View>

      <Semana tareas={datos.tareas} />

      {cursos.length === 0 ? <ErrorMsg tipo="info">Aún no tienes cursos. Crea un curso antes de registrar tareas.</ErrorMsg> : null}

      {/* Búsqueda */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, borderRadius: 16, backgroundColor: colors.hundido, marginBottom: 12 }}>
        <Icon nombre="buscar" tamano={20} color={colors.textoSuave} />
        <TextInput
          value={filtros.busqueda}
          onChangeText={cambiar('busqueda')}
          placeholder="Buscar por título"
          placeholderTextColor={colors.placeholder}
          accessibilityLabel="Buscar por título"
          returnKeyType="search"
          style={{ flex: 1, minHeight: 48, fontSize: 15, fontWeight: '600', color: colors.texto }}
        />
        {filtros.busqueda ? (
          <Pressable onPress={() => cambiar('busqueda')('')} hitSlop={10} accessibilityLabel="Limpiar búsqueda">
            <Icon nombre="cerrar" tamano={18} color={colors.textoSuave} />
          </Pressable>
        ) : null}
      </View>

      {/* Pastillas rápidas */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16, marginBottom: 8 }} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {RAPIDOS.map((r) => (
          <Chip
            key={r.clave}
            label={r.etiqueta}
            active={rapidoActivo === r.clave}
            contador={conteos[r.conteo] ?? null}
            alerta={r.alerta && conteos[r.conteo] > 0}
            onPress={() => elegirRapido(r)}
          />
        ))}
      </ScrollView>

      {filtrosAbiertos ? (
        <Animated.View entering={FadeInDown.springify().damping(16)} style={[s.tarjeta, { padding: 16 }]}>
          <View style={s.fila}>
            <SelectCampo style={s.filaItem} label="Prioridad" value={filtros.prioridad} opciones={OPCIONES_PRIORIDAD} onChange={cambiar('prioridad')} placeholder="Todas" />
            <SelectCampo style={s.filaItem} label="Curso" value={filtros.curso_id} opciones={opcionesCursos} onChange={cambiar('curso_id')} placeholder="Todos" />
          </View>
          <View style={s.fila}>
            <SelectCampo style={s.filaItem} label="Ordenar por" value={filtros.orden} opciones={OPCIONES_ORDEN} onChange={cambiar('orden')} />
            <SelectCampo style={s.filaItem} label="Dirección" value={filtros.dir} opciones={OPCIONES_DIR} onChange={cambiar('dir')} />
          </View>
          {hayFiltros ? <Button kind="fantasma" small icono="cerrar" title="Limpiar filtros" onPress={limpiar} /> : null}
        </Animated.View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <Icon nombre="ordenar" tamano={16} color={colors.textoSuave} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textoSuave }}>Ordenar por</Text>
          <Text style={{ fontSize: 12, fontWeight: '800', color: colors.primario }}>
            {OPCIONES_ORDEN.find((o) => o.valor === filtros.orden)?.etiqueta}
          </Text>
          {hayFiltros ? (
            <Pressable onPress={limpiar} hitSlop={8} style={{ marginLeft: 'auto' }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: colors.textoSuave }}>Limpiar filtros</Text>
            </Pressable>
          ) : null}
        </View>
      )}

      {error ? <ErrorMsg titulo="No se pudieron cargar las tareas">{error}</ErrorMsg> : null}

      {cargando ? (
        <Loading />
      ) : datos.tareas.length === 0 ? (
        <Vacio
          icono={hayFiltros ? 'buscar' : 'bandeja'}
          titulo={hayFiltros ? 'Sin resultados' : 'Aún no tienes tareas'}
          mensaje={hayFiltros ? 'Prueba ajustando o limpiando los filtros.' : 'Crea tu primera tarea con el botón + de abajo.'}
        >
          {hayFiltros ? (
            <Button kind="secundario" title="Limpiar filtros" onPress={limpiar} />
          ) : (
            <Button title="Crear tarea" icono="mas" onPress={() => setForm({})} disabled={cursos.length === 0} />
          )}
        </Vacio>
      ) : (
        <>
          {grupos.map((g) => (
            <Animated.View key={g.titulo} entering={FadeIn.duration(250)} style={{ marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, marginTop: 6 }}>
                {g.alerta ? <Icon nombre="alerta" tamano={18} color={colors.rojo} /> : null}
                <Text style={[s.seccionTitulo, { fontSize: 17 }, g.alerta && { color: colors.rojo }]}>{g.titulo}</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textoSuave }}>
                  {g.items.length} {g.items.length === 1 ? 'tarea' : 'tareas'}
                </Text>
              </View>
              {g.items.map((t) => (
                <TareaCard key={t.id} tarea={t} indice={indice++} onEstado={cambiarEstado} onEdit={setForm} onDelete={eliminarTarea} />
              ))}
            </Animated.View>
          ))}

          {totalPaginas > 1 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 8 }}>
              <Button kind="secundario" small title="Anterior" disabled={page <= 1} onPress={() => setPage((p) => Math.max(1, p - 1))} />
              <Text style={[s.tabular, { fontSize: 14, fontWeight: '700', color: colors.textoSuave }]}>
                {page} de {totalPaginas}
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
