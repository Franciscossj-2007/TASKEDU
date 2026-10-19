import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'taskedu_token';
const PUERTO_API = 3000;

// URL de la API. Prioridad: variable EXPO_PUBLIC_API_URL; si no existe, se usa
// la IP del PC que sirve Expo (la misma red WiFi que el movil) con el puerto 3000.
function resolverBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  const hostUri = Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost;
  const host = hostUri ? hostUri.split(':')[0] : 'localhost';
  return `http://${host}:${PUERTO_API}/api`;
}

export const BASE_URL = resolverBaseUrl();

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

export const tokenStore = {
  get: () =>
    Platform.OS === 'web' ? localStorage.getItem(TOKEN_KEY) : SecureStore.getItemAsync(TOKEN_KEY),
  set: (t) =>
    Platform.OS === 'web'
      ? localStorage.setItem(TOKEN_KEY, t)
      : SecureStore.setItemAsync(TOKEN_KEY, t),
  clear: () =>
    Platform.OS === 'web'
      ? localStorage.removeItem(TOKEN_KEY)
      : SecureStore.deleteItemAsync(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(message, status, detalles) {
    super(message);
    this.status = status;
    this.detalles = detalles || [];
  }
}

export const mensajeError = (e) =>
  e.detalles?.length ? e.detalles.map((d) => d.mensaje).join('. ') : e.message;

async function request(path, { method = 'GET', body, params } = {}) {
  let url = `${BASE_URL}${path}`;
  if (params) {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    if (qs) url += `?${qs}`;
  }

  const token = await tokenStore.get();
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError(`No se pudo conectar con ${BASE_URL}. Verifique que el backend este activo y que el movil este en la misma red WiFi.`, 0);
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized();
    throw new ApiError(data.error || data.mensaje || 'Error inesperado', res.status, data.detalles);
  }
  return data;
}

export const authApi = {
  login: (b) => request('/auth/login', { method: 'POST', body: b }),
  register: (b) => request('/auth/register', { method: 'POST', body: b }),
  me: () => request('/auth/me'),
};

export const cursosApi = {
  listar: () => request('/cursos'),
  obtener: (id) => request(`/cursos/${id}`),
  tareas: (id) => request(`/cursos/${id}/tareas`),
  crear: (b) => request('/cursos', { method: 'POST', body: b }),
  actualizar: (id, b) => request(`/cursos/${id}`, { method: 'PUT', body: b }),
  eliminar: (id) => request(`/cursos/${id}`, { method: 'DELETE' }),
};

export const tareasApi = {
  listar: (params) => request('/tareas', { params }),
  crear: (b) => request('/tareas', { method: 'POST', body: b }),
  actualizar: (id, b) => request(`/tareas/${id}`, { method: 'PUT', body: b }),
  cambiarEstado: (id, estado) => request(`/tareas/${id}/estado`, { method: 'PATCH', body: { estado } }),
  eliminar: (id) => request(`/tareas/${id}`, { method: 'DELETE' }),
};

export const dashboardApi = { resumen: () => request('/dashboard/resumen') };
