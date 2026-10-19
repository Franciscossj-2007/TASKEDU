import { api } from './api'

function limpiarFiltros(filtros) {
  return Object.entries(filtros).reduce((acc, [clave, valor]) => {
    if (valor !== '' && valor !== null && valor !== undefined) {
      acc[clave] = valor
    }
    return acc
  }, {})
}

export const tareasService = {
  async listar(filtros = {}) {
    const { data } = await api.get('/tareas', { params: limpiarFiltros(filtros) })
    return data
  },

  async obtener(id) {
    const { data } = await api.get(`/tareas/${id}`)
    return data.tarea
  },

  async crear(payload) {
    const { data } = await api.post('/tareas', payload)
    return data.tarea
  },

  async actualizar(id, payload) {
    const { data } = await api.put(`/tareas/${id}`, payload)
    return data.tarea
  },

  async cambiarEstado(id, estado) {
    const { data } = await api.patch(`/tareas/${id}/estado`, { estado })
    return data.tarea
  },

  async eliminar(id) {
    await api.delete(`/tareas/${id}`)
  },
}
