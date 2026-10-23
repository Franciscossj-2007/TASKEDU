import { Text, View } from 'react-native';
import Icon from './Icon';
import {
  Badge,
  BotonIcono,
  confirmarEliminar,
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
  const completada = t.estado === 'completada';

  const confirmarBorrar = () =>
    confirmarEliminar(
      'Eliminar tarea',
      `Seguro que deseas eliminar la tarea "${t.titulo}"? Esta accion no se puede deshacer.`,
      () => onDelete(t),
    );

  return (
    <View style={[s.tarjeta, t.vencida && { borderWidth: 1, borderColor: colors.rojoBorde }]}>
      {/* Cabecera */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '700',
            color: completada ? colors.textoSuave : colors.texto,
            flex: 1,
            lineHeight: 22,
            textDecorationLine: completada ? 'line-through' : 'none',
          }}
        >
          {t.titulo}
        </Text>
        <Badge color={prioridad.color} punto>
          {prioridad.etiqueta}
        </Badge>
      </View>

      {/* Meta */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 14, rowGap: 4, marginTop: 8 }}>
        {mostrarCurso && t.curso_nombre ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 }}>
            <Icon nombre="birrete" tamano={14} color={colors.textoSuave} />
            <Text style={{ fontSize: 13, color: colors.textoSuave, flexShrink: 1 }} numberOfLines={1}>{t.curso_nombre}</Text>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Icon nombre="calendario" tamano={14} color={colors.textoSuave} />
          <Text style={[s.tabular, { fontSize: 13, color: colors.textoSuave }]}>{formatearFecha(t.fecha_entrega)}</Text>
        </View>
      </View>

      {t.descripcion ? (
        <Text style={{ fontSize: 14, lineHeight: 20, color: colors.textoSuave, marginTop: 10 }} numberOfLines={3}>
          {t.descripcion}
        </Text>
      ) : null}

      {/* Etiquetas */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
        <Badge color={estado.color}>{estado.etiqueta}</Badge>
        {t.vencida ? <Badge color="rojo">Vencida</Badge> : null}
        {!t.vencida && aviso ? <Badge color="ambar">{aviso}</Badge> : null}
      </View>

      {/* Acciones */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          borderTopWidth: 1,
          borderTopColor: colors.grisClaro,
          paddingTop: 12,
          marginTop: 14,
        }}
      >
        <View style={{ flex: 1, alignItems: 'flex-start' }}>
          <SelectValor value={t.estado} opciones={OPCIONES_ESTADO} onChange={(nuevo) => onEstado(t, nuevo)} compacto titulo="Estado" />
        </View>
        <BotonIcono icono="editar" onPress={() => onEdit(t)} etiqueta="Editar tarea" />
        <BotonIcono icono="borrar" onPress={confirmarBorrar} color={colors.rojo} fondoPresionado={colors.rojoClaro} etiqueta="Eliminar tarea" />
      </View>
    </View>
  );
}
