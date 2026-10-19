import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { cursosService } from '../services/cursos.service'
import { tareasService } from '../services/tareas.service'
import { normalizarError } from '../services/api'
import { useToast } from '../context/ToastContext'
import CursoFormulario from '../components/CursoFormulario'
import TareaFormulario from '../components/TareaFormulario'
import TareaCard from '../components/TareaCard'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Spinner from '../components/ui/Spinner'
import Alerta from '../components/ui/Alerta'
import EstadoVacio from '../components/ui/EstadoVacio'
import Button from '../components/ui/Button'

export default function CursoDetalle() {
  const { id } = useParams()
  const toast = useToast()
  const navegar = useNavigate()

  const [curso, setCurso] = useState(null)
  const [tareas, setTareas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [estadoEnProceso, setEstadoEnProceso] = useState(null)

  const [modalCurso, setModalCurso] = useState(false)
  const [modalTarea, setModalTarea] = useState({ abierto: false, tarea: null })
  const [confirmarTarea, setConfirmarTarea] = useState({ abierto: false, tarea: null, eliminando: false })
  const [confirmarCurso, setConfirmarCurso] = useState(false)
  const [borrandoCurso, setBorrandoCurso] = useState(false)

  async function cargar() {
    setCargando(true)
    setError('')
    try {
      const [datosCurso, datosTareas] = await Promise.all([
        cursosService.obtener(id),
        cursosService.tareas(id),
      ])
      setCurso(datosCurso)
      setTareas(datosTareas)
    } catch (err) {
      setError(normalizarError(err).mensaje)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [id])

  async function cambiarEstado(tarea, estado) {
    setEstadoEnProceso(tarea.id)
    try {
      const actualizada = await tareasService.cambiarEstado(tarea.id, estado)
      setTareas((actual) =>
        actual.map((t) =>
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
      )
      toast.exito('Estado actualizado')
    } catch (err) {
      toast.error(normalizarError(err).mensaje)
    } finally {
      setEstadoEnProceso(null)
    }
  }

  async function eliminarTarea() {
    const tarea = confirmarTarea.tarea
    if (!tarea) return
    setConfirmarTarea((actual) => ({ ...actual, eliminando: true }))
    try {
      await tareasService.eliminar(tarea.id)
      setTareas((actual) => actual.filter((t) => t.id !== tarea.id))
      toast.exito('Tarea eliminada')
      setConfirmarTarea({ abierto: false, tarea: null, eliminando: false })
    } catch (err) {
      toast.error(normalizarError(err).mensaje)
      setConfirmarTarea((actual) => ({ ...actual, eliminando: false }))
    }
  }

  async function eliminarCurso() {
    setBorrandoCurso(true)
    try {
      await cursosService.eliminar(id)
      toast.exito('Curso eliminado')
      navegar('/cursos', { replace: true })
    } catch (err) {
      toast.error(normalizarError(err).mensaje)
      setBorrandoCurso(false)
      setConfirmarCurso(false)
    }
  }

  if (cargando) {
    return (
      <div className="pantalla-carga">
        <Spinner tamano="lg" etiqueta="Cargando curso" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="pagina">
        <Alerta tipo="error" titulo="No se pudo cargar el curso">{error}</Alerta>
        <Link to="/cursos" className="btn btn--secundario">
          Volver a cursos
        </Link>
      </div>
    )
  }

  return (
    <div className="pagina">
      <Link to="/cursos" className="enlace-volver">
        ← Volver a cursos
      </Link>

      <header className="pagina__cabecera">
        <div>
          <h1 className="pagina__titulo">{curso?.nombre}</h1>
          {curso?.docente && <p className="pagina__subtitulo">Docente: {curso.docente}</p>}
        </div>
        <div className="pagina__acciones">
          <Button variante="secundario" onClick={() => setModalCurso(true)}>
            Editar curso
          </Button>
          <Button variante="peligro" onClick={() => setConfirmarCurso(true)}>
            Eliminar curso
          </Button>
          <Button onClick={() => setModalTarea({ abierto: true, tarea: null })}>Nueva tarea</Button>
        </div>
      </header>

      {curso?.descripcion && <p className="curso-detalle__descripcion">{curso.descripcion}</p>}

      <h2 className="bloque__titulo bloque__titulo--seccion">Tareas del curso ({tareas.length})</h2>

      {tareas.length === 0 ? (
        <EstadoVacio
          icono="📝"
          titulo="Este curso no tiene tareas"
          mensaje="Crea una tarea para este curso."
          accion={<Button onClick={() => setModalTarea({ abierto: true, tarea: null })}>Crear tarea</Button>}
        />
      ) : (
        <div className="tareas-grid">
          {tareas.map((tarea) => (
            <TareaCard
              key={tarea.id}
              tarea={tarea}
              guardando={estadoEnProceso === tarea.id}
              onEditar={(t) => setModalTarea({ abierto: true, tarea: t })}
              onEliminar={(t) => setConfirmarTarea({ abierto: true, tarea: t, eliminando: false })}
              onCambiarEstado={cambiarEstado}
            />
          ))}
        </div>
      )}

      <CursoFormulario
        abierto={modalCurso}
        curso={curso}
        onCerrar={() => setModalCurso(false)}
        onGuardado={cargar}
      />

      <TareaFormulario
        abierto={modalTarea.abierto}
        tarea={modalTarea.tarea}
        cursos={curso ? [curso] : []}
        onCerrar={() => setModalTarea({ abierto: false, tarea: null })}
        onGuardado={cargar}
      />

      <ConfirmDialog
        abierto={confirmarTarea.abierto}
        titulo="Eliminar tarea"
        mensaje={`Seguro que deseas eliminar la tarea "${confirmarTarea.tarea?.titulo ?? ''}"?`}
        textoConfirmar="Eliminar"
        cargando={confirmarTarea.eliminando}
        onConfirmar={eliminarTarea}
        onCancelar={() => setConfirmarTarea({ abierto: false, tarea: null, eliminando: false })}
      />

      <ConfirmDialog
        abierto={confirmarCurso}
        titulo="Eliminar curso"
        mensaje="Se eliminara el curso y todas sus tareas. Esta accion no se puede deshacer."
        textoConfirmar="Eliminar"
        cargando={borrandoCurso}
        onConfirmar={eliminarCurso}
        onCancelar={() => setConfirmarCurso(false)}
      />
    </div>
  )
}
