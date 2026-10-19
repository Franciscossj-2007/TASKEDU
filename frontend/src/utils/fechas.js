export function formatearFecha(valor) {
  if (!valor) return 'Sin fecha'
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return 'Fecha invalida'
  return fecha.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatearFechaHora(valor) {
  if (!valor) return 'Sin fecha'
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return 'Fecha invalida'
  return fecha.toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function paraInputDatetime(valor) {
  if (!valor) return ''
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return ''
  const offset = fecha.getTimezoneOffset()
  const local = new Date(fecha.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

export function diasRestantes(valor) {
  if (!valor) return null
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return null
  const ahora = new Date()
  const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
  const inicioFecha = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
  return Math.round((inicioFecha - inicioHoy) / 86400000)
}

export function etiquetaVencimiento(tarea) {
  const dias = diasRestantes(tarea.fecha_entrega)
  if (dias === null) return ''
  if (tarea.estado === 'completada') return ''
  if (dias < 0) return `Vencio hace ${Math.abs(dias)} d`
  if (dias === 0) return 'Vence hoy'
  if (dias === 1) return 'Vence manana'
  if (dias <= 7) return `Vence en ${dias} dias`
  return ''
}
