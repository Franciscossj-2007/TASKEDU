import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

// Paleta identica a las variables CSS del frontend web (src/index.css).
export const colors = {
  primario: '#4f46e5',
  primarioOscuro: '#4338ca',
  primarioClaro: '#eef2ff',
  fondo: '#f5f6fb',
  superficie: '#ffffff',
  texto: '#1f2937',
  textoSuave: '#6b7280',
  borde: '#e5e7eb',
  rojo: '#dc2626',
  rojoClaro: '#fee2e2',
  verde: '#16a34a',
  verdeClaro: '#dcfce7',
  ambar: '#b45309',
  ambarClaro: '#fef3c7',
  azul: '#2563eb',
  azulClaro: '#dbeafe',
  gris: '#6b7280',
  grisClaro: '#f3f4f6',
  sidebar: '#1e1b4b',
  sidebarTexto: '#e0e7ff',
  sidebarEnlace: '#c7d2fe',
};

// Colores de badge (fondo claro + texto oscuro) como en el web.
export const BADGES = {
  gris: { bg: '#f3f4f6', fg: '#4b5563' },
  azul: { bg: '#dbeafe', fg: '#1e40af' },
  verde: { bg: '#dcfce7', fg: '#15803d' },
  rojo: { bg: '#fee2e2', fg: '#991b1b' },
  ambar: { bg: '#fef3c7', fg: '#b45309' },
  primario: { bg: '#eef2ff', fg: '#4338ca' },
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

// Marca "✓ TaskEdu" igual a .marca del web.
export function Marca({ grande }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={[s.logo, grande && { width: 44, height: 44, borderRadius: 12, fontSize: 24 }]}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: grande ? 24 : 20 }}>✓</Text>
      </View>
      <Text style={{ fontWeight: '700', fontSize: grande ? 22 : 20, color: colors.texto, letterSpacing: -0.4 }}>
        TaskEdu
      </Text>
    </View>
  );
}

export function Avatar({ nombre = '', tamano }) {
  const iniciales = nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? '')
    .join('');
  return (
    <View style={[s.avatar, tamano && { width: tamano, height: tamano, fontSize: tamano / 2.6 }]}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: tamano ? tamano / 2.6 : 14 }}>{iniciales}</Text>
    </View>
  );
}

export function Button({ title, onPress, kind = 'primario', small, bloque, cargando, disabled }) {
  const bg =
    kind === 'primario' ? colors.primario :
    kind === 'peligro' ? colors.rojo :
    kind === 'secundario' ? colors.superficie :
    'transparent';
  const fg =
    kind === 'primario' || kind === 'peligro' ? '#fff' :
    kind === 'fantasma' ? colors.textoSuave :
    colors.texto;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || cargando}
      style={({ pressed }) => [
        s.btn,
        kind === 'secundario' && { borderColor: colors.borde },
        small && s.btnSm,
        bloque && { width: '100%' },
        { backgroundColor: bg, opacity: disabled || cargando ? 0.6 : pressed ? 0.85 : 1 },
      ]}
    >
      {cargando ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <Text style={{ color: fg, fontWeight: '600', fontSize: small ? 13 : 14 }}>{title}</Text>
      )}
    </Pressable>
  );
}

// Campo con etiqueta, asterisco de requerido, ayuda y error, como .campo del web.
export function Field({ label, requerido, error, ayuda, style, ...props }) {
  return (
    <View style={[{ marginBottom: 16 }, style]}>
      <Text style={s.label}>
        {label}
        {requerido ? <Text style={{ color: colors.rojo }}> *</Text> : null}
      </Text>
      <TextInput
        placeholderTextColor="#9ca3af"
        {...props}
        style={[s.entrada, props.multiline && { height: 88, textAlignVertical: 'top' }, error && { borderColor: colors.rojo }]}
      />
      {ayuda ? <Text style={s.ayuda}>{ayuda}</Text> : null}
      {error ? <Text style={s.errorCampo}>{error}</Text> : null}
    </View>
  );
}

// Select modal (equivalente al <select> del web).
export function SelectCampo({ label, requerido, value, opciones, placeholder = 'Selecciona', onChange, error }) {
  const actual = opciones.find((o) => String(o.valor) === String(value));
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={s.label}>
        {label}
        {requerido ? <Text style={{ color: colors.rojo }}> *</Text> : null}
      </Text>
      <SelectValor value={value} opciones={opciones} placeholder={placeholder} onChange={onChange} error={error} />
      {error ? <Text style={s.errorCampo}>{error}</Text> : null}
    </View>
  );
}

export function SelectValor({ value, opciones, placeholder = 'Selecciona', onChange, error, compacto }) {
  const [abierto, setAbierto] = useState(false);
  const actual = opciones.find((o) => String(o.valor) === String(value));
  return (
    <>
      <Pressable
        onPress={() => setAbierto(true)}
        style={[compacto ? s.selectCompacto : s.entrada, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, error && { borderColor: colors.rojo }]}
      >
        <Text style={{ fontSize: compacto ? 13 : 14, color: actual ? colors.texto : '#9ca3af' }}>
          {actual ? actual.etiqueta : placeholder}
        </Text>
        <Text style={{ color: colors.textoSuave, fontSize: 12 }}>▾</Text>
      </Pressable>
      <Modal visible={abierto} transparent animationType="fade" onRequestClose={() => setAbierto(false)}>
        <Pressable style={s.modalVelado} onPress={() => setAbierto(false)}>
          <View style={s.selectCaja}>
            {opciones.map((o) => {
              const activo = String(o.valor) === String(value);
              return (
                <Pressable
                  key={o.valor}
                  onPress={() => { setAbierto(false); onChange?.(o.valor); }}
                  style={[s.selectFila, activo && { backgroundColor: colors.primarioClaro }]}
                >
                  <Text style={{ fontSize: 15, color: activo ? colors.primarioOscuro : colors.texto, fontWeight: activo ? '700' : '400' }}>
                    {o.etiqueta}
                  </Text>
                  {activo ? <Text style={{ color: colors.primario }}>✓</Text> : null}
                </Pressable>
              );
            })}
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

export function Progreso({ valor, max, color = 'primario' }) {
  const total = max || 1;
  const porcentaje = Math.max(0, Math.min(100, (valor / total) * 100));
  return (
    <View style={s.progreso}>
      <View style={{ height: 8, borderRadius: 999, width: `${porcentaje}%`, backgroundColor: color === 'verde' ? colors.verde : colors.primario }} />
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
  return (
    <View
      style={[
        s.alerta,
        {
          backgroundColor: info ? colors.azulClaro : colors.rojoClaro,
          borderColor: info ? '#bfdbfe' : '#fecaca',
        },
      ]}
    >
      {titulo ? <Text style={{ fontWeight: '700', marginBottom: 2, color: info ? '#1e40af' : '#991b1b' }}>{titulo}</Text> : null}
      <Text style={{ fontSize: 14, color: info ? '#1e40af' : '#991b1b' }}>{children}</Text>
    </View>
  );
}

// Estado vacio con icono, titulo, mensaje y accion, como EstadoVacio del web.
export function Vacio({ icono, titulo, mensaje, children }) {
  return (
    <View style={{ alignItems: 'center', padding: 32 }}>
      {icono ? <Text style={{ fontSize: 40, marginBottom: 12 }}>{icono}</Text> : null}
      <Text style={{ fontSize: 18, fontWeight: '600', color: colors.texto, marginBottom: 6 }}>{titulo}</Text>
      <Text style={{ fontSize: 14, color: colors.textoSuave, textAlign: 'center', marginBottom: 18 }}>{mensaje}</Text>
      {children}
    </View>
  );
}

// Modal con cabecera, cuerpo y pie, como .modal del web.
export function ModalUI({ visible, titulo, onCerrar, children, pie }) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCerrar}>
      <View style={{ flex: 1, backgroundColor: colors.fondo, padding: 16, paddingTop: 48 }}>
        <View style={s.modal}>
          <View style={s.modalCabecera}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.texto }}>{titulo}</Text>
            <Pressable onPress={onCerrar} hitSlop={10}>
              <Text style={{ fontSize: 26, lineHeight: 28, color: colors.textoSuave }}>×</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          {pie ? <View style={s.modalPie}>{pie}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

export const s = StyleSheet.create({
  logo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primario,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primario,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sombra: {
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  tarjeta: {
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: 12,
    padding: 18,
    marginBottom: 14,
  },
  paginaTitulo: { fontSize: 26, fontWeight: '700', color: colors.texto, letterSpacing: -0.5 },
  paginaSubtitulo: { fontSize: 14, color: colors.textoSuave, marginTop: 4 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  btnSm: { paddingVertical: 7, paddingHorizontal: 12 },
  label: { fontSize: 13, fontWeight: '600', color: colors.texto, marginBottom: 6 },
  ayuda: { fontSize: 12, color: colors.textoSuave, marginTop: 4 },
  errorCampo: { fontSize: 12, color: colors.rojo, fontWeight: '500', marginTop: 4 },
  entrada: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    color: colors.texto,
  },
  selectCompacto: {
    borderWidth: 1,
    borderColor: colors.borde,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    minWidth: 120,
  },
  modalVelado: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  selectCaja: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', paddingVertical: 6 },
  selectFila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 16,
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
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.superficie,
    borderBottomWidth: 1,
    borderBottomColor: colors.borde,
  },
  tabbar: {
    flexDirection: 'row',
    backgroundColor: colors.sidebar,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    gap: 2,
  },
  tabActivo: {
    backgroundColor: colors.primario,
    borderRadius: 10,
    margin: 6,
    paddingVertical: 8,
  },
  authMarca: {
    backgroundColor: colors.primario,
    padding: 32,
    paddingTop: 48,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    gap: 16,
  },
  authTitulo: { fontSize: 28, fontWeight: '700', color: '#fff', lineHeight: 34, letterSpacing: -0.5 },
  authTexto: { fontSize: 15, color: '#fff', opacity: 0.9, lineHeight: 22 },
  authItem: { flexDirection: 'row', gap: 10, fontSize: 14, color: '#fff' },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    maxWidth: 520,
    maxHeight: '92%',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  modalCabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borde,
  },
  modalPie: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: colors.borde,
  },
  fila: { flexDirection: 'row', gap: 12 },
  filaItem: { flex: 1 },
});
