import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export const colors = {
  bg: '#f4f6fb', surface: '#fff', text: '#1d2433', muted: '#5d6679', border: '#dde2ee',
  primary: '#3b5bdb', danger: '#d63b3b', ok: '#2b8a3e', warn: '#e67700',
};

export const ESTADOS = { pendiente: 'Pendiente', en_progreso: 'En progreso', completada: 'Completada' };
export const PRIORIDADES = { baja: 'Baja', media: 'Media', alta: 'Alta' };
const PRIO_COLOR = { alta: '#d63b3b', media: '#e67700', baja: '#2b8a3e' };

export const formatFecha = (iso) =>
  new Date(iso).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' });

// ISO -> "AAAA-MM-DD HH:MM" (hora local)
export function isoATexto(iso) {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// "AAAA-MM-DD HH:MM" -> ISO, o null si no es valido
export function textoAIso(texto) {
  const m = texto.trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/);
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function Button({ title, onPress, kind = 'default', small, disabled }) {
  const bg = kind === 'primary' ? colors.primary : kind === 'danger' ? colors.danger : colors.surface;
  const fg = kind === 'default' ? colors.text : '#fff';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[s.btn, small && s.btnSm, { backgroundColor: bg, opacity: disabled ? 0.5 : 1 }]}
    >
      <Text style={{ color: fg, fontWeight: '600', fontSize: small ? 13 : 15 }}>{title}</Text>
    </Pressable>
  );
}

export function Field({ label, ...props }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput style={[s.input, props.multiline && { height: 80, textAlignVertical: 'top' }]} placeholderTextColor="#9aa3b5" {...props} />
    </View>
  );
}

export function Chip({ label, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
      <Text style={{ color: active ? '#fff' : colors.text, fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

export const Badge = ({ prioridad }) => (
  <Text style={[s.badge, { backgroundColor: PRIO_COLOR[prioridad] }]}>{PRIORIDADES[prioridad]}</Text>
);

export const Loading = () => <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} size="large" />;
export const ErrorMsg = ({ children }) => (children ? <Text style={s.error}>{children}</Text> : null);
export const Empty = ({ children }) => <Text style={s.empty}>{children}</Text>;

export const s = StyleSheet.create({
  btn: { paddingVertical: 11, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  btnSm: { paddingVertical: 6, paddingHorizontal: 10 },
  label: { fontWeight: '600', marginBottom: 4, color: colors.text, fontSize: 13 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, backgroundColor: colors.surface, fontSize: 15, color: colors.text },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 99, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, marginRight: 8 },
  badge: { color: '#fff', fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99, overflow: 'hidden' },
  error: { backgroundColor: '#ffe3e3', color: '#a61e1e', padding: 10, borderRadius: 8, marginBottom: 12 },
  empty: { textAlign: 'center', color: colors.muted, padding: 28 },
  card: { backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 12, marginBottom: 10 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 12 },
  h3: { fontSize: 16, fontWeight: '700', color: colors.text, flexShrink: 1 },
  muted: { color: colors.muted, fontSize: 13, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
});
