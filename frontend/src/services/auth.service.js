import { api } from './api'

export const authService = {
  async registrar(payload) {
    const { data } = await api.post('/auth/register', payload)
    return data
  },

  async login(payload) {
    const { data } = await api.post('/auth/login', payload)
    return data
  },

  async perfil() {
    const { data } = await api.get('/auth/me')
    return data.usuario
  },
}
