import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Icon from './components/Icon';
import Logo from './components/Logo';

// Paleta azul de TaskEdu: azul de marca, celeste de acento y texto azul marino.
export const colors = {
  primario: '#0b66f0',
  primarioOscuro: '#0a4fc4',
  primarioClaro: '#eaf2ff',
  primarioBorde: '#c9dcff',
  acento: '#5cc8ff',
  fondo: '#f4f8ff',
  superficie: '#ffffff',
  tinta: '#0f2350',
  texto: '#1a2b4c',
  textoSuave: '#5d6b85',
  placeholder: '#94a0b8',
  borde: '#e1e8f5',
  rojo: '#e11d48',
  rojoClaro: '#ffe4e8',
  rojoBorde: '#fecdd6',
  verde: '#16a34a',
  verdeClaro: '#dcfce7',
  ambar: '#b45309',
  ambarClaro: '#fef3c7',
  azul: '#0b66f0',
  azulClaro: '#dbe8ff',
  gris: '#5d6b85',
  grisClaro: '#eff3fa',
  // Fondos azules (inicio, cabecera de acceso).
  sidebar: '#0a4fd6',
  sidebarTexto: '#e6f0ff',
  sidebarEnlace: '#cfe0ff',
};

// Sombra suave con desplazamiento, la unica elevacion de las tarjetas.
export const sombra = Platform.select({
  ios: { shadowColor: '#0b3a8f', shadowOpacity: 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  android: { elevation: 2 },
  default: { boxShadow: '0 4px 14px rgba(11, 58, 143, 0.07)' },
});

// Tonos por estado para tarjetas de estadistica e iconos: fondo de tarjeta, circulo e icono.
export const TONOS = {
  azul: { fondo: '#f2f7ff', borde: '#dce8ff', circulo: '#dbe8ff', icono: '#0b66f0' },
  ambar: { fondo: '#fff9ef', borde: '#fdebc8', circulo: '#ffedc9', icono: '#e58a00' },
  turquesa: { fondo: '#f0fbf9', borde: '#cdeee8', circulo: '#d2f3ec', icono: '#0d9488' },
  verde: { fondo: '#f1fbf4', borde: '#cfeed9', circulo: '#d6f5e0', icono: '#16a34a' },
  rojo: { fondo: '#fff4f5', borde: '#fcd5dc', circulo: '#ffe1e6', icono: '#e11d48' },
  violeta: { fondo: '#f6f4ff', borde: '#e0dafd', circulo: '#e6e0ff', icono: '#6d4ee8' },
};

// Numeros de ancho fijo para conteos y fechas.
const tabular = { fontVariant: ['tabular-nums'] };

// Colores de badge (fondo claro + texto oscuro) como en el web.
export const BADGES = {
  gris: { bg: '#eff3fa', fg: '#4a5875' },
  azul: { bg: '#dbe8ff', fg: '#0a4fc4' },
  verde: { bg: '#dcfce7', fg: '#15803d' },
  rojo: { bg: '#ffe4e8', fg: '#be123c' },
  ambar: { bg: '#fef3c7', fg: '#b45309' },
  primario: { bg: '#eaf2ff', fg: '#0a4fc4' },
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
  if (dias < 0) return `Vencio hace ${Math.abs(dias)} d`;
  if (dias === 0) return 'Vence hoy';
  if (dias === 1) return 'Vence manana';
  if (dias <= 7) return `Vence en ${dias} dias`;
  return '';
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

// Marca: isotipo + "Task" en azul marino y "Edu" en azul (o blanco + celeste sobre fondo azul).
export function Marca({ grande, claro }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Logo tamano={grande ? 44 : 36} />
      <Text style={{ fontWeight: '800', fontSize: grande ? 24 : 21, color: claro ? '#fff' : colors.tinta, letterSpacing: -0.6 }}>
        Task<Text style={{ color: claro ? colors.acento : colors.primario }}>Edu</Text>
      </Text>
    </View>
  );
}

export function Avatar({ nombre = '', tamano = 38 }) {
  const iniciales = nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? '')
    .join('');
  return (
    <View style={[s.avatar, { width: tamano, height: tamano, borderRadius: tamano / 2 }]}>
      <Text style={{ color: colors.primarioOscuro, fontWeight: '700', fontSize: tamano / 2.6 }}>{iniciales}</Text>
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
        kind === 'secundario' && { borderColor: colors.borde },
        small && s.btnSm,
        { backgroundColor: bg, opacity: disabled ? 0.5 : 1 },
      ]}
    >
      {cargando ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <>
          {icono ? <Icon nombre={icono} tamano={small ? 16 : 18} color={fg} /> : null}
          <Text style={{ color: fg, fontWeight: '600', fontSize: small ? 13 : 15 }}>{title}</Text>
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

export function Chip({ label, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[s.chip, active && { backgroundColor: colors.primario, borderColor: colors.primario }]}
    >
      <Text style={{ color: active ? '#fff' : colors.texto, fontSize: 13, fontWeight: active ? '600' : '400' }}>{label}</Text>
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
          backgroundColor: color === 'verde' ? colors.verde : colors.primario,
          transitionProperty: 'width',
          transitionDuration: 300,
          transitionTimingFunction: 'ease-out',
        }}
      />
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
  const fg = info ? '#1e40af' : '#991b1b';
  return (
    <View
      accessibilityRole="alert"
      style={[
        s.alerta,
        {
          backgroundColor: info ? colors.azulClaro : colors.rojoClaro,
          borderColor: info ? '#bfdbfe' : colors.rojoBorde,
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
    backgroundColor: colors.primarioClaro,
    borderWidth: 1,
    borderColor: colors.primarioBorde,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tarjeta: {
    backgroundColor: colors.superficie,
    borderRadius: 18,
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
    borderRadius: 10,
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  btnSm: { minHeight: 36, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 9, gap: 6 },
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
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    fontSize: 15,
    backgroundColor: '#fff',
    color: colors.texto,
  },
  entradaEnfocada: {
    borderColor: colors.primario,
    backgroundColor: '#fcfcff',
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
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
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
    paddingVertical: 6,
    paddingHorizontal: 12,
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
    width: 56,
    height: 56,
    borderRadius: 16,
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
    top: 9,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.rojo,
    borderWidth: 2,
    borderColor: colors.superficie,
  },
  tabbar: {
    flexDirection: 'row',
    backgroundColor: colors.superficie,
    paddingTop: 8,
    paddingHorizontal: 10,
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
