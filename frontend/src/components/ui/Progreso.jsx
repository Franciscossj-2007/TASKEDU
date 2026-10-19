export default function Progreso({ valor = 0, max = 100, color = 'primario' }) {
  const porcentaje = max > 0 ? Math.min(100, Math.round((valor / max) * 100)) : 0
  return (
    <div className="progreso" role="progressbar" aria-valuenow={porcentaje} aria-valuemin={0} aria-valuemax={100}>
      <div className={`progreso__barra progreso__barra--${color}`} style={{ width: `${porcentaje}%` }} />
    </div>
  )
}
