import { Link } from 'react-router-dom'

export default function CursoCard({ curso, onEditar, onEliminar }) {
  return (
    <article className="curso">
      <div className="curso__cabecera">
        <h3 className="curso__nombre">
          <Link to={`/cursos/${curso.id}`}>{curso.nombre}</Link>
        </h3>
      </div>

      {curso.docente && <p className="curso__docente">Docente: {curso.docente}</p>}
      {curso.descripcion && <p className="curso__descripcion">{curso.descripcion}</p>}

      <div className="curso__acciones">
        <Link className="btn btn--secundario btn--sm" to={`/cursos/${curso.id}`}>
          Ver tareas
        </Link>
        <button type="button" className="btn-icono" onClick={() => onEditar(curso)}>
          Editar
        </button>
        <button
          type="button"
          className="btn-icono btn-icono--peligro"
          onClick={() => onEliminar(curso)}
        >
          Eliminar
        </button>
      </div>
    </article>
  )
}
