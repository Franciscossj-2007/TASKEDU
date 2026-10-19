import Campo from './Campo'

export default function Input({ etiqueta, id, error, ayuda, requerido, className = '', ...props }) {
  const clases = ['entrada', error ? 'entrada--error' : '', className].filter(Boolean).join(' ')
  return (
    <Campo etiqueta={etiqueta} htmlFor={id} error={error} ayuda={ayuda} requerido={requerido}>
      <input id={id} className={clases} aria-invalid={Boolean(error)} {...props} />
    </Campo>
  )
}
