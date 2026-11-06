import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { cursosApi, dashboardApi, mensajeError, tareasApi } from '../api';
import { useAuth } from '../auth';
import Icon from '../components/Icon';
import Degradado from '../components/Degradado';
import MarcaTexto from '../components/MarcaTexto';
import AnilloProgreso from '../components/AnilloProgreso';
import NumeroAnimado from '../components/NumeroAnimado';
import PublicacionTarea from '../components/PublicacionTarea';
import TareaForm from '../components/TareaForm';
import {
  AnilloHistoria,
  Button,
  ErrorMsg,
  Loading,
  TONOS,
  Vacio,
  colors,
  diasRestantes,
  gradienteCurso,
  iniciales,
  s,
} from '../ui';

// Curso como "historia": anillo con degradado si tiene tareas pendientes, gris si esta al dia.
function Historia({ nombre, pendiente, colores, contenido, onPress, indice }) {
  return (
    <Animated.View entering={FadeInRight.delay(indice * 70).springify().damping(15)}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={nombre} style={({ pressed }) => ({ alignItems: 'center', gap: 6, width: 74, opacity: pressed ? 0.7 : 1 })}>
        <AnilloHistoria tamano={70} activo={pendiente}>
          <Degradado colores={colores} />
          {contenido}
        </AnilloHistoria>
        <Text style={{ fontSize: 12, fontWeight: pendiente ? '700' : '500', color: pendiente ? colors.tinta : colors.textoSuave }} numberOfLines={1}>
          {nombre}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// Pastilla de estadistica con el numero que cuenta hacia arriba.
function Estadistica({ titulo, valor, tono, icono, indice }) {
  const t = TONOS[tono];
  return (
    <Animated.View
      entering={FadeInDown.delay(150 + indice * 70).springify().damping(15)}
      style={{ width: 118, padding: 14, borderRadius: 22, backgroundColor: t.fondo, borderWidth: 1, borderColor: t.borde, gap: 10 }}
    >
      <View style={{ width: 36, height: 36, borderRadius: 13, backgroundColor: t.circulo, alignItems: 'center', justifyContent: 'center' }}>
        <Icon nombre={icono} tamano={19} color={t.icono} />
      </View>
      <View>
        <NumeroAnimado valor={valor} style={{ fontSize: 26, lineHeight: 30, fontWeight: '800', color: colors.tinta, letterSpacing: -0.8 }} />
        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textoSuave }}>{titulo}</Text>
      </View>
    </Animated.View>
  );
}

export default function DashboardScreen({ focused, onIrATareas, onIrACursos, onResumen, vencidas }) {
  const { usuario } = useAuth();
  const [d, setD] = useState(null);
  const [cursos, setCursos] = useState([]);
  const [error, setError] = useState('');
  const [refrescando, setRefrescando] = useState(false);
  const [editar, setEditar] = useState(null);

  const cargar = useCallback(async () => {
    setError('');
    try {
      const [datos, listaCursos] = await Promise.all([dashboardApi.resumen(), cursosApi.listar()]);
      setD(datos);
      setCursos(listaCursos.cursos ?? []);
      onResumen?.(datos.resumen ?? {});
    } catch (e) {
      setError(mensajeError(e));
    }
  }, [onResumen]);

  // Recarga cada vez que la pestaña pasa a estar activa.
  useEffect(() => {
    if (focused) cargar();
  }, [focused]);

  const refrescar = async () => {
    setRefrescando(true);
    await cargar();
    setRefrescando(false);
  };

  async function cambiarEstado(tarea, estado) {
    try {
      await tareasApi.cambiarEstado(tarea.id, estado);
      cargar();
    } catch (e) {
      setError(mensajeError(e));
    }
  }

  async function eliminar(tarea) {
    try {
      await tareasApi.eliminar(tarea.id);
      cargar();
    } catch (e) {
      setError(mensajeError(e));
    }
  }

  const control = <RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={colors.primario} colors={[colors.primario]} />;

  const encabezado = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, paddingHorizontal: 18, paddingTop: 6, paddingBottom: 10 }}>
      <MarcaTexto tamano={30} />
      <View style={{ flex: 1 }} />
      <Pressable onPress={onIrATareas} hitSlop={8} accessibilityRole="button" accessibilityLabel="Ver calendario de tareas">
        <Icon nombre="calendario" tamano={26} color={colors.tinta} />
      </Pressable>
      <Pressable onPress={onIrATareas} hitSlop={8} accessibilityRole="button" accessibilityLabel={vencidas ? `${vencidas} tareas vencidas` : 'Notificaciones'}>
        <Icon nombre="campana" tamano={26} color={colors.tinta} />
        {vencidas ? <View style={[s.campanaPunto, { borderColor: colors.fondo }]} /> : null}
      </Pressable>
    </View>
  );

  if (error && !d) {
    return (
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }} refreshControl={control}>
        {encabezado}
        <View style={{ padding: 20 }}>
          <ErrorMsg titulo="No se pudo cargar el inicio">{error}</ErrorMsg>
          <Button kind="secundario" title="Reintentar" onPress={cargar} />
        </View>
      </ScrollView>
    );
  }
  if (!d) return <Loading />;

  const r = d.resumen ?? {};
  const proximas = d.proximasEntregas ?? [];
  const porCurso = d.porCurso ?? [];
  const total = r.total ?? 0;
  const avance = total ? (r.completadas ?? 0) / total : 0;
  const paraHoy = proximas.filter((t) => diasRestantes(t.fecha_entrega) === 0).length;
  const nombre = usuario?.nombre?.split(' ')[0] ?? '';

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} refreshControl={control} showsVerticalScrollIndicator={false}>
        {encabezado}

        {/* Historias: tu semana + un círculo por curso */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 14, paddingVertical: 6 }}>
          <Historia
            indice={0}
            nombre="Tu semana"
            pendiente={(r.proximas ?? 0) > 0}
            contenido={<Icon nombre="llama" tamano={26} color="#fff" />}
            onPress={onIrATareas}
          />
          {porCurso.map((c, i) => (
            <Historia
              key={c.curso_id}
              indice={i + 1}
              nombre={c.nombre}
              pendiente={c.total > c.completadas}
              colores={gradienteCurso(c.curso_id)}
              contenido={<Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>{iniciales(c.nombre)}</Text>}
              onPress={onIrACursos}
            />
          ))}
        </ScrollView>
        <View style={{ height: 1, backgroundColor: colors.borde, marginTop: 8 }} />

        {error ? <View style={{ paddingHorizontal: 16, paddingTop: 12 }}><ErrorMsg>{error}</ErrorMsg></View> : null}

        {/* Tarjeta "para hoy" con el anillo de avance del ciclo */}
        <Animated.View entering={FadeInDown.delay(80).springify().damping(16)} style={{ marginHorizontal: 16, marginTop: 16 }}>
          <Pressable
            onPress={onIrATareas}
            accessibilityRole="button"
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderRadius: 26, backgroundColor: colors.tinta, opacity: pressed ? 0.9 : 1 })}
          >
            <AnilloProgreso valor={avance} tamano={68} grosor={7}>
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>{Math.round(avance * 100)}%</Text>
            </AnilloProgreso>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800' }}>
                {paraHoy ? `Hoy tienes ${paraHoy} ${paraHoy === 1 ? 'entrega' : 'entregas'}` : `¡Hola, ${nombre}!`}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, lineHeight: 17 }}>
                Llevas {r.completadas ?? 0} de {total} tareas completadas
                {r.vencidas ? ` · ${r.vencidas} vencidas` : ''}
              </Text>
            </View>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon nombre="derecha" tamano={18} color="#fff" grosor={2.4} />
            </View>
          </Pressable>
        </Animated.View>

        {/* Estadísticas deslizables */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 16, paddingVertical: 16 }}>
          <Estadistica indice={0} titulo="Pendientes" valor={r.pendientes ?? 0} tono="ambar" icono="reloj" />
          <Estadistica indice={1} titulo="En progreso" valor={r.en_progreso ?? 0} tono="azul" icono="play" />
          <Estadistica indice={2} titulo="Completadas" valor={r.completadas ?? 0} tono="verde" icono="checkCirculo" />
          <Estadistica indice={3} titulo="Vencidas" valor={r.vencidas ?? 0} tono="rojo" icono="alerta" />
        </ScrollView>

        {/* Feed de próximas entregas */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, marginBottom: 14 }}>
          <Text style={[s.seccionTitulo, { flex: 1, fontSize: 19 }]}>Próximas entregas</Text>
          <Pressable onPress={onIrATareas} hitSlop={10} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.primario }}>Ver todas</Text>
            <Icon nombre="derecha" tamano={16} color={colors.primario} grosor={2.4} />
          </Pressable>
        </View>

        {proximas.length === 0 ? (
          <View style={[s.tarjeta, { marginHorizontal: 16 }]}>
            <Vacio icono="fiesta" titulo="Sin entregas próximas" mensaje="No tienes tareas pendientes con fecha cercana. ¡Buen trabajo!" />
          </View>
        ) : (
          proximas.map((tarea, i) => (
            <PublicacionTarea key={tarea.id} tarea={tarea} indice={i} onEstado={cambiarEstado} onEdit={setEditar} onDelete={eliminar} />
          ))
        )}
      </ScrollView>

      {editar ? (
        <TareaForm
          tarea={editar}
          cursos={cursos}
          onClose={() => setEditar(null)}
          onSaved={() => { setEditar(null); cargar(); }}
        />
      ) : null}
    </View>
  );
}
