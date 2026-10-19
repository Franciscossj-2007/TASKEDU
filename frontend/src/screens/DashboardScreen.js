import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { dashboardApi, mensajeError } from '../api';
import { Badge, Empty, ErrorMsg, Loading, colors, formatFecha, s } from '../ui';

export default function DashboardScreen({ focused }) {
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(async () => {
    setError('');
    try { setD(await dashboardApi.resumen()); } catch (e) { setError(mensajeError(e)); }
  }, []);

  // Recarga cada vez que la pestaña pasa a estar activa.
  useEffect(() => { if (focused) cargar(); }, [focused, cargar]);

  const refrescar = async () => { setRefrescando(true); await cargar(); setRefrescando(false); };

  if (error) return <View style={{ padding: 16 }}><ErrorMsg>{error}</ErrorMsg></View>;
  if (!d) return <Loading />;
  const r = d.resumen;
  const stats = [
    ['Total', r.total, colors.text], ['Pendientes', r.pendientes, colors.text], ['En progreso', r.en_progreso, colors.text],
    ['Completadas', r.completadas, colors.ok], ['Vencidas', r.vencidas, colors.danger], ['Proximas (7d)', r.proximas, colors.warn],
  ];

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }} refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} />}>
      <Text style={s.title}>Panel</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {stats.map(([l, v, c]) => (
          <View key={l} style={[s.card, { width: '47%', marginBottom: 0 }]}>
            <Text style={{ fontSize: 28, fontWeight: '700', color: c }}>{v}</Text>
            <Text style={s.muted}>{l}</Text>
          </View>
        ))}
      </View>

      <Text style={[s.h3, { marginTop: 20, marginBottom: 8 }]}>Proximas entregas</Text>
      {d.proximasEntregas.length === 0 ? <Empty>No hay entregas proximas.</Empty> : d.proximasEntregas.map((t) => (
        <View key={t.id} style={s.card}>
          <View style={s.row}><Text style={s.h3}>{t.titulo}</Text><Badge prioridad={t.prioridad} /></View>
          <Text style={s.muted}>{t.curso_nombre} · {formatFecha(t.fecha_entrega)}</Text>
        </View>
      ))}

      <Text style={[s.h3, { marginTop: 12, marginBottom: 8 }]}>Progreso por curso</Text>
      {d.porCurso.length === 0 ? <Empty>Aun no tiene cursos.</Empty> : d.porCurso.map((c) => (
        <View key={c.curso_id} style={s.card}>
          <Text style={s.h3}>{c.nombre} ({c.completadas}/{c.total})</Text>
          <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4, marginTop: 8 }}>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.primary, width: `${c.total ? (c.completadas / c.total) * 100 : 0}%` }} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
