import Campo from './Campo'

export default function Select({
  etiqueta,
  id,
  error,
  ayuda,
  requerido,
  opciones = [],
  placeholder,
  className = '',
  ...props
}) {
  const clases = ['entrada', error ? 'entrada--error' : '', className].filter(Boolean).join(' ')
  return (
    <Campo etiqueta={etiqueta} htmlFor={id} error={error} ayuda={ayuda} requerido={requerido}>
      <select id={id} className={clases} aria-invalid={Boolean(error)} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {opciones.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.etiqueta}
          </option>
        ))}
      </select>
    </Campo>
  )
}
