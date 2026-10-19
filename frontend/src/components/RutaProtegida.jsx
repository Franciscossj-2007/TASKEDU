import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Spinner from './ui/Spinner'

export default function RutaProtegida() {
  const { autenticado, cargando } = useAuth()
  const ubicacion = useLocation()

  if (cargando) {
    return (
      <div className="pantalla-carga">
        <Spinner tamano="lg" etiqueta="Cargando sesion" />
      </div>
    )
  }

  if (!autenticado) {
    return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />
  }

  return <Outlet />
}
