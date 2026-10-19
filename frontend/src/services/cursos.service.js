import { api } from './api'

export const cursosService = {
  async listar() {
    const { data } = await api.get('/cursos')
    return data.cursos
  },

  async obtener(id) {
    const { data } = await api.get(`/cursos/${id}`)
    return data.curso
  },

  async crear(payload) {
    const { data } = await api.post('/cursos', payload)
    return data.curso
  },

  async actualizar(id, payload) {
    const { data } = await api.put(`/cursos/${id}`, payload)
    return data.curso
  },

  async eliminar(id) {
    await api.delete(`/cursos/${id}`)
  },

  async tareas(id) {
    const { data } = await api.get(`/cursos/${id}/tareas`)
    return data.tareas
  },
}
