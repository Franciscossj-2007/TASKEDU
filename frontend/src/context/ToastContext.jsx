import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

const ToastContext = createContext(null)

let contador = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const temporizadores = useRef(new Map())

  const cerrar = useCallback((id) => {
    setToasts((actuales) => actuales.filter((t) => t.id !== id))
    const timer = temporizadores.current.get(id)
    if (timer) {
      clearTimeout(timer)
      temporizadores.current.delete(id)
    }
  }, [])

  const mostrar = useCallback(
    (mensaje, tipo = 'exito') => {
      contador += 1
      const id = contador
      setToasts((actuales) => [...actuales, { id, mensaje, tipo }])
      const timer = setTimeout(() => cerrar(id), 4000)
      temporizadores.current.set(id, timer)
      return id
    },
    [cerrar],
  )

  const valor = useMemo(
    () => ({
      exito: (mensaje) => mostrar(mensaje, 'exito'),
      error: (mensaje) => mostrar(mensaje, 'error'),
      info: (mensaje) => mostrar(mensaje, 'info'),
    }),
    [mostrar],
  )

  return (
    <ToastContext.Provider value={valor}>
      {children}
      <div className="toasts" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.tipo}`} role="status">
            <span className="toast__texto">{toast.mensaje}</span>
            <button type="button" className="toast__cerrar" onClick={() => cerrar(toast.id)} aria-label="Cerrar aviso">
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const contexto = useContext(ToastContext)
  if (!contexto) {
    throw new Error('useToast debe usarse dentro de ToastProvider')
  }
  return contexto
}
