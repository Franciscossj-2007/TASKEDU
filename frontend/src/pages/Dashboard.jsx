import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { dashboardService } from '../services/dashboard.service'
import { normalizarError } from '../services/api'
import EstadisticaCard from '../components/EstadisticaCard'
import Progreso from '../components/ui/Progreso'
import Spinner from '../components/ui/Spinner'
import Alerta from '../components/ui/Alerta'
import EstadoVacio from '../components/ui/EstadoVacio'
import Badge from '../components/ui/Badge'
import { formatearFecha, etiquetaVencimiento } from '../utils/fechas'
import { metaPrioridad } from '../utils/constantes'

export default function Dashboard() {
  const { usuario } = useAuth()
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let activo = true
    async function cargar() {
      setCargando(true)
      setError('')
      try {
        const resumen = await dashboardService.resumen()
        if (activo) setDatos(resumen)
      } catch (err) {
        if (activo) setError(normalizarError(err).mensaje)
      } finally {
        if (activo) setCargando(false)
      }
    }
    cargar()
    return () => {
      activo = false
    }
  }, [])

  if (cargando) {
    return (
      <div className="pantalla-carga">
        <Spinner tamano="lg" etiqueta="Cargando panel" />
      </div>
    )
  }

  if (error) {
    return <Alerta tipo="error" titulo="No se pudo cargar el panel">{error}</Alerta>
  }

  const resumen = datos?.resumen ?? {}
  const porCurso = datos?.porCurso ?? []
  const proximas = datos?.proximasEntregas ?? []

  return (
    <div className="pagina">
      <header className="pagina__cabecera">
        <div>
          <h1 className="pagina__titulo">Hola, {usuario?.nombre?.split(' ')[0]}</h1>
          <p className="pagina__subtitulo">Este es el resumen de tus tareas academicas</p>
        </div>
        <Link to="/tareas" className="btn btn--primario">
          Ver mis tareas
        </Link>
      </header>

      <section className="estadisticas" aria-label="Estadisticas">
        <EstadisticaCard titulo="Total" valor={resumen.total ?? 0} color="primario" icono="▤" />
        <EstadisticaCard titulo="Pendientes" valor={resumen.pendientes ?? 0} color="gris" icono="○" />
        <EstadisticaCard titulo="En progreso" valor={resumen.en_progreso ?? 0} color="azul" icono="◐" />
        <EstadisticaCard titulo="Completadas" valor={resumen.completadas ?? 0} color="verde" icono="✓" />
        <EstadisticaCard titulo="Vencidas" valor={resumen.vencidas ?? 0} color="rojo" icono="!" />
        <EstadisticaCard titulo="Proximas" valor={resumen.proximas ?? 0} color="ambar" icono="⏱" />
      </section>

      <div className="panel-grid">
        <section className="tarjeta panel-grid__bloque">
          <header className="bloque__cabecera">
            <h2 className="bloque__titulo">Proximas entregas</h2>
          </header>
          {proximas.length === 0 ? (
            <EstadoVacio
              icono="🎉"
              titulo="Sin entregas proximas"
              mensaje="No tienes tareas pendientes con fecha cercana."
            />
          ) : (
            <ul className="lista-proximas">
              {proximas.map((tarea) => {
                const prioridad = metaPrioridad(tarea.prioridad)
                return (
                  <li key={tarea.id} className="lista-proximas__item">
                    <div className="lista-proximas__info">
                      <span className="lista-proximas__titulo">{tarea.titulo}</span>
                      <span className="lista-proximas__curso">{tarea.curso_nombre}</span>
                    </div>
                    <div className="lista-proximas__lado">
                      <Badge color={prioridad.color}>{prioridad.etiqueta}</Badge>
                      <span className="lista-proximas__fecha">
                        {formatearFecha(tarea.fecha_entrega)} · {etiquetaVencimiento(tarea)}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="tarjeta panel-grid__bloque">
          <header className="bloque__cabecera">
            <h2 className="bloque__titulo">Progreso por curso</h2>
          </header>
          {porCurso.length === 0 ? (
            <EstadoVacio
              icono="▦"
              titulo="Aun no tienes cursos"
              mensaje="Crea un curso para empezar a registrar tareas."
              accion={
                <Link to="/cursos" className="btn btn--primario btn--sm">
                  Crear curso
                </Link>
              }
            />
          ) : (
            <ul className="lista-cursos-progreso">
              {porCurso.map((curso) => (
                <li key={curso.curso_id} className="lista-cursos-progreso__item">
                  <div className="lista-cursos-progreso__cabecera">
                    <Link to={`/cursos/${curso.curso_id}`} className="lista-cursos-progreso__nombre">
                      {curso.nombre}
                    </Link>
                    <span className="lista-cursos-progreso__contador">
                      {curso.completadas}/{curso.total}
                    </span>
                  </div>
                  <Progreso
                    valor={curso.completadas}
                    max={curso.total || 1}
                    color={curso.total > 0 && curso.completadas === curso.total ? 'verde' : 'primario'}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
