import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'

export default function AppLayout() {
  const [menuAbierto, setMenuAbierto] = useState(false)

  return (
    <div className="app-layout">
      <Sidebar abierto={menuAbierto} onCerrar={() => setMenuAbierto(false)} />
      <div className="app-layout__principal">
        <Topbar onAbrirMenu={() => setMenuAbierto(true)} />
        <main className="app-layout__contenido">
          <Outlet />
        </main>
      </div>
      {menuAbierto && (
        <button
          type="button"
          className="app-layout__velo"
          aria-label="Cerrar menu"
          onClick={() => setMenuAbierto(false)}
        />
      )}
    </div>
  )
}
