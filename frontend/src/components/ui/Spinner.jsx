export default function Spinner({ tamano = 'md', etiqueta = 'Cargando' }) {
  return (
    <span className={`spinner spinner--${tamano}`} role="status" aria-label={etiqueta}>
      <span className="sr-only">{etiqueta}</span>
    </span>
  )
}
