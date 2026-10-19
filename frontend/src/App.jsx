import { Navigate, Route, Routes } from 'react-router-dom'
import AuthLayout from './layouts/AuthLayout'
import AppLayout from './layouts/AppLayout'
import RutaProtegida from './components/RutaProtegida'
import RutaPublica from './components/RutaPublica'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Dashboard from './pages/Dashboard'
import Tareas from './pages/Tareas'
import Cursos from './pages/Cursos'
import CursoDetalle from './pages/CursoDetalle'
import NoEncontrado from './pages/NoEncontrado'

export default function App() {
  return (
    <Routes>
      <Route element={<RutaPublica />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
        </Route>
      </Route>

      <Route element={<RutaProtegida />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tareas" element={<Tareas />} />
          <Route path="/cursos" element={<Cursos />} />
          <Route path="/cursos/:id" element={<CursoDetalle />} />
        </Route>
      </Route>

      <Route path="/404" element={<NoEncontrado />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}
