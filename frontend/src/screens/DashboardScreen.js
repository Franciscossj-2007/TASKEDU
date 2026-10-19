import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { dashboardApi, mensajeError } from '../api';
import { useAuth } from '../auth';
import {
  Badge,
  Button,
  ErrorMsg,
  Loading,
  Progreso,
  Vacio,
  colors,
  etiquetaVencimiento,
  formatearFecha,
  metaPrioridad,
  s,
} from '../ui';

// Tarjeta de estadistica con el borde izquierdo de color, como .estadistica del web.
function Estadistica({ titulo, valor, color, icono }) {
  return (
    <View style={[s.tarjeta, { borderLeftWidth: 4, borderLeftColor: color, width: '47%', marginBottom: 0, padding: 14 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ fontSize: 14 }}>{icono}</Text>
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textoSuave }}>{titulo}</Text>
      </View>
      <Text style={{ fontSize: 30, fontWeight: '700', color: colors.texto, marginTop: 6, letterSpacing: -0.5 }}>{valor}</Text>
    </View>
  );
}

export default function DashboardScreen({ focused, onIrATareas }) {
  const { usuario } = useAuth();
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(async () => {
    setError('');
    try {
      setD(await dashboardApi.resumen());
    } catch (e) {
      setError(mensajeError(e));
    }
  }, []);

  // Recarga cada vez que la pestaña pasa a estar activa.
  useEffect(() => {
    if (focused) cargar();
  }, [focused, cargar]);

  const refrescar = async () => {
    setRefrescando(true);
    await cargar();
    setRefrescando(false);
  };

  if (error) {
    return (
      <ScrollView contentContainerStyle={{ padding: 20 }} refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} />}>
        <ErrorMsg titulo="No se pudo cargar el panel">{error}</ErrorMsg>
      </ScrollView>
    );
  }
  if (!d) return <Loading />;

  const r = d.resumen ?? {};
  const proximas = d.proximasEntregas ?? [];
  const porCurso = d.porCurso ?? [];

  return (
    <ScrollView
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} />}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
        <View style={{ flex: 1 }}>
          <Text style={s.paginaTitulo}>Hola, {usuario?.nombre?.split(' ')[0]}</Text>
          <Text style={s.paginaSubtitulo}>Este es el resumen de tus tareas academicas</Text>
        </View>
        <Button title="Ver mis tareas" small onPress={onIrATareas} />
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <Estadistica titulo="Total" valor={r.total ?? 0} color={colors.primario} icono="▤" />
        <Estadistica titulo="Pendientes" valor={r.pendientes ?? 0} color={colors.gris} icono="○" />
        <Estadistica titulo="En progreso" valor={r.en_progreso ?? 0} color={colors.azul} icono="◐" />
        <Estadistica titulo="Completadas" valor={r.completadas ?? 0} color={colors.verde} icono="✓" />
        <Estadistica titulo="Vencidas" valor={r.vencidas ?? 0} color={colors.rojo} icono="!" />
        <Estadistica titulo="Proximas" valor={r.proximas ?? 0} color={colors.ambar} icono="⏱" />
      </View>

      {/* Proximas entregas */}
      <View style={[s.tarjeta, { padding: 20 }]}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: colors.texto, marginBottom: 14 }}>Proximas entregas</Text>
        {proximas.length === 0 ? (
          <Vacio icono="🎉" titulo="Sin entregas proximas" mensaje="No tienes tareas pendientes con fecha cercana." />
        ) : (
          proximas.map((tarea) => {
            const prioridad = metaPrioridad(tarea.prioridad);
            const aviso = etiquetaVencimiento(tarea);
            return (
              <View
                key={tarea.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  borderWidth: 1,
                  borderColor: colors.borde,
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 10,
                }}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontWeight: '600', color: colors.texto }} numberOfLines={1}>
                    {tarea.titulo}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.textoSuave }}>{tarea.curso_nombre}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Badge color={prioridad.color}>{prioridad.etiqueta}</Badge>
                  <Text style={{ fontSize: 12, color: colors.textoSuave }}>
                    {formatearFecha(tarea.fecha_entrega)}
                    {aviso ? ` · ${aviso}` : ''}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Progreso por curso */}
      <View style={[s.tarjeta, { padding: 20, marginBottom: 24 }]}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: colors.texto, marginBottom: 14 }}>Progreso por curso</Text>
        {porCurso.length === 0 ? (
          <Vacio icono="▦" titulo="Aun no tienes cursos" mensaje="Crea un curso para empezar a registrar tareas." />
        ) : (
          porCurso.map((curso) => (
            <View key={curso.curso_id} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontWeight: '600', color: colors.texto }}>{curso.nombre}</Text>
                <Text style={{ fontSize: 13, color: colors.textoSuave }}>
                  {curso.completadas}/{curso.total}
                </Text>
              </View>
              <Progreso
                valor={curso.completadas}
                max={curso.total || 1}
                color={curso.total > 0 && curso.completadas === curso.total ? 'verde' : 'primario'}
              />
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
