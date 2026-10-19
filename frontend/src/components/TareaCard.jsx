import Badge from './ui/Badge'
import { metaEstado, metaPrioridad, OPCIONES_ESTADO } from '../utils/constantes'
import { formatearFecha, etiquetaVencimiento } from '../utils/fechas'

export default function TareaCard({ tarea, onEditar, onEliminar, onCambiarEstado, guardando = false }) {
  const estado = metaEstado(tarea.estado)
  const prioridad = metaPrioridad(tarea.prioridad)
  const aviso = etiquetaVencimiento(tarea)

  return (
    <article className={`tarea ${tarea.vencida ? 'tarea--vencida' : ''}`}>
      <div className="tarea__cabecera">
        <h3 className="tarea__titulo">{tarea.titulo}</h3>
        <Badge color={prioridad.color} punto>
          {prioridad.etiqueta}
        </Badge>
      </div>

      <div className="tarea__meta">
        <span className="tarea__curso" title="Curso">▦ {tarea.curso_nombre}</span>
        <span className="tarea__fecha" title="Fecha de entrega">🗓 {formatearFecha(tarea.fecha_entrega)}</span>
      </div>

      {tarea.descripcion && <p className="tarea__descripcion">{tarea.descripcion}</p>}

      <div className="tarea__etiquetas">
        <Badge color={estado.color}>{estado.etiqueta}</Badge>
        {tarea.vencida && <Badge color="rojo">Vencida</Badge>}
        {!tarea.vencida && aviso && <Badge color="ambar">{aviso}</Badge>}
      </div>

      <div className="tarea__acciones">
        <select
          className="tarea__estado"
          value={tarea.estado}
          disabled={guardando}
          onChange={(event) => onCambiarEstado(tarea, event.target.value)}
          aria-label="Cambiar estado"
        >
          {OPCIONES_ESTADO.map((opcion) => (
            <option key={opcion.valor} value={opcion.valor}>
              {opcion.etiqueta}
            </option>
          ))}
        </select>
        <div className="tarea__botones">
          <button type="button" className="btn-icono" onClick={() => onEditar(tarea)} aria-label="Editar tarea">
            Editar
          </button>
          <button
            type="button"
            className="btn-icono btn-icono--peligro"
            onClick={() => onEliminar(tarea)}
            aria-label="Eliminar tarea"
          >
            Eliminar
          </button>
        </div>
      </div>
    </article>
  )
}
