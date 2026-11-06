import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, SlideInDown } from 'react-native-reanimated';
import Icon from './Icon';
import Degradado from './Degradado';
import {
  Badge,
  ESTADOS,
  Presionable,
  colors,
  confirmarEliminar,
  fechaCorta,
  gradienteCurso,
  metaPrioridad,
  sombra,
  tiempoRestante,
} from '../ui';

// Hoja inferior con las acciones de una tarea: cambiar estado, editar y eliminar.
export function OpcionesTarea({ tarea: t, visible, onCerrar, onEstado, onEdit, onDelete }) {
  if (!t) return null;
  const confirmarBorrar = () =>
    confirmarEliminar('Eliminar tarea', `¿Seguro que deseas eliminar "${t.titulo}"? Esta acción no se puede deshacer.`, () => {
      onCerrar();
      onDelete(t);
    });
  const [c1, c2] = gradienteCurso(t.curso_id);
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCerrar}>
      <Animated.View entering={FadeIn.duration(180)} style={{ flex: 1, backgroundColor: 'rgba(43, 26, 18, 0.45)', justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1 }} onPress={onCerrar} accessibilityLabel="Cerrar" />
        <Animated.View
          entering={SlideInDown.springify().damping(18)}
          style={{ backgroundColor: colors.superficie, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 34, gap: 16 }}
        >
          <View style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.borde }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 46, height: 46, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
              <Degradado colores={[c1, c2]} />
              <Icon nombre="documento" tamano={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: colors.tinta }} numberOfLines={2}>{t.titulo}</Text>
              <Text style={{ fontSize: 13, color: colors.textoSuave, marginTop: 2 }}>
                {t.curso_nombre ? `${t.curso_nombre} · ` : ''}{fechaCorta(t.fecha_entrega)}
              </Text>
            </View>
          </View>
          {t.descripcion ? <Text style={{ fontSize: 14, lineHeight: 20, color: colors.texto }}>{t.descripcion}</Text> : null}

          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textoSuave }}>Cambiar estado</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {Object.entries(ESTADOS).map(([valor, meta]) => {
              const activo = t.estado === valor;
              return (
                <Pressable
                  key={valor}
                  onPress={() => { onEstado(t, valor); onCerrar(); }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activo }}
                  style={({ pressed }) => ({
                    flex: 1,
                    minHeight: 44,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    borderWidth: activo ? 0 : 1.5,
                    borderColor: colors.borde,
                    backgroundColor: pressed && !activo ? colors.grisClaro : colors.superficie,
                  })}
                >
                  {activo ? <Degradado /> : null}
                  <Text style={{ fontSize: 13, fontWeight: '800', color: activo ? '#fff' : colors.texto }}>{meta.etiqueta}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              onPress={() => { onCerrar(); onEdit(t); }}
              style={({ pressed }) => ({ flex: 1, minHeight: 48, borderRadius: 16, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? colors.primarioBorde : colors.primarioClaro })}
            >
              <Icon nombre="editar" tamano={18} color={colors.primarioOscuro} />
              <Text style={{ fontSize: 15, fontWeight: '800', color: colors.primarioOscuro }}>Editar</Text>
            </Pressable>
            <Pressable
              onPress={confirmarBorrar}
              style={({ pressed }) => ({ flex: 1, minHeight: 48, borderRadius: 16, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? colors.rojoBorde : colors.rojoClaro })}
            >
              <Icon nombre="borrar" tamano={18} color={colors.rojo} />
              <Text style={{ fontSize: 15, fontWeight: '800', color: colors.rojo }}>Eliminar</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// Circulo de estado a la izquierda de la fila. Tocarlo completa o reabre la tarea.
function CheckEstado({ tarea: t, onPress }) {
  const completada = t.estado === 'completada';
  const progreso = t.estado === 'en_progreso';
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: completada }}
      accessibilityLabel={completada ? 'Marcar como pendiente' : 'Marcar como completada'}
      style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: completada ? 0 : 2,
        borderColor: t.vencida ? colors.rojo : progreso ? colors.primario : colors.primarioBorde,
      }}
    >
      {completada ? <Degradado colores={['#2a9d8f', '#5cc4a8']} /> : null}
      {completada ? <Icon nombre="check" tamano={16} color="#fff" grosor={3} /> : null}
      {progreso ? <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primario }} /> : null}
    </Pressable>
  );
}

// Fila de tarea: check de estado, titulo, curso con su color, fecha y prioridad.
// Tocar la fila abre la hoja de opciones (estado, editar, eliminar).
export default function TareaCard({ tarea: t, onEstado, onEdit, onDelete, mostrarCurso = true, indice = 0 }) {
  const [opciones, setOpciones] = useState(false);
  const prioridad = metaPrioridad(t.prioridad);
  const completada = t.estado === 'completada';
  const [colorCurso] = gradienteCurso(t.curso_id);
  const restante = tiempoRestante(t);

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(indice, 8) * 50).springify().damping(16)}>
      <Presionable
        onPress={() => setOpciones(true)}
        accessibilityRole="button"
        accessibilityLabel={`${t.titulo}. Abrir opciones`}
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            padding: 14,
            marginBottom: 10,
            borderRadius: 20,
            backgroundColor: t.vencida ? '#fff5f5' : colors.superficie,
            borderWidth: t.vencida ? 1.5 : 1,
            borderColor: t.vencida ? colors.rojo : colors.borde,
            opacity: completada ? 0.6 : 1,
          },
          sombra,
        ]}
      >
        <CheckEstado tarea={t} onPress={() => onEstado(t, completada ? 'pendiente' : 'completada')} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text
            style={{ fontSize: 15, fontWeight: '800', color: colors.tinta, textDecorationLine: completada ? 'line-through' : 'none' }}
            numberOfLines={2}
          >
            {t.titulo}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {mostrarCurso && t.curso_nombre ? (
              <>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colorCurso }} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textoSuave }} numberOfLines={1}>{t.curso_nombre}</Text>
                <Text style={{ fontSize: 12, color: colors.placeholder }}>·</Text>
              </>
            ) : null}
            <Text style={{ fontSize: 12, fontWeight: '600', color: t.vencida ? colors.rojo : colors.textoSuave, fontVariant: ['tabular-nums'] }}>
              {t.vencida ? `Vencida · ${fechaCorta(t.fecha_entrega)}` : completada ? fechaCorta(t.fecha_entrega) : `${fechaCorta(t.fecha_entrega)} · ${restante}`}
            </Text>
          </View>
        </View>
        <Badge color={prioridad.color} punto>{prioridad.etiqueta}</Badge>
      </Presionable>

      <OpcionesTarea
        tarea={t}
        visible={opciones}
        onCerrar={() => setOpciones(false)}
        onEstado={onEstado}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </Animated.View>
  );
}
