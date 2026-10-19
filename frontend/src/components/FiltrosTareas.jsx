import Input from './ui/Input'
import Select from './ui/Select'
import { OPCIONES_ESTADO, OPCIONES_PRIORIDAD } from '../utils/constantes'

const OPCIONES_VENCIMIENTO = [
  { valor: 'proximas', etiqueta: 'Proximas (7 dias)' },
  { valor: 'vencidas', etiqueta: 'Vencidas' },
]

const OPCIONES_ORDEN = [
  { valor: 'fecha_entrega', etiqueta: 'Fecha de entrega' },
  { valor: 'prioridad', etiqueta: 'Prioridad' },
  { valor: 'creado_en', etiqueta: 'Fecha de creacion' },
]

const OPCIONES_DIR = [
  { valor: 'asc', etiqueta: 'Ascendente' },
  { valor: 'desc', etiqueta: 'Descendente' },
]

export default function FiltrosTareas({ filtros, cursos, onCambiar, onLimpiar }) {
  const opcionesCursos = cursos.map((curso) => ({ valor: String(curso.id), etiqueta: curso.nombre }))
  const hayFiltros = Object.values(filtros).some((valor) => valor !== '')

  return (
    <div className="filtros">
      <div className="filtros__busqueda">
        <Input
          id="busqueda"
          etiqueta="Buscar por titulo"
          value={filtros.busqueda}
          onChange={(event) => onCambiar('busqueda', event.target.value)}
          placeholder="Escribe para buscar..."
        />
      </div>

      <Select
        id="f-estado"
        etiqueta="Estado"
        value={filtros.estado}
        onChange={(event) => onCambiar('estado', event.target.value)}
        opciones={OPCIONES_ESTADO}
        placeholder="Todos"
      />

      <Select
        id="f-prioridad"
        etiqueta="Prioridad"
        value={filtros.prioridad}
        onChange={(event) => onCambiar('prioridad', event.target.value)}
        opciones={OPCIONES_PRIORIDAD}
        placeholder="Todas"
      />

      <Select
        id="f-curso"
        etiqueta="Curso"
        value={filtros.curso_id}
        onChange={(event) => onCambiar('curso_id', event.target.value)}
        opciones={opcionesCursos}
        placeholder="Todos"
      />

      <Select
        id="f-vencimiento"
        etiqueta="Vencimiento"
        value={filtros.vencimiento}
        onChange={(event) => onCambiar('vencimiento', event.target.value)}
        opciones={OPCIONES_VENCIMIENTO}
        placeholder="Cualquiera"
      />

      <Select
        id="f-orden"
        etiqueta="Ordenar por"
        value={filtros.orden}
        onChange={(event) => onCambiar('orden', event.target.value)}
        opciones={OPCIONES_ORDEN}
      />

      <Select
        id="f-dir"
        etiqueta="Direccion"
        value={filtros.dir}
        onChange={(event) => onCambiar('dir', event.target.value)}
        opciones={OPCIONES_DIR}
      />

      {hayFiltros && (
        <div className="filtros__limpiar">
          <button type="button" className="btn btn--fantasma btn--sm" onClick={onLimpiar}>
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  )
}
