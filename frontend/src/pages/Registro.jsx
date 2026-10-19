import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { normalizarError } from '../services/api'
import { mapaErrores } from '../utils/errores'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Alerta from '../components/ui/Alerta'

export default function Registro() {
  const { registrar } = useAuth()
  const navegar = useNavigate()

  const [form, setForm] = useState({ nombre: '', correo: '', password: '', confirmar: '' })
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)

  function cambiar(campo, valor) {
    setForm((actual) => ({ ...actual, [campo]: valor }))
  }

  function validar() {
    const nuevos = {}
    if (!form.nombre.trim()) nuevos.nombre = 'El nombre es obligatorio'
    if (!form.correo.trim()) nuevos.correo = 'El correo es obligatorio'
    if (form.password.length < 8) nuevos.password = 'Minimo 8 caracteres'
    if (form.password.length > 72) nuevos.password = 'Maximo 72 caracteres'
    if (form.confirmar !== form.password) nuevos.confirmar = 'Las contrasenas no coinciden'
    setErrores(nuevos)
    return Object.keys(nuevos).length === 0
  }

  async function enviar(event) {
    event.preventDefault()
    setErrorGeneral('')
    if (!validar()) return

    setEnviando(true)
    try {
      await registrar({
        nombre: form.nombre.trim(),
        correo: form.correo.trim(),
        password: form.password,
      })
      navegar('/', { replace: true })
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
      <h2 className="auth-form__titulo">Crear cuenta</h2>
      <p className="auth-form__subtitulo">Empieza a organizar tus tareas</p>

      <form className="formulario" onSubmit={enviar} noValidate>
        {errorGeneral && <Alerta tipo="error">{errorGeneral}</Alerta>}

        <Input
          id="nombre"
          etiqueta="Nombre completo"
          requerido
          value={form.nombre}
          error={errores.nombre}
          onChange={(event) => cambiar('nombre', event.target.value)}
          maxLength={100}
          placeholder="Tu nombre"
        />

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
          autoComplete="new-password"
          requerido
          value={form.password}
          error={errores.password}
          ayuda="Entre 8 y 72 caracteres"
          onChange={(event) => cambiar('password', event.target.value)}
        />

        <Input
          id="confirmar"
          etiqueta="Confirmar contrasena"
          type="password"
          autoComplete="new-password"
          requerido
          value={form.confirmar}
          error={errores.confirmar}
          onChange={(event) => cambiar('confirmar', event.target.value)}
        />

        <Button type="submit" bloque cargando={enviando}>
          Crear cuenta
        </Button>
      </form>

      <p className="auth-form__pie">
        Ya tienes cuenta? <Link to="/login">Inicia sesion</Link>
      </p>
    </div>
  )
}
