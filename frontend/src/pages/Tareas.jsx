import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { tareasService } from '../services/tareas.service'
import { cursosService } from '../services/cursos.service'
import { normalizarError } from '../services/api'
import { useToast } from '../context/ToastContext'
import FiltrosTareas from '../components/FiltrosTareas'
import TareaCard from '../components/TareaCard'
import TareaFormulario from '../components/TareaFormulario'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Spinner from '../components/ui/Spinner'
import Alerta from '../components/ui/Alerta'
import EstadoVacio from '../components/ui/EstadoVacio'
import Button from '../components/ui/Button'

const LIMITE = 9

const FILTROS_INICIALES = {
  busqueda: '',
  estado: '',
  prioridad: '',
  curso_id: '',
  vencimiento: '',
  orden: 'fecha_entrega',
  dir: 'asc',
}

export default function Tareas() {
  const toast = useToast()

  const [cursos, setCursos] = useState([])
  const [filtros, setFiltros] = useState(FILTROS_INICIALES)
  const [busquedaDebounced, setBusquedaDebounced] = useState('')
  const [page, setPage] = useState(1)
  const [recarga, setRecarga] = useState(0)

  const [datos, setDatos] = useState({ tareas: [], total: 0 })
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [modal, setModal] = useState({ abierto: false, tarea: null })
  const [confirmar, setConfirmar] = useState({ abierto: false, tarea: null, eliminando: false })
  const [estadoEnProceso, setEstadoEnProceso] = useState(null)

  useEffect(() => {
    let activo = true
    cursosService
      .listar()
      .then((lista) => {
        if (activo) setCursos(lista)
      })
      .catch(() => {})
    return () => {
      activo = false
    }
  }, [])

  useEffect(() => {
    const id = setTimeout(() => {
      setBusquedaDebounced(filtros.busqueda)
      setPage(1)
    }, 400)
    return () => clearTimeout(id)
  }, [filtros.busqueda])

  useEffect(() => {
    let activo = true
    setCargando(true)
    setError('')

    tareasService
      .listar({ ...filtros, busqueda: busquedaDebounced, page, limit: LIMITE })
      .then((res) => {
        if (activo) setDatos({ tareas: res.tareas, total: res.total })
      })
      .catch((err) => {
        if (activo) setError(normalizarError(err).mensaje)
      })
      .finally(() => {
        if (activo) setCargando(false)
      })

    return () => {
      activo = false
    }
  }, [
    filtros.estado,
    filtros.prioridad,
    filtros.curso_id,
    filtros.vencimiento,
    filtros.orden,
    filtros.dir,
    busquedaDebounced,
    page,
    recarga,
  ])

  const totalPaginas = Math.max(1, Math.ceil(datos.total / LIMITE))
  const hayFiltros = useMemo(
    () => Object.entries(filtros).some(([clave, valor]) => clave !== 'orden' && clave !== 'dir' && valor !== ''),
    [filtros],
  )

  function cambiar(campo, valor) {
    setFiltros((actual) => ({ ...actual, [campo]: valor }))
    if (campo !== 'busqueda') setPage(1)
  }

  function limpiar() {
    setFiltros(FILTROS_INICIALES)
    setPage(1)
  }

  function recargar() {
    setRecarga((n) => n + 1)
  }

  function abrirNueva() {
    if (cursos.length === 0) {
      toast.info('Primero crea un curso')
      return
    }
    setModal({ abierto: true, tarea: null })
  }

  async function cambiarEstado(tarea, estado) {
    setEstadoEnProceso(tarea.id)
    try {
      const actualizada = await tareasService.cambiarEstado(tarea.id, estado)
      setDatos((actual) => ({
        ...actual,
        tareas: actual.tareas.map((t) =>
          t.id === actualizada.id
            ? {
                ...t,
                ...actualizada,
                curso_nombre: t.curso_nombre,
                vencida:
                  actualizada.estado !== 'completada' &&
                  new Date(actualizada.fecha_entrega) < new Date(),
              }
            : t,
        ),
      }))
      toast.exito('Estado actualizado')
    } catch (err) {
      toast.error(normalizarError(err).mensaje)
    } finally {
      setEstadoEnProceso(null)
    }
  }

  async function eliminarTarea() {
    const tarea = confirmar.tarea
    if (!tarea) return
    setConfirmar((actual) => ({ ...actual, eliminando: true }))
    try {
      await tareasService.eliminar(tarea.id)
      toast.exito('Tarea eliminada')
      setConfirmar({ abierto: false, tarea: null, eliminando: false })
      recargar()
    } catch (err) {
      toast.error(normalizarError(err).mensaje)
      setConfirmar((actual) => ({ ...actual, eliminando: false }))
    }
  }

  return (
    <div className="pagina">
      <header className="pagina__cabecera">
        <div>
          <h1 className="pagina__titulo">Mis tareas</h1>
          <p className="pagina__subtitulo">Filtra, ordena y gestiona tus tareas academicas</p>
        </div>
        <Button onClick={abrirNueva}>Nueva tarea</Button>
      </header>

      {cursos.length === 0 && (
        <Alerta tipo="info">
          Aun no tienes cursos. <Link to="/cursos">Crea un curso</Link> antes de registrar tareas.
        </Alerta>
      )}

      <FiltrosTareas filtros={filtros} cursos={cursos} onCambiar={cambiar} onLimpiar={limpiar} />

      {error && <Alerta tipo="error" titulo="No se pudieron cargar las tareas">{error}</Alerta>}

      {cargando ? (
        <div className="pantalla-carga">
          <Spinner tamano="lg" etiqueta="Cargando tareas" />
        </div>
      ) : datos.tareas.length === 0 ? (
        <EstadoVacio
          icono={hayFiltros ? '🔍' : '📝'}
          titulo={hayFiltros ? 'Sin resultados' : 'Aun no tienes tareas'}
          mensaje={
            hayFiltros
              ? 'Prueba ajustando o limpiando los filtros.'
              : 'Crea tu primera tarea para empezar a organizarte.'
          }
          accion={
            hayFiltros ? (
              <Button variante="secundario" onClick={limpiar}>
                Limpiar filtros
              </Button>
            ) : (
              <Button onClick={abrirNueva} disabled={cursos.length === 0}>
                Crear tarea
              </Button>
            )
          }
        />
      ) : (
        <>
          <p className="resultado-conteo">
            Mostrando {datos.tareas.length} de {datos.total} tareas
          </p>
          <div className="tareas-grid">
            {datos.tareas.map((tarea) => (
              <TareaCard
                key={tarea.id}
                tarea={tarea}
                guardando={estadoEnProceso === tarea.id}
                onEditar={(t) => setModal({ abierto: true, tarea: t })}
                onEliminar={(t) => setConfirmar({ abierto: true, tarea: t, eliminando: false })}
                onCambiarEstado={cambiarEstado}
              />
            ))}
          </div>

          {totalPaginas > 1 && (
            <nav className="paginacion" aria-label="Paginacion">
              <Button
                variante="secundario"
                tamano="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Anterior
              </Button>
              <span className="paginacion__info">
                Pagina {page} de {totalPaginas}
              </span>
              <Button
                variante="secundario"
                tamano="sm"
                onClick={() => setPage((p) => Math.min(totalPaginas, p + 1))}
                disabled={page >= totalPaginas}
              >
                Siguiente
              </Button>
            </nav>
          )}
        </>
      )}

      <TareaFormulario
        abierto={modal.abierto}
        tarea={modal.tarea}
        cursos={cursos}
        onCerrar={() => setModal({ abierto: false, tarea: null })}
        onGuardado={recargar}
      />

      <ConfirmDialog
        abierto={confirmar.abierto}
        titulo="Eliminar tarea"
        mensaje={`Seguro que deseas eliminar la tarea "${confirmar.tarea?.titulo ?? ''}"? Esta accion no se puede deshacer.`}
        textoConfirmar="Eliminar"
        cargando={confirmar.eliminando}
        onConfirmar={eliminarTarea}
        onCancelar={() => setConfirmar({ abierto: false, tarea: null, eliminando: false })}
      />
    </div>
  )
}
