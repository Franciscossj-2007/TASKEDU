import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { normalizarError } from '../services/api'
import { mapaErrores } from '../utils/errores'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Alerta from '../components/ui/Alerta'

export default function Login() {
  const { iniciarSesion } = useAuth()
  const navegar = useNavigate()
  const ubicacion = useLocation()

  const [form, setForm] = useState({ correo: '', password: '' })
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)

  function cambiar(campo, valor) {
    setForm((actual) => ({ ...actual, [campo]: valor }))
  }

  async function enviar(event) {
    event.preventDefault()
    setErrorGeneral('')

    const nuevos = {}
    if (!form.correo.trim()) nuevos.correo = 'El correo es obligatorio'
    if (!form.password) nuevos.password = 'La contrasena es obligatoria'
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) return

    setEnviando(true)
    try {
      await iniciarSesion({ correo: form.correo.trim(), password: form.password })
      navegar(ubicacion.state?.desde || '/', { replace: true })
    } catch (error) {
      const normalizado = normalizarError(error)
      setErrorGeneral(normalizado.mensaje)
      setErrores(mapaErrores(normalizado.detalles))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="auth-form">
      <h2 className="auth-form__titulo">Iniciar sesion</h2>
      <p className="auth-form__subtitulo">Bienvenido de nuevo a TaskEdu</p>

      <form className="formulario" onSubmit={enviar} noValidate>
        {errorGeneral && <Alerta tipo="error">{errorGeneral}</Alerta>}

        <Input
          id="correo"
          etiqueta="Correo electronico"
          type="email"
          autoComplete="email"
          requerido
          value={form.correo}
          error={errores.correo}
          onChange={(event) => cambiar('correo', event.target.value)}
          placeholder="tucorreo@ejemplo.com"
        />

        <Input
          id="password"
          etiqueta="Contrasena"
          type="password"
          autoComplete="current-password"
          requerido
          value={form.password}
          error={errores.password}
          onChange={(event) => cambiar('password', event.target.value)}
          placeholder="Tu contrasena"
        />

        <Button type="submit" bloque cargando={enviando}>
          Entrar
        </Button>
      </form>

      <p className="auth-form__pie">
        No tienes cuenta? <Link to="/registro">Registrate</Link>
      </p>
    </div>
  )
}
