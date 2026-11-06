import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Icon from './Icon';
import Degradado from './Degradado';
import { OpcionesTarea } from './TareaCard';
import { AnilloHistoria, Badge, colors, fechaCorta, gradienteCurso, iniciales, metaEstado, metaPrioridad, tiempoRestante } from '../ui';

const DOBLE_TOQUE_MS = 300;

// Tarea mostrada como publicacion del feed: encabezado con el curso, portada de color,
// acciones y descripcion. Tocar dos veces la portada la marca como completada con una animacion.
export default function PublicacionTarea({ tarea: t, indice = 0, onEstado, onEdit, onDelete }) {
  const [opciones, setOpciones] = useState(false);
  const ultimoToque = useRef(0);
  const [c1, c2] = gradienteCurso(t.curso_id);
  const prioridad = metaPrioridad(t.prioridad);
  const estado = metaEstado(t.estado);
  const completada = t.estado === 'completada';
  const restante = tiempoRestante(t);
  const urgente = restante === 'Vencida' || restante.includes(' h');

  // Animacion del check gigante al completar.
  const escala = useSharedValue(0);
  const opacidad = useSharedValue(0);
  const estiloCheck = useAnimatedStyle(() => ({
    opacity: opacidad.value,
    transform: [{ scale: escala.value }],
  }));

  function celebrar() {
    escala.value = 0;
    opacidad.value = 1;
    escala.value = withSequence(withSpring(1.15, { damping: 8, stiffness: 220 }), withSpring(1, { damping: 12 }));
    opacidad.value = withDelay(650, withTiming(0, { duration: 250 }));
  }

  function completar() {
    if (completada) return;
    celebrar();
    setTimeout(() => onEstado(t, 'completada'), 500);
  }

  function tocarPortada() {
    const ahora = Date.now();
    if (ahora - ultimoToque.current < DOBLE_TOQUE_MS) {
      ultimoToque.current = 0;
      completar();
    } else {
      ultimoToque.current = ahora;
    }
  }

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(indice, 6) * 90).springify().damping(16)} style={{ paddingBottom: 22 }}>
      {/* Encabezado: curso como "cuenta" */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, marginBottom: 10 }}>
        <AnilloHistoria tamano={42} grosor={2} activo={!completada}>
          <Degradado colores={[c1, c2]} />
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{iniciales(t.curso_nombre)}</Text>
        </AnilloHistoria>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: colors.tinta }} numberOfLines={1}>{t.curso_nombre}</Text>
          <Text style={{ fontSize: 12, color: colors.textoSuave, fontVariant: ['tabular-nums'] }}>{fechaCorta(t.fecha_entrega)}</Text>
        </View>
        <Badge color={prioridad.color} punto>{prioridad.etiqueta}</Badge>
        <Pressable onPress={() => setOpciones(true)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Opciones de la tarea" style={{ padding: 4 }}>
          <Icon nombre="puntos" tamano={22} color={colors.tinta} grosor={3} />
        </Pressable>
      </View>

      {/* Portada */}
      <Pressable onPress={tocarPortada} accessibilityRole="button" accessibilityHint="Toca dos veces para completarla" style={{ marginHorizontal: 16 }}>
        <View style={{ height: 230, borderRadius: 26, overflow: 'hidden', padding: 18, justifyContent: 'space-between' }}>
          <Degradado colores={[c1, c2]} />
          <View style={{ position: 'absolute', right: -18, top: -10, opacity: 0.2, transform: [{ rotate: '-12deg' }] }}>
            <Icon nombre={indice % 2 ? 'libroAbierto' : 'documento'} tamano={150} color="#fff" grosor={1.3} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.22)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' }}>
              <Icon nombre={urgente ? 'llama' : 'reloj'} tamano={14} color="#fff" grosor={2.4} />
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>{restante}</Text>
            </View>
            <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(43,26,18,0.25)' }}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>{estado.etiqueta}</Text>
            </View>
          </View>
          <Text style={{ color: '#fff', fontSize: 26, lineHeight: 30, fontWeight: '800', letterSpacing: -0.8 }} numberOfLines={3}>
            {t.titulo}
          </Text>

          {/* Check gigante del doble toque */}
          <Animated.View pointerEvents="none" style={[{ position: 'absolute', alignSelf: 'center', top: 65, width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.3)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)' }, estiloCheck]}>
            <Icon nombre="check" tamano={56} color="#fff" grosor={3} />
          </Animated.View>
        </View>
      </Pressable>

      {/* Acciones */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, paddingHorizontal: 18, paddingTop: 12 }}>
        <Pressable onPress={completar} hitSlop={8} accessibilityRole="button" accessibilityLabel="Completar tarea">
          <Icon nombre="checkCirculo" tamano={27} color={completada ? colors.verde : colors.tinta} />
        </Pressable>
        <Pressable onPress={() => onEdit(t)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Editar tarea">
          <Icon nombre="editar" tamano={24} color={colors.tinta} />
        </Pressable>
        <Pressable onPress={() => setOpciones(true)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Cambiar estado">
          <Icon nombre="reloj" tamano={25} color={colors.tinta} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Icon nombre="marcador" tamano={24} color={colors.tinta} />
      </View>

      <View style={{ paddingHorizontal: 18, paddingTop: 8, gap: 3 }}>
        {t.descripcion ? (
          <Text style={{ fontSize: 14, lineHeight: 20, color: colors.texto }} numberOfLines={2}>
            <Text style={{ fontWeight: '800', color: colors.tinta }}>{t.curso_nombre} </Text>
            {t.descripcion}
          </Text>
        ) : null}
        <Text style={{ fontSize: 12, color: colors.placeholder }}>
          {completada ? 'Completada' : 'Toca dos veces la portada para completarla'}
        </Text>
      </View>

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
