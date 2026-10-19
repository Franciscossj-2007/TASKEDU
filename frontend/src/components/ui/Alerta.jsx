export default function Alerta({ tipo = 'error', titulo, children }) {
  return (
    <div className={`alerta alerta--${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>
      {titulo && <strong className="alerta__titulo">{titulo}</strong>}
      {children && <div className="alerta__texto">{children}</div>}
    </div>
  )
}
