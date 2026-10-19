import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authService } from '../services/auth.service'
import { getToken, guardarToken } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(Boolean(getToken()))

  useEffect(() => {
    let activo = true

    async function cargarSesion() {
      if (!getToken()) {
        setCargando(false)
        return
      }
      try {
        const perfil = await authService.perfil()
        if (activo) setUsuario(perfil)
      } catch {
        guardarToken(null)
        if (activo) setUsuario(null)
      } finally {
        if (activo) setCargando(false)
      }
    }

    cargarSesion()
    return () => {
      activo = false
    }
  }, [])

  useEffect(() => {
    function cerrarSesion() {
      setUsuario(null)
    }
    window.addEventListener('auth:unauthorized', cerrarSesion)
    return () => window.removeEventListener('auth:unauthorized', cerrarSesion)
  }, [])

  const iniciarSesion = useCallback(async (credenciales) => {
    const { usuario: datos, token } = await authService.login(credenciales)
    guardarToken(token)
    setUsuario(datos)
    return datos
  }, [])

  const registrar = useCallback(async (datosCuenta) => {
    const { usuario: datos, token } = await authService.registrar(datosCuenta)
    guardarToken(token)
    setUsuario(datos)
    return datos
  }, [])

  const cerrarSesion = useCallback(() => {
    guardarToken(null)
    setUsuario(null)
  }, [])

  const valor = useMemo(
    () => ({
      usuario,
      autenticado: Boolean(usuario),
      cargando,
      iniciarSesion,
      registrar,
      cerrarSesion,
    }),
    [usuario, cargando, iniciarSesion, registrar, cerrarSesion],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const contexto = useContext(AuthContext)
  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return contexto
}
