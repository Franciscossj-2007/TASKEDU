import { Link } from 'react-router-dom'

export default function NoEncontrado() {
  return (
    <div className="no-encontrado">
      <span className="no-encontrado__codigo">404</span>
      <h1 className="no-encontrado__titulo">Pagina no encontrada</h1>
      <p className="no-encontrado__texto">La pagina que buscas no existe o fue movida.</p>
      <Link to="/" className="btn btn--primario">
        Volver al inicio
      </Link>
    </div>
  )
}
