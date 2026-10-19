import { useEffect, useState } from 'react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import Input from './ui/Input'
import Select from './ui/Select'
import Textarea from './ui/Textarea'
import Alerta from './ui/Alerta'
import { tareasService } from '../services/tareas.service'
import { normalizarError } from '../services/api'
import { OPCIONES_ESTADO, OPCIONES_PRIORIDAD } from '../utils/constantes'
import { paraInputDatetime } from '../utils/fechas'
import { mapaErrores } from '../utils/errores'
import { useToast } from '../context/ToastContext'

const VACIO = {
  titulo: '',
  descripcion: '',
  curso_id: '',
  fecha_entrega: '',
  prioridad: 'media',
  estado: 'pendiente',
}

export default function TareaFormulario({ abierto, tarea, cursos, onCerrar, onGuardado }) {
  const toast = useToast()
  const [form, setForm] = useState(VACIO)
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!abierto) return
    if (tarea) {
      setForm({
        titulo: tarea.titulo ?? '',
        descripcion: tarea.descripcion ?? '',
        curso_id: String(tarea.curso_id ?? ''),
        fecha_entrega: paraInputDatetime(tarea.fecha_entrega),
        prioridad: tarea.prioridad ?? 'media',
        estado: tarea.estado ?? 'pendiente',
      })
    } else {
      setForm({ ...VACIO, curso_id: cursos[0] ? String(cursos[0].id) : '' })
    }
    setErrores({})
    setErrorGeneral('')
  }, [abierto, tarea, cursos])

  function cambiar(campo, valor) {
    setForm((actual) => ({ ...actual, [campo]: valor }))
  }

  function validar() {
    const nuevos = {}
    if (!form.titulo.trim()) nuevos.titulo = 'El titulo es obligatorio'
    if (!form.curso_id) nuevos.curso_id = 'Selecciona un curso'
    if (!form.fecha_entrega) nuevos.fecha_entrega = 'La fecha de entrega es obligatoria'
    if (!form.prioridad) nuevos.prioridad = 'Selecciona una prioridad'
    setErrores(nuevos)
    return Object.keys(nuevos).length === 0
  }

  async function enviar(event) {
    event.preventDefault()
    setErrorGeneral('')
    if (!validar()) return

    const payload = {
      curso_id: Number(form.curso_id),
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim() || null,
      fecha_entrega: new Date(form.fecha_entrega).toISOString(),
      prioridad: form.prioridad,
      estado: form.estado,
    }

    setEnviando(true)
    try {
      const guardada = tarea
        ? await tareasService.actualizar(tarea.id, payload)
        : await tareasService.crear(payload)
      toast.exito(tarea ? 'Tarea actualizada' : 'Tarea creada')
      onGuardado(guardada)
      onCerrar()
    } catch (error) {
      const normalizado = normalizarError(error)
      setErrorGeneral(normalizado.mensaje)
      setErrores(mapaErrores(normalizado.detalles))
    } finally {
      setEnviando(false)
    }
  }

  const opcionesCursos = cursos.map((curso) => ({ valor: String(curso.id), etiqueta: curso.nombre }))

  return (
    <Modal
      abierto={abierto}
      titulo={tarea ? 'Editar tarea' : 'Nueva tarea'}
      onCerrar={onCerrar}
      pie={
        <>
          <Button variante="fantasma" onClick={onCerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" form="form-tarea" cargando={enviando}>
            {tarea ? 'Guardar cambios' : 'Crear tarea'}
          </Button>
        </>
      }
    >
      <form id="form-tarea" className="formulario" onSubmit={enviar} noValidate>
        {errorGeneral && <Alerta tipo="error">{errorGeneral}</Alerta>}

        <Input
          id="titulo"
          etiqueta="Titulo"
          requerido
          value={form.titulo}
          error={errores.titulo}
          onChange={(event) => cambiar('titulo', event.target.value)}
          maxLength={150}
          placeholder="Ej. Investigar sobre normalizacion de bases de datos"
        />

        <Textarea
          id="descripcion"
          etiqueta="Descripcion"
          value={form.descripcion}
          error={errores.descripcion}
          onChange={(event) => cambiar('descripcion', event.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Detalles opcionales de la tarea"
        />

        <div className="formulario__fila">
          <Select
            id="curso_id"
            etiqueta="Curso"
            requerido
            value={form.curso_id}
            error={errores.curso_id}
            onChange={(event) => cambiar('curso_id', event.target.value)}
            opciones={opcionesCursos}
            placeholder="Selecciona un curso"
          />
          <Input
            id="fecha_entrega"
            etiqueta="Fecha y hora de entrega"
            requerido
            type="datetime-local"
            value={form.fecha_entrega}
            error={errores.fecha_entrega}
            onChange={(event) => cambiar('fecha_entrega', event.target.value)}
          />
        </div>

        <div className="formulario__fila">
          <Select
            id="prioridad"
            etiqueta="Prioridad"
            requerido
            value={form.prioridad}
            error={errores.prioridad}
            onChange={(event) => cambiar('prioridad', event.target.value)}
            opciones={OPCIONES_PRIORIDAD}
          />
          <Select
            id="estado"
            etiqueta="Estado"
            value={form.estado}
            error={errores.estado}
            onChange={(event) => cambiar('estado', event.target.value)}
            opciones={OPCIONES_ESTADO}
          />
        </div>
      </form>
    </Modal>
  )
}
