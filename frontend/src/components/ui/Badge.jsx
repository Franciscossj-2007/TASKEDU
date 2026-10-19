export default function Badge({ children, color = 'gris', punto = false }) {
  return (
    <span className={`badge badge--${color}`}>
      {punto && <span className="badge__punto" aria-hidden="true" />}
      {children}
    </span>
  )
}
