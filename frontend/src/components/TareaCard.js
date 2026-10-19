import { Alert, Pressable, Text, View } from 'react-native';
import {
  Badge,
  SelectValor,
  OPCIONES_ESTADO,
  colors,
  etiquetaVencimiento,
  formatearFecha,
  metaEstado,
  metaPrioridad,
  s,
} from '../ui';

// Tarjeta de tarea replicando el .tarea del frontend web:
// titulo + badge de prioridad, meta con curso/fecha, descripcion,
// etiquetas de estado y badges de vencimiento, y acciones con
// selector de estado + Editar/Eliminar.
export default function TareaCard({ tarea: t, onEstado, onEdit, onDelete, mostrarCurso = true }) {
  const estado = metaEstado(t.estado);
  const prioridad = metaPrioridad(t.prioridad);
  const aviso = etiquetaVencimiento(t);

  const confirmarBorrar = () =>
    Alert.alert(
      'Eliminar tarea',
      `Seguro que deseas eliminar la tarea "${t.titulo}"? Esta accion no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => onDelete(t) },
      ],
    );

  return (
    <View style={[s.tarjeta, t.vencida && { borderLeftWidth: 4, borderLeftColor: colors.rojo }, { marginBottom: 16 }]}>
      {/* Cabecera */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.texto, flex: 1, lineHeight: 21 }}>{t.titulo}</Text>
        <Badge color={prioridad.color} punto>
          {prioridad.etiqueta}
        </Badge>
      </View>

      {/* Meta */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
        {mostrarCurso && t.curso_nombre ? (
          <Text style={{ fontSize: 13, color: colors.textoSuave }}>▦ {t.curso_nombre}</Text>
        ) : null}
        <Text style={{ fontSize: 13, color: colors.textoSuave }}>🗓 {formatearFecha(t.fecha_entrega)}</Text>
      </View>

      {t.descripcion ? (
        <Text style={{ fontSize: 14, color: colors.textoSuave, marginTop: 8 }} numberOfLines={3}>
          {t.descripcion}
        </Text>
      ) : null}

      {/* Etiquetas */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
        <Badge color={estado.color}>{estado.etiqueta}</Badge>
        {t.vencida ? <Badge color="rojo">Vencida</Badge> : null}
        {!t.vencida && aviso ? <Badge color="ambar">{aviso}</Badge> : null}
      </View>

      {/* Acciones */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          borderTopWidth: 1,
          borderTopColor: colors.borde,
          paddingTop: 12,
          marginTop: 14,
        }}
      >
        <Text style={{ fontSize: 12, color: colors.textoSuave, fontWeight: '600' }}>Estado</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end' }}>
          <SelectValor value={t.estado} opciones={OPCIONES_ESTADO} onChange={(estado) => onEstado(t, estado)} compacto />
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <Pressable onPress={() => onEdit(t)} style={({ pressed }) => ({ paddingVertical: 6, paddingHorizontal: 8, borderRadius: 6, backgroundColor: pressed ? colors.grisClaro : 'transparent' })} hitSlop={6}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textoSuave }}>Editar</Text>
            </Pressable>
            <Pressable onPress={confirmarBorrar} style={({ pressed }) => ({ paddingVertical: 6, paddingHorizontal: 8, borderRadius: 6, backgroundColor: pressed ? colors.rojoClaro : 'transparent' })} hitSlop={6}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.rojo }}>Eliminar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
