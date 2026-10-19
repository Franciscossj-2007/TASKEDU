import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="auth-layout">
      <aside className="auth-layout__marca">
        <div className="marca">
          <span className="marca__logo" aria-hidden="true">✓</span>
          <span className="marca__nombre">TaskEdu</span>
        </div>
        <h1 className="auth-layout__titulo">Organiza tus tareas academicas</h1>
        <p className="auth-layout__texto">
          Registra tus cursos, controla fechas de entrega, define prioridades y sigue tu progreso
          desde un solo lugar.
        </p>
        <ul className="auth-layout__lista">
          <li>Panel con estadisticas de tu avance</li>
          <li>Filtros por curso, estado, prioridad y vencimiento</li>
          <li>Detecta tareas vencidas y proximas entregas</li>
        </ul>
      </aside>
      <main className="auth-layout__contenido">
        <div className="auth-layout__caja">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
