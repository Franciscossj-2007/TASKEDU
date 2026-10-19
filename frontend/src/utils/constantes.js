export const ESTADOS = [
  { valor: 'pendiente', etiqueta: 'Pendiente', color: 'gris' },
  { valor: 'en_progreso', etiqueta: 'En progreso', color: 'azul' },
  { valor: 'completada', etiqueta: 'Completada', color: 'verde' },
]

export const PRIORIDADES = [
  { valor: 'baja', etiqueta: 'Baja', color: 'verde' },
  { valor: 'media', etiqueta: 'Media', color: 'ambar' },
  { valor: 'alta', etiqueta: 'Alta', color: 'rojo' },
]

export const OPCIONES_ESTADO = ESTADOS.map((e) => ({ valor: e.valor, etiqueta: e.etiqueta }))
export const OPCIONES_PRIORIDAD = PRIORIDADES.map((p) => ({ valor: p.valor, etiqueta: p.etiqueta }))

export function metaEstado(valor) {
  return ESTADOS.find((e) => e.valor === valor) ?? { etiqueta: valor, color: 'gris' }
}

export function metaPrioridad(valor) {
  return PRIORIDADES.find((p) => p.valor === valor) ?? { etiqueta: valor, color: 'gris' }
}
