export default function EstadoVacio({ titulo, mensaje, accion, icono = '📭' }) {
  return (
    <div className="vacio">
      <span className="vacio__icono" aria-hidden="true">{icono}</span>
      <h3 className="vacio__titulo">{titulo}</h3>
      {mensaje && <p className="vacio__texto">{mensaje}</p>}
      {accion && <div className="vacio__accion">{accion}</div>}
    </div>
  )
}
