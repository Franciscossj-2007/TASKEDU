export default function Tarjeta({ children, className = '', ...props }) {
  return (
    <div className={`tarjeta ${className}`.trim()} {...props}>
      {children}
    </div>
  )
}
