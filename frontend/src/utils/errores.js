export function mapaErrores(detalles = []) {
  return detalles.reduce((acc, detalle) => {
    if (detalle?.campo) {
      acc[detalle.campo] = detalle.mensaje
    }
    return acc
  }, {})
}
