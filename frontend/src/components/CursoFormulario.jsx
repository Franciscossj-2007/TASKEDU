import { useEffect, useState } from 'react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import Input from './ui/Input'
import Textarea from './ui/Textarea'
import Alerta from './ui/Alerta'
import { cursosService } from '../services/cursos.service'
import { normalizarError } from '../services/api'
import { mapaErrores } from '../utils/errores'
import { useToast } from '../context/ToastContext'

const VACIO = { nombre: '', docente: '', descripcion: '' }

export default function CursoFormulario({ abierto, curso, onCerrar, onGuardado }) {
  const toast = useToast()
  const [form, setForm] = useState(VACIO)
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!abierto) return
    setForm(
      curso
        ? {
            nombre: curso.nombre ?? '',
            docente: curso.docente ?? '',
            descripcion: curso.descripcion ?? '',
          }
        : VACIO,
    )
    setErrores({})
    setErrorGeneral('')
  }, [abierto, curso])

  function cambiar(campo, valor) {
    setForm((actual) => ({ ...actual, [campo]: valor }))
  }

  async function enviar(event) {
    event.preventDefault()
    setErrorGeneral('')

    if (!form.nombre.trim()) {
      setErrores({ nombre: 'El nombre es obligatorio' })
      return
    }

    const payload = {
      nombre: form.nombre.trim(),
      docente: form.docente.trim() || null,
      descripcion: form.descripcion.trim() || null,
    }

    setEnviando(true)
    try {
      const guardado = curso
        ? await cursosService.actualizar(curso.id, payload)
        : await cursosService.crear(payload)
      toast.exito(curso ? 'Curso actualizado' : 'Curso creado')
      onGuardado(guardado)
      onCerrar()
    } catch (error) {
      const normalizado = normalizarError(error)
      setErrorGeneral(normalizado.mensaje)
      setErrores(mapaErrores(normalizado.detalles))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal
      abierto={abierto}
      titulo={curso ? 'Editar curso' : 'Nuevo curso'}
      onCerrar={onCerrar}
      pie={
        <>
          <Button variante="fantasma" onClick={onCerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" form="form-curso" cargando={enviando}>
            {curso ? 'Guardar cambios' : 'Crear curso'}
          </Button>
        </>
      }
    >
      <form id="form-curso" className="formulario" onSubmit={enviar} noValidate>
        {errorGeneral && <Alerta tipo="error">{errorGeneral}</Alerta>}

        <Input
          id="nombre"
          etiqueta="Nombre del curso"
          requerido
          value={form.nombre}
          error={errores.nombre}
          onChange={(event) => cambiar('nombre', event.target.value)}
          maxLength={100}
          placeholder="Ej. Programacion Web"
        />

        <Input
          id="docente"
          etiqueta="Docente"
          value={form.docente}
          error={errores.docente}
          onChange={(event) => cambiar('docente', event.target.value)}
          maxLength={100}
          placeholder="Nombre del docente (opcional)"
        />

        <Textarea
          id="descripcion-curso"
          etiqueta="Descripcion"
          value={form.descripcion}
          error={errores.descripcion}
          onChange={(event) => cambiar('descripcion', event.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Descripcion del curso (opcional)"
        />
      </form>
    </Modal>
  )
}
