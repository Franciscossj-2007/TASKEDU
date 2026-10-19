export default function Campo({ etiqueta, htmlFor, error, ayuda, requerido, children }) {
  return (
    <div className="campo">
      {etiqueta && (
        <label className="campo__etiqueta" htmlFor={htmlFor}>
          {etiqueta}
          {requerido && <span className="campo__req" aria-hidden="true"> *</span>}
        </label>
      )}
      {children}
      {ayuda && !error && <p className="campo__ayuda">{ayuda}</p>}
      {error && <p className="campo__error">{error}</p>}
    </div>
  )
}
