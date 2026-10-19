export default function Button({
  children,
  variante = 'primario',
  tamano = 'md',
  tipo = 'button',
  cargando = false,
  bloque = false,
  className = '',
  ...props
}) {
  const clases = [
    'btn',
    `btn--${variante}`,
    `btn--${tamano}`,
    bloque ? 'btn--bloque' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={tipo} className={clases} disabled={cargando || props.disabled} {...props}>
      {cargando && <span className="btn__spinner" aria-hidden="true" />}
      {children}
    </button>
  )
}
