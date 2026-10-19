import { useEffect, useState } from 'react'
import { cursosService } from '../services/cursos.service'
import { normalizarError } from '../services/api'
import { useToast } from '../context/ToastContext'
import CursoCard from '../components/CursoCard'
import CursoFormulario from '../components/CursoFormulario'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Spinner from '../components/ui/Spinner'
import Alerta from '../components/ui/Alerta'
import EstadoVacio from '../components/ui/EstadoVacio'
import Button from '../components/ui/Button'

export default function Cursos() {
  const toast = useToast()

  const [cursos, setCursos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState({ abierto: false, curso: null })
  const [confirmar, setConfirmar] = useState({ abierto: false, curso: null, eliminando: false })

  async function cargar() {
    setCargando(true)
    setError('')
    try {
      setCursos(await cursosService.listar())
    } catch (err) {
      setError(normalizarError(err).mensaje)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  async function eliminarCurso() {
    const curso = confirmar.curso
    if (!curso) return
    setConfirmar((actual) => ({ ...actual, eliminando: true }))
    try {
      await cursosService.eliminar(curso.id)
      toast.exito('Curso eliminado')
      setConfirmar({ abierto: false, curso: null, eliminando: false })
      setCursos((actual) => actual.filter((c) => c.id !== curso.id))
    } catch (err) {
      toast.error(normalizarError(err).mensaje)
      setConfirmar((actual) => ({ ...actual, eliminando: false }))
    }
  }

  return (
    <div className="pagina">
      <header className="pagina__cabecera">
        <div>
          <h1 className="pagina__titulo">Mis cursos</h1>
          <p className="pagina__subtitulo">Administra tus asignaturas y sus tareas</p>
        </div>
        <Button onClick={() => setModal({ abierto: true, curso: null })}>Nuevo curso</Button>
      </header>

      {error && <Alerta tipo="error" titulo="No se pudieron cargar los cursos">{error}</Alerta>}

      {cargando ? (
        <div className="pantalla-carga">
          <Spinner tamano="lg" etiqueta="Cargando cursos" />
        </div>
      ) : cursos.length === 0 ? (
        <EstadoVacio
          icono="▦"
          titulo="Aun no tienes cursos"
          mensaje="Crea tu primer curso para empezar a registrar tareas."
          accion={<Button onClick={() => setModal({ abierto: true, curso: null })}>Crear curso</Button>}
        />
      ) : (
        <div className="cursos-grid">
          {cursos.map((curso) => (
            <CursoCard
              key={curso.id}
              curso={curso}
              onEditar={(c) => setModal({ abierto: true, curso: c })}
              onEliminar={(c) => setConfirmar({ abierto: true, curso: c, eliminando: false })}
            />
          ))}
        </div>
      )}

      <CursoFormulario
        abierto={modal.abierto}
        curso={modal.curso}
        onCerrar={() => setModal({ abierto: false, curso: null })}
        onGuardado={cargar}
      />

      <ConfirmDialog
        abierto={confirmar.abierto}
        titulo="Eliminar curso"
        mensaje={`Seguro que deseas eliminar el curso "${confirmar.curso?.nombre ?? ''}"? Se eliminaran tambien sus tareas.`}
        textoConfirmar="Eliminar"
        cargando={confirmar.eliminando}
        onConfirmar={eliminarCurso}
        onCancelar={() => setConfirmar({ abierto: false, curso: null, eliminando: false })}
      />
    </div>
  )
}
