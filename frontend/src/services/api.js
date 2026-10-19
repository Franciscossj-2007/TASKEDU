import axios from 'axios'

const TOKEN_KEY = 'taskedu_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function guardarToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    const status = error.response?.status
    if (status === 401 && getToken()) {
      guardarToken(null)
      window.dispatchEvent(new Event('auth:unauthorized'))
    }
    return Promise.reject(normalizarError(error))
  },
)

export function normalizarError(error) {
  const data = error.response?.data
  return {
    mensaje: data?.error || 'No se pudo conectar con el servidor',
    detalles: Array.isArray(data?.detalles) ? data.detalles : [],
    status: error.response?.status || 0,
  }
}
