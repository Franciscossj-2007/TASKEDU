import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Icon from './components/Icon';
import Degradado from './components/Degradado';
import MarcaTexto from './components/MarcaTexto';

// Paleta "Atardecer calido" de TaskEdu: crema, coral y naranja con texto cafe oscuro.
// Se conservan los nombres de las claves para que todo el codigo existente siga funcionando.
export const colors = {
  primario: '#ff6b4a',
  primarioOscuro: '#e04e2e',
  primarioClaro: '#ffe8e0',
  primarioBorde: '#ffd2c4',
  acento: '#ffb020',
  rosa: '#ff5470',
  fondo: '#fff7f0',
  hundido: '#f8ece2',
  superficie: '#ffffff',
  tinta: '#2b1a12',
  texto: '#3d2a1f',
  textoSuave: '#8a6f60',
  placeholder: '#b8a294',
  borde: '#f1e4d8',
  rojo: '#e5383b',
  rojoClaro: '#fde4e4',
  rojoBorde: '#f9c5c6',
  verde: '#2a9d8f',
  verdeClaro: '#dcf3ef',
  ambar: '#a16207',
  ambarClaro: '#fef0d2',
  azul: '#ff6b4a',
  azulClaro: '#ffe8e0',
  gris: '#8a6f60',
  grisClaro: '#f5ece4',
  // Fondos de marca (inicio y acceso).
  sidebar: '#ff6b4a',
  sidebarTexto: '#fff3ec',
  sidebarEnlace: '#ffe3d6',
};

// Degradados por curso: cada curso toma uno segun su id (portadas, historias, mosaicos).
export const GRADIENTES_CURSO = [
  ['#ff5470', '#ff9f6e'],
  ['#e0a100', '#ffcf6e'],
  ['#7a2a48', '#e2725b'],
  ['#5f7030', '#a7b85a'],
  ['#ff8a5c', '#ffc49a'],
  ['#c8553d', '#ffb020'],
  ['#a23b5b', '#ff6b4a'],
];
export const gradienteCurso = (id) => GRADIENTES_CURSO[Math.abs(Number(id) || 0) % GRADIENTES_CURSO.length];

// Iniciales de un nombre ("Fisica II" -> "FI", "Calculo" -> "CA").
export function iniciales(nombre = '') {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}

// Sombra suave y calida, la unica elevacion de las tarjetas.
export const sombra = Platform.select({
  ios: { shadowColor: '#8a4b2a', shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  android: { elevation: 2 },
  default: { boxShadow: '0 6px 16px rgba(138, 75, 42, 0.08)' },
});

// Sombra de color para botones y elementos con degradado.
export const sombraCoral = Platform.select({
  ios: { shadowColor: '#ff6b4a', shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
  android: { elevation: 5 },
  default: { boxShadow: '0 8px 20px rgba(255, 107, 74, 0.35)' },
});

// Tonos por estado para tarjetas de estadistica e iconos: fondo de tarjeta, circulo e icono.
export const TONOS = {
  azul: { fondo: '#fff3ee', borde: '#ffd9cc', circulo: '#ffe2d7', icono: '#ff6b4a' },
  ambar: { fondo: '#fff8ea', borde: '#fde7bd', circulo: '#ffefc9', icono: '#e09400' },
  turquesa: { fondo: '#effaf8', borde: '#cdebe6', circulo: '#d6f2ed', icono: '#2a9d8f' },
  verde: { fondo: '#effaf8', borde: '#cdebe6', circulo: '#d6f2ed', icono: '#2a9d8f' },
  rojo: { fondo: '#fff3f3', borde: '#f9cfd0', circulo: '#fde0e0', icono: '#e5383b' },
  violeta: { fondo: '#fbf0f4', borde: '#f0d2dd', circulo: '#f6dde6', icono: '#a23b5b' },
};

// Numeros de ancho fijo para conteos y fechas.
const tabular = { fontVariant: ['tabular-nums'] };

// Colores de badge (fondo claro + texto oscuro).
export const BADGES = {
  gris: { bg: '#f5ece4', fg: '#6b5547' },
  azul: { bg: '#ffe8e0', fg: '#c2410c' },
  verde: { bg: '#dcf3ef', fg: '#1f7a6f' },
  rojo: { bg: '#fde4e4', fg: '#b42325' },
  ambar: { bg: '#fef0d2', fg: '#a16207' },
  primario: { bg: '#ffe8e0', fg: '#c2410c' },
};

export const ESTADOS = {
  pendiente: { etiqueta: 'Pendiente', color: 'gris' },
  en_progreso: { etiqueta: 'En progreso', color: 'azul' },
  completada: { etiqueta: 'Completada', color: 'verde' },
};

export const PRIORIDADES = {
  baja: { etiqueta: 'Baja', color: 'verde' },
  media: { etiqueta: 'Media', color: 'ambar' },
  alta: { etiqueta: 'Alta', color: 'rojo' },
};

export const OPCIONES_ESTADO = Object.entries(ESTADOS).map(([valor, m]) => ({ valor, etiqueta: m.etiqueta }));
export const OPCIONES_PRIORIDAD = Object.entries(PRIORIDADES).map(([valor, m]) => ({ valor, etiqueta: m.etiqueta }));

export const metaEstado = (v) => ESTADOS[v] ?? { etiqueta: v, color: 'gris' };
export const metaPrioridad = (v) => PRIORIDADES[v] ?? { etiqueta: v, color: 'gris' };

// Fechas con el mismo formato que el web ("19 oct 2026").
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const p2 = (n) => String(n).padStart(2, '0');

export function formatearFecha(valor) {
  if (!valor) return 'Sin fecha';
  const f = new Date(valor);
  if (Number.isNaN(f.getTime())) return 'Fecha invalida';
  return `${p2(f.getDate())} ${MESES[f.getMonth()]} ${f.getFullYear()}`;
}

export function formatearFechaHora(valor) {
  if (!valor) return 'Sin fecha';
  const f = new Date(valor);
  if (Number.isNaN(f.getTime())) return 'Fecha invalida';
  return `${formatearFecha(valor)} · ${p2(f.getHours())}:${p2(f.getMinutes())}`;
}

export function isoATexto(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
}

export function textoAIso(texto) {
  const m = String(texto).trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/);
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function diasRestantes(valor) {
  if (!valor) return null;
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return null;
  const ahora = new Date();
  const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const inicioFecha = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  return Math.round((inicioFecha - inicioHoy) / 86400000);
}

export function etiquetaVencimiento(tarea) {
  const dias = diasRestantes(tarea.fecha_entrega);
  if (dias === null || tarea.estado === 'completada') return '';
  if (dias < 0) return `Venció hace ${Math.abs(dias)} d`;
  if (dias === 0) return 'Vence hoy';
  if (dias === 1) return 'Vence mañana';
  if (dias <= 7) return `Vence en ${dias} días`;
  return '';
}

// Tiempo que falta para la entrega en lenguaje corto: "Quedan 6 h", "Queda 1 dia", "Vencida".
export function tiempoRestante(tarea) {
  if (tarea.estado === 'completada') return 'Completada';
  const f = new Date(tarea.fecha_entrega);
  if (Number.isNaN(f.getTime())) return 'Sin fecha';
  const ms = f.getTime() - Date.now();
  if (ms < 0) return 'Vencida';
  const horas = Math.floor(ms / 3600000);
  if (horas < 1) return 'Menos de 1 h';
  if (horas < 24) return `Quedan ${horas} h`;
  const dias = Math.floor(horas / 24);
  return dias === 1 ? 'Queda 1 día' : `Quedan ${dias} días`;
}

// Fecha corta para listas: "Hoy · 23:59", "Mañana · 18:00", "12 nov · 08:00".
export function fechaCorta(valor) {
  const f = new Date(valor);
  if (Number.isNaN(f.getTime())) return 'Sin fecha';
  const hora = `${p2(f.getHours())}:${p2(f.getMinutes())}`;
  const dias = diasRestantes(valor);
  if (dias === 0) return `Hoy · ${hora}`;
  if (dias === 1) return `Mañana · ${hora}`;
  if (dias === -1) return `Ayer · ${hora}`;
  return `${f.getDate()} ${MESES[f.getMonth()]} · ${hora}`;
}

// Confirmacion de una accion destructiva. Alert.alert no muestra botones en la web,
// asi que ahi se usa el confirm del navegador.
export function confirmarEliminar(titulo, mensaje, onAceptar, textoBoton = 'Eliminar') {
  if (Platform.OS === 'web') {
    if (window.confirm(mensaje)) onAceptar();
    return;
  }
  Alert.alert(titulo, mensaje, [
    { text: 'Cancelar', style: 'cancel' },
    { text: textoBoton, style: 'destructive', onPress: onAceptar },
  ]);
}

// Marca: logotipo de texto "taskedu" con el degradado Atardecer (o blanco sobre fondos de color).
export function Marca({ grande, claro }) {
  return <MarcaTexto tamano={grande ? 40 : 28} blanco={claro} />;
}

// Avatar circular con degradado y las iniciales del nombre.
export function Avatar({ nombre = '', tamano = 38, colores }) {
  const letras = nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? '')
    .join('');
  return (
    <View style={[s.avatar, { width: tamano, height: tamano, borderRadius: tamano / 2 }]}>
      <Degradado colores={colores} />
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: tamano / 2.7 }}>{letras}</Text>
    </View>
  );
}

// Anillo tipo "historia": borde con degradado, separacion color fondo y contenido dentro.
export function AnilloHistoria({ tamano = 68, activo = true, grosor = 3, fondo = colors.fondo, children }) {
  return (
    <View style={{ width: tamano, height: tamano, borderRadius: tamano / 2, padding: grosor, overflow: 'hidden', backgroundColor: activo ? undefined : '#e6d6c8' }}>
      {activo ? <Degradado /> : null}
      <View style={{ flex: 1, borderRadius: tamano / 2, padding: grosor, backgroundColor: fondo }}>
        <View style={{ flex: 1, borderRadius: tamano / 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>{children}</View>
      </View>
    </View>
  );
}

// Pressable que se encoge levemente al tocarlo (retroalimentacion inmediata en press-in).
export function Presionable({ style, contenedor, children, disabled, ...props }) {
  const [presionado, setPresionado] = useState(false);
  return (
    <Pressable
      {...props}
      style={contenedor}
      disabled={disabled}
      onPressIn={(e) => { setPresionado(true); props.onPressIn?.(e); }}
      onPressOut={(e) => { setPresionado(false); props.onPressOut?.(e); }}
      pressRetentionOffset={16}
    >
      <Animated.View
        style={[
          style,
          {
            transform: [{ scale: presionado && !disabled ? 0.97 : 1 }],
            transitionProperty: 'transform',
            transitionDuration: 120,
            transitionTimingFunction: 'ease-out',
          },
        ]}
      >
        {typeof children === 'function' ? children({ pressed: presionado }) : children}
      </Animated.View>
    </Pressable>
  );
}

export function Button({ title, onPress, kind = 'primario', small, bloque, cargando, disabled, icono }) {
  const bg =
    kind === 'primario' ? colors.primario :
    kind === 'peligro' ? colors.rojo :
    kind === 'secundario' ? colors.superficie :
    kind === 'suave' ? colors.primarioClaro :
    kind === 'peligroSuave' ? colors.rojoClaro :
    'transparent';
  const fg =
    kind === 'primario' || kind === 'peligro' ? '#fff' :
    kind === 'fantasma' ? colors.textoSuave :
    kind === 'suave' ? colors.primarioOscuro :
    kind === 'peligroSuave' ? '#b91c1c' :
    colors.texto;
  const inactivo = disabled || cargando;
  return (
    <Presionable
      onPress={onPress}
      disabled={inactivo}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactivo, busy: !!cargando }}
      hitSlop={small ? 6 : 0}
      contenedor={bloque && { alignSelf: 'stretch' }}
      style={[
        s.btn,
        kind === 'secundario' && { borderColor: colors.borde, borderWidth: 1.5 },
        small && s.btnSm,
        { backgroundColor: kind === 'primario' ? colors.primario : bg, opacity: disabled ? 0.5 : 1 },
        kind === 'primario' && !disabled && sombraCoral,
      ]}
    >
      {kind === 'primario' ? <Degradado radio={small ? 12 : 16} /> : null}
      {cargando ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <>
          {icono ? <Icon nombre={icono} tamano={small ? 16 : 18} color={fg} /> : null}
          <Text style={{ color: fg, fontWeight: '700', fontSize: small ? 13 : 15 }}>{title}</Text>
        </>
      )}
    </Presionable>
  );
}

// Boton cuadrado solo con icono (editar, eliminar, cerrar...). Area tactil de 44 pt.
export function BotonIcono({ icono, onPress, color = colors.textoSuave, fondoPresionado = colors.grisClaro, etiqueta }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      style={({ pressed }) => [s.botonIcono, pressed && { backgroundColor: fondoPresionado }]}
    >
      <Icon nombre={icono} tamano={18} color={color} />
    </Pressable>
  );
}

// Campo con etiqueta, asterisco de requerido, ayuda y error, como .campo del web.
export function Field({ label, requerido, error, ayuda, style, icono, ...props }) {
  const [enfocado, setEnfocado] = useState(false);
  return (
    <View style={[{ marginBottom: 16 }, style]}>
      {label ? (
        <Text style={s.label}>
          {label}
          {requerido ? <Text style={{ color: colors.rojo }}> *</Text> : null}
        </Text>
      ) : null}
      <View style={{ justifyContent: 'center' }}>
        {icono ? (
          <View style={{ position: 'absolute', left: 12, zIndex: 1 }} pointerEvents="none">
            <Icon nombre={icono} tamano={18} color={enfocado ? colors.primario : colors.placeholder} />
          </View>
        ) : null}
        <TextInput
          placeholderTextColor={colors.placeholder}
          {...props}
          onFocus={(e) => { setEnfocado(true); props.onFocus?.(e); }}
          onBlur={(e) => { setEnfocado(false); props.onBlur?.(e); }}
          style={[
            s.entrada,
            icono && { paddingLeft: 40 },
            props.multiline && { minHeight: 96, textAlignVertical: 'top', paddingTop: 12 },
            enfocado && s.entradaEnfocada,
            error && { borderColor: colors.rojo },
          ]}
        />
      </View>
      {ayuda && !error ? <Text style={s.ayuda}>{ayuda}</Text> : null}
      {error ? <Text style={s.errorCampo}>{error}</Text> : null}
    </View>
  );
}

// Select modal (equivalente al <select> del web).
export function SelectCampo({ label, requerido, value, opciones, placeholder = 'Selecciona', onChange, error, style }) {
  return (
    <View style={[{ marginBottom: 16 }, style]}>
      <Text style={s.label}>
        {label}
        {requerido ? <Text style={{ color: colors.rojo }}> *</Text> : null}
      </Text>
      <SelectValor value={value} opciones={opciones} placeholder={placeholder} onChange={onChange} error={error} titulo={label} />
      {error ? <Text style={s.errorCampo}>{error}</Text> : null}
    </View>
  );
}

export function SelectValor({ value, opciones, placeholder = 'Selecciona', onChange, error, compacto, titulo }) {
  const [abierto, setAbierto] = useState(false);
  const actual = opciones.find((o) => String(o.valor) === String(value));
  return (
    <>
      <Pressable
        onPress={() => setAbierto(true)}
        accessibilityRole="button"
        accessibilityLabel={titulo ? `${titulo}: ${actual ? actual.etiqueta : placeholder}` : undefined}
        style={({ pressed }) => [
          compacto ? s.selectCompacto : s.entrada,
          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
          pressed && { backgroundColor: colors.grisClaro },
          error && { borderColor: colors.rojo },
        ]}
      >
        <Text style={{ fontSize: compacto ? 13 : 15, color: actual ? colors.texto : colors.placeholder, flexShrink: 1 }} numberOfLines={1}>
          {actual ? actual.etiqueta : placeholder}
        </Text>
        <Icon nombre="abajo" tamano={16} color={colors.textoSuave} />
      </Pressable>
      <Modal visible={abierto} transparent animationType="fade" onRequestClose={() => setAbierto(false)}>
        <Pressable style={s.modalVelado} onPress={() => setAbierto(false)}>
          <View style={[s.selectCaja, sombra]}>
            {titulo ? <Text style={s.selectTitulo}>{titulo}</Text> : null}
            <ScrollView style={{ maxHeight: 360 }}>
              {opciones.map((o) => {
                const activo = String(o.valor) === String(value);
                return (
                  <Pressable
                    key={o.valor}
                    onPress={() => { setAbierto(false); onChange?.(o.valor); }}
                    style={({ pressed }) => [s.selectFila, (activo || pressed) && { backgroundColor: colors.primarioClaro }]}
                  >
                    <Text style={{ fontSize: 15, color: activo ? colors.primarioOscuro : colors.texto, fontWeight: activo ? '700' : '400', flexShrink: 1 }}>
                      {o.etiqueta}
                    </Text>
                    {activo ? <Icon nombre="check" tamano={18} color={colors.primario} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

// Pastilla de filtro: activa en cafe oscuro, inactiva blanca con borde. Admite un contador.
export function Chip({ label, active, onPress, contador, alerta }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={({ pressed }) => [
        s.chip,
        active && { backgroundColor: colors.tinta, borderColor: colors.tinta },
        pressed && !active && { backgroundColor: colors.grisClaro },
      ]}
    >
      <Text style={{ color: active ? '#fff' : colors.texto, fontSize: 13, fontWeight: '700' }}>{label}</Text>
      {contador !== undefined && contador !== null ? (
        <View
          style={{
            minWidth: 20,
            paddingHorizontal: 6,
            paddingVertical: 1,
            borderRadius: 999,
            alignItems: 'center',
            backgroundColor: alerta ? colors.rojo : active ? 'rgba(255,255,255,0.2)' : colors.hundido,
          }}
        >
          <Text style={[tabular, { fontSize: 11, fontWeight: '800', color: alerta || active ? '#fff' : colors.textoSuave }]}>{contador}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function Badge({ color = 'gris', punto, children }) {
  const c = BADGES[color] ?? BADGES.gris;
  return (
    <View style={[s.badge, { backgroundColor: c.bg }]}>
      {punto ? <View style={[s.badgePunto, { backgroundColor: c.fg }]} /> : null}
      <Text style={{ color: c.fg, fontSize: 12, fontWeight: '600' }}>{children}</Text>
    </View>
  );
}

// Barra de progreso: el relleno es absoluto y sin hijos, asi animar su ancho no recalcula el resto.
export function Progreso({ valor, max, color = 'primario' }) {
  const total = max || 1;
  const porcentaje = Math.max(0, Math.min(100, (valor / total) * 100));
  return (
    <View style={s.progreso}>
      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          borderRadius: 999,
          width: `${porcentaje}%`,
          overflow: 'hidden',
          backgroundColor: color === 'verde' ? colors.verde : colors.primario,
          transitionProperty: 'width',
          transitionDuration: 600,
          transitionTimingFunction: 'ease-out',
        }}
      >
        {color === 'verde' ? null : <Degradado horizontal />}
      </Animated.View>
    </View>
  );
}

export const Loading = () => (
  <View style={{ paddingVertical: 60, alignItems: 'center' }}>
    <ActivityIndicator size="large" color={colors.primario} />
  </View>
);

// Alerta (error/info) igual a .alerta del web.
export function ErrorMsg({ titulo, children, tipo = 'error' }) {
  if (!children) return null;
  const info = tipo === 'info';
  const fg = info ? '#9a3412' : '#991b1b';
  return (
    <View
      accessibilityRole="alert"
      style={[
        s.alerta,
        {
          backgroundColor: info ? colors.azulClaro : colors.rojoClaro,
          borderColor: info ? colors.primarioBorde : colors.rojoBorde,
        },
      ]}
    >
      <Icon nombre="alerta" tamano={18} color={fg} />
      <View style={{ flex: 1 }}>
        {titulo ? <Text style={{ fontWeight: '700', marginBottom: 2, color: fg }}>{titulo}</Text> : null}
        <Text style={{ fontSize: 14, lineHeight: 20, color: fg }}>{children}</Text>
      </View>
    </View>
  );
}

// Estado vacio con icono, titulo, mensaje y accion, como EstadoVacio del web.
export function Vacio({ icono, titulo, mensaje, children }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 28, paddingHorizontal: 16 }}>
      {icono ? (
        <View style={s.vacioIcono}>
          <Icon nombre={icono} tamano={26} color={colors.primario} />
        </View>
      ) : null}
      <Text style={{ fontSize: 17, fontWeight: '700', color: colors.texto, marginBottom: 6, textAlign: 'center' }}>{titulo}</Text>
      <Text style={{ fontSize: 14, lineHeight: 20, color: colors.textoSuave, textAlign: 'center', marginBottom: children ? 18 : 0, maxWidth: 300 }}>
        {mensaje}
      </Text>
      {children}
    </View>
  );
}

// Formulario modal: en iOS es una hoja nativa (se cierra deslizando), en Android pantalla completa.
export function ModalUI({ visible, titulo, onCerrar, children, pie }) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={onCerrar}
    >
      <SafeAreaProvider>
        <SafeAreaView edges={Platform.OS === 'ios' ? ['bottom'] : ['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.superficie }}>
          <View style={s.modalCabecera}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.texto, flex: 1 }} numberOfLines={1}>
              {titulo}
            </Text>
            <BotonIcono icono="cerrar" onPress={onCerrar} etiqueta="Cerrar" />
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled" style={{ flex: 1 }}>
            {children}
          </ScrollView>
          {pie ? <View style={s.modalPie}>{pie}</View> : null}
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

// Encabezado de pagina: titulo, subtitulo y accion principal a la derecha.
export function EncabezadoPagina({ titulo, subtitulo, children }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, marginBottom: 20 }}>
      <View style={{ flex: 1 }}>
        <Text style={s.paginaTitulo}>{titulo}</Text>
        {subtitulo ? <Text style={s.paginaSubtitulo}>{subtitulo}</Text> : null}
      </View>
      {children}
    </View>
  );
}

export const s = StyleSheet.create({
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    backgroundColor: colors.primario,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tarjeta: {
    backgroundColor: colors.superficie,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.borde,
    padding: 18,
    marginBottom: 14,
    ...sombra,
  },
  seccionTitulo: { fontSize: 18, fontWeight: '800', color: colors.tinta, letterSpacing: -0.3 },
  paginaTitulo: { fontSize: 27, fontWeight: '800', color: colors.tinta, letterSpacing: -0.7 },
  paginaSubtitulo: { fontSize: 14, lineHeight: 20, color: colors.textoSuave, marginTop: 4 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: 48,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  btnSm: { minHeight: 38, paddingVertical: 7, paddingHorizontal: 14, borderRadius: 12, gap: 6 },
  botonIcono: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 13, fontWeight: '600', color: colors.texto, marginBottom: 6 },
  ayuda: { fontSize: 12, color: colors.textoSuave, marginTop: 5 },
  errorCampo: { fontSize: 12, color: colors.rojo, fontWeight: '500', marginTop: 5 },
  entrada: {
    width: '100%',
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    backgroundColor: '#fff',
    color: colors.texto,
  },
  entradaEnfocada: {
    borderColor: colors.primario,
    backgroundColor: '#fffaf7',
  },
  selectCompacto: {
    minHeight: 36,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: 9,
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    minWidth: 128,
  },
  modalVelado: {
    flex: 1,
    backgroundColor: 'rgba(43, 26, 18, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  selectCaja: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    paddingVertical: 8,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  selectTitulo: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textoSuave,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 6,
  },
  selectFila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borde,
    backgroundColor: '#fff',
    marginRight: 8,
    marginBottom: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  badgePunto: { width: 6, height: 6, borderRadius: 3 },
  progreso: {
    height: 8,
    backgroundColor: colors.grisClaro,
    borderRadius: 999,
    overflow: 'hidden',
  },
  alerta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  vacioIcono: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: colors.primarioClaro,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.superficie,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borde,
  },
  campanaPunto: {
    position: 'absolute',
    top: -2,
    right: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.rojo,
    borderWidth: 2,
    borderColor: colors.superficie,
  },
  tabbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.superficie,
    paddingTop: 10,
    paddingHorizontal: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borde,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tabPastilla: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 7,
    borderRadius: 14,
    minHeight: 52,
  },
  tabPastillaActiva: {
    backgroundColor: colors.primarioClaro,
  },
  modalCabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    paddingLeft: 20,
    paddingRight: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borde,
  },
  modalPie: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borde,
  },
  fila: { flexDirection: 'row', gap: 12 },
  filaItem: { flex: 1 },
  tabular,
});
