import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Spinner from './ui/Spinner'

export default function RutaPublica() {
  const { autenticado, cargando } = useAuth()

  if (cargando) {
    return (
      <div className="pantalla-carga">
        <Spinner tamano="lg" etiqueta="Cargando" />
      </div>
    )
  }

  if (autenticado) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
