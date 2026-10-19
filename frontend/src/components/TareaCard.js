import { Alert, Text, View } from 'react-native';
import { Badge, Button, ESTADOS, colors, formatFecha, s } from '../ui';

// Tarjeta de una tarea con acciones rapidas (completar, editar, eliminar).
export default function TareaCard({ tarea: t, onEstado, onEdit, onDelete }) {
  const confirmarBorrar = () =>
    Alert.alert('Eliminar tarea', `Eliminar "${t.titulo}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => onDelete(t) },
    ]);

  return (
    <View style={[s.card, t.vencida && { borderLeftWidth: 4, borderLeftColor: colors.danger }, t.estado === 'completada' && { opacity: 0.6 }]}>
      <View style={s.row}>
        <Text style={[s.h3, t.estado === 'completada' && { textDecorationLine: 'line-through' }]}>{t.titulo}</Text>
        <Badge prioridad={t.prioridad} />
      </View>
      <Text style={s.muted}>{t.curso_nombre ? `${t.curso_nombre} · ` : ''}{formatFecha(t.fecha_entrega)}{t.vencida ? ' · Vencida' : ''}</Text>
      <Text style={s.muted}>Estado: {ESTADOS[t.estado]}</Text>
      {t.descripcion ? <Text style={{ marginTop: 6, color: colors.text }}>{t.descripcion}</Text> : null}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        {t.estado !== 'completada' && <Button small kind="primary" title="Completar" onPress={() => onEstado(t, 'completada')} />}
        {t.estado === 'pendiente' && <Button small title="En progreso" onPress={() => onEstado(t, 'en_progreso')} />}
        <Button small title="Editar" onPress={() => onEdit(t)} />
        <Button small kind="danger" title="Eliminar" onPress={confirmarBorrar} />
      </View>
    </View>
  );
}
