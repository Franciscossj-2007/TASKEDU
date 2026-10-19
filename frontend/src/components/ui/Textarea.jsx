import Campo from './Campo'

export default function Textarea({ etiqueta, id, error, ayuda, requerido, className = '', ...props }) {
  const clases = ['entrada', 'entrada--area', error ? 'entrada--error' : '', className]
    .filter(Boolean)
    .join(' ')
  return (
    <Campo etiqueta={etiqueta} htmlFor={id} error={error} ayuda={ayuda} requerido={requerido}>
      <textarea id={id} className={clases} aria-invalid={Boolean(error)} {...props} />
    </Campo>
  )
}
