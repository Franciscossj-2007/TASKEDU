import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const ENLACES = [
  { a: '/', texto: 'Panel', icono: '▤', exacto: true },
  { a: '/tareas', texto: 'Tareas', icono: '✎' },
  { a: '/cursos', texto: 'Cursos', icono: '▦' },
]

function iniciales(nombre = '') {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? '')
    .join('')
}

export default function Sidebar({ abierto, onCerrar }) {
  const { usuario, cerrarSesion } = useAuth()
  const navegar = useNavigate()

  function salir() {
    cerrarSesion()
    onCerrar?.()
    navegar('/login', { replace: true })
  }

  return (
    <aside className={`sidebar ${abierto ? 'sidebar--abierto' : ''}`}>
      <div className="sidebar__marca">
        <span className="marca__logo" aria-hidden="true">✓</span>
        <span className="marca__nombre">TaskEdu</span>
      </div>

      <nav className="sidebar__nav" aria-label="Navegacion principal">
        {ENLACES.map((enlace) => (
          <NavLink
            key={enlace.a}
            to={enlace.a}
            end={enlace.exacto}
            className={({ isActive }) => `sidebar__enlace ${isActive ? 'sidebar__enlace--activo' : ''}`}
            onClick={onCerrar}
          >
            <span className="sidebar__icono" aria-hidden="true">{enlace.icono}</span>
            {enlace.texto}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__pie">
        <div className="sidebar__usuario">
          <span className="sidebar__avatar" aria-hidden="true">{iniciales(usuario?.nombre)}</span>
          <div className="sidebar__datos">
            <span className="sidebar__nombre">{usuario?.nombre}</span>
            <span className="sidebar__correo">{usuario?.correo}</span>
          </div>
        </div>
        <button type="button" className="sidebar__salir" onClick={salir}>
          Cerrar sesion
        </button>
      </div>
    </aside>
  )
}
