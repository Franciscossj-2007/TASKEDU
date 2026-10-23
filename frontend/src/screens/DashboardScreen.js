import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { dashboardApi, mensajeError } from '../api';
import { useAuth } from '../auth';
import Icon from '../components/Icon';
import {
  Badge,
  Button,
  ErrorMsg,
  Loading,
  Progreso,
  TONOS,
  Vacio,
  colors,
  diasRestantes,
  etiquetaVencimiento,
  formatearFecha,
  metaPrioridad,
  s,
} from '../ui';

// Tarjeta de estadistica tintada: circulo con icono a la izquierda, titulo y conteo.
function Estadistica({ titulo, valor, tono, icono }) {
  const t = TONOS[tono];
  return (
    <View
      style={{
        width: '48%',
        flexGrow: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 12,
        borderRadius: 18,
        backgroundColor: t.fondo,
        borderWidth: 1,
        borderColor: t.borde,
      }}
    >
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.circulo, alignItems: 'center', justifyContent: 'center' }}>
        <Icon nombre={icono} tamano={20} color={t.icono} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.tinta }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
          {titulo}
        </Text>
        <Text style={[s.tabular, { fontSize: 30, lineHeight: 36, fontWeight: '800', color: colors.tinta, letterSpacing: -0.8 }]}>{valor}</Text>
      </View>
    </View>
  );
}

// Fila de una entrega proxima: icono, titulo, curso, fecha y prioridad.
function Entrega({ tarea, indice, onPress }) {
  const prioridad = metaPrioridad(tarea.prioridad);
  const aviso = etiquetaVencimiento(tarea);
  const dias = diasRestantes(tarea.fecha_entrega);
  // Fecha en rojo si vence en 2 dias o menos; si no, en el tono violeta de "Proximas".
  const urgente = dias !== null && dias <= 2;
  const tonoFecha = urgente ? TONOS.rojo : TONOS.violeta;
  const tonoIcono = indice % 2 === 0 ? TONOS.azul : TONOS.violeta;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${tarea.titulo}, ${tarea.curso_nombre}, ${aviso || formatearFecha(tarea.fecha_entrega)}`}
      style={({ pressed }) => [
        s.tarjeta,
        { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, marginBottom: 12 },
        pressed && { backgroundColor: colors.grisClaro },
      ]}
    >
      <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: tonoIcono.circulo, alignItems: 'center', justifyContent: 'center' }}>
        <Icon nombre={indice % 2 === 0 ? 'documento' : 'libroAbierto'} tamano={24} color={tonoIcono.icono} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.tinta }} numberOfLines={1}>
          {tarea.titulo}
        </Text>
        <Text style={{ fontSize: 13, color: colors.textoSuave }} numberOfLines={1}>
          {tarea.curso_nombre}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8, backgroundColor: tonoFecha.fondo, borderWidth: 1, borderColor: tonoFecha.borde }}>
            <Icon nombre="calendario" tamano={13} color={tonoFecha.icono} />
            <Text style={[s.tabular, { fontSize: 12, fontWeight: '600', color: tonoFecha.icono }]}>
              {aviso || formatearFecha(tarea.fecha_entrega)}
            </Text>
          </View>
          <Badge color={prioridad.color} punto>{prioridad.etiqueta}</Badge>
        </View>
      </View>
      <Icon nombre="derecha" tamano={18} color={colors.placeholder} />
    </Pressable>
  );
}

export default function DashboardScreen({ focused, onIrATareas, onResumen }) {
  const { usuario } = useAuth();
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(async () => {
    setError('');
    try {
      const datos = await dashboardApi.resumen();
      setD(datos);
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

  const control = <RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={colors.primario} colors={[colors.primario]} />;

  if (error) {
    return (
      <ScrollView contentContainerStyle={{ padding: 20 }} refreshControl={control}>
        <ErrorMsg titulo="No se pudo cargar el panel">{error}</ErrorMsg>
        <Button kind="secundario" title="Reintentar" onPress={cargar} />
      </ScrollView>
    );
  }
  if (!d) return <Loading />;

  const r = d.resumen ?? {};
  const proximas = d.proximasEntregas ?? [];
  const porCurso = d.porCurso ?? [];

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }} refreshControl={control}>
      {/* Saludo sobre una franja celeste */}
      <View style={{ backgroundColor: colors.primarioClaro, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 26, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={s.paginaTitulo}>¡Hola, {usuario?.nombre?.split(' ')[0] ?? ''}!</Text>
          <Text style={s.paginaSubtitulo}>Este es el resumen de tus tareas académicas</Text>
        </View>
        <Pressable
          onPress={onIrATareas}
          accessibilityRole="button"
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            minHeight: 40,
            paddingHorizontal: 14,
            borderRadius: 999,
            backgroundColor: pressed ? colors.primarioBorde : '#dce9ff',
            borderWidth: 1,
            borderColor: colors.primarioBorde,
          })}
        >
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primario }}>Ver tareas</Text>
          <Icon nombre="flecha" tamano={16} color={colors.primario} />
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 18 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 26 }}>
          <Estadistica titulo="Total" valor={r.total ?? 0} tono="azul" icono="capas" />
          <Estadistica titulo="Pendientes" valor={r.pendientes ?? 0} tono="ambar" icono="reloj" />
          <Estadistica titulo="En progreso" valor={r.en_progreso ?? 0} tono="turquesa" icono="play" />
          <Estadistica titulo="Completadas" valor={r.completadas ?? 0} tono="verde" icono="checkCirculo" />
          <Estadistica titulo="Vencidas" valor={r.vencidas ?? 0} tono="rojo" icono="alerta" />
          <Estadistica titulo="Próximas" valor={r.proximas ?? 0} tono="violeta" icono="calendario" />
        </View>

        {/* Proximas entregas */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Icon nombre="calendario" tamano={22} color={colors.primario} />
          <Text style={[s.seccionTitulo, { flex: 1, fontSize: 20 }]}>Próximas entregas</Text>
          <Pressable onPress={onIrATareas} hitSlop={10} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 36 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primario }}>Ver todas</Text>
            <Icon nombre="flecha" tamano={16} color={colors.primario} />
          </Pressable>
        </View>
        {proximas.length === 0 ? (
          <View style={s.tarjeta}>
            <Vacio icono="fiesta" titulo="Sin entregas próximas" mensaje="No tienes tareas pendientes con fecha cercana." />
          </View>
        ) : (
          proximas.map((tarea, i) => <Entrega key={tarea.id} tarea={tarea} indice={i} onPress={onIrATareas} />)
        )}

        {/* Progreso por curso */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, marginBottom: 14 }}>
          <Icon nombre="birrete" tamano={22} color={colors.primario} />
          <Text style={[s.seccionTitulo, { fontSize: 20 }]}>Progreso por curso</Text>
        </View>
        <View style={[s.tarjeta, { marginBottom: 0 }]}>
          {porCurso.length === 0 ? (
            <Vacio icono="birrete" titulo="Aún no tienes cursos" mensaje="Crea un curso para empezar a registrar tareas." />
          ) : (
            porCurso.map((curso, i) => {
              const completo = curso.total > 0 && curso.completadas === curso.total;
              const porcentaje = curso.total ? Math.round((curso.completadas / curso.total) * 100) : 0;
              return (
                <View key={curso.curso_id} style={{ marginTop: i === 0 ? 0 : 18 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: colors.tinta, flex: 1 }} numberOfLines={1}>
                      {curso.nombre}
                    </Text>
                    <Text style={[s.tabular, { fontSize: 13, color: colors.textoSuave }]}>
                      {curso.completadas}/{curso.total} · <Text style={{ fontWeight: '700', color: completo ? colors.verde : colors.primario }}>{porcentaje}%</Text>
                    </Text>
                  </View>
                  <Progreso valor={curso.completadas} max={curso.total || 1} color={completo ? 'verde' : 'primario'} />
                </View>
              );
            })
          )}
        </View>
      </View>
    </ScrollView>
  );
}
