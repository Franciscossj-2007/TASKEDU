import { env } from '../config/env.js';
import { ApiError } from '../utils/errors.js';

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const CACHE_MODELO_MS = 10 * 60 * 1000;
const CACHE_ERROR_MS = 60 * 1000;

let cacheModelo = { valor: null, expira: 0 };

export function configurado() {
  return Boolean(env.ia.apiKey);
}

function extraerJson(texto) {
  const limpio = String(texto || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  try {
    return JSON.parse(limpio);
  } catch {
    const aperturas = [limpio.indexOf('{'), limpio.indexOf('[')].filter((posicion) => posicion >= 0);
    const inicio = aperturas.length ? Math.min(...aperturas) : -1;
    if (inicio < 0) {
      throw ApiError.badGateway('La IA devolvio una respuesta que no es JSON');
    }
    const cierre = limpio[inicio] === '{' ? limpio.lastIndexOf('}') : limpio.lastIndexOf(']');
    if (cierre <= inicio) {
      throw ApiError.badGateway('La IA devolvio un JSON incompleto');
    }
    try {
      return JSON.parse(limpio.slice(inicio, cierre + 1));
    } catch {
      throw ApiError.badGateway('La IA devolvio un JSON invalido');
    }
  }
}

function registrarUso(operacion, uso) {
  if (env.nodeEnv === 'test') return;
  const entrada = Number(uso?.promptTokenCount) || 0;
  const salida = Number(uso?.candidatesTokenCount) || 0;
  const total = Number(uso?.totalTokenCount) || entrada + salida;
  if (total > 0) {
    console.info(`[IA] ${operacion}: entrada=${entrada} salida=${salida} total=${total}`);
  }
}

async function solicitar(ruta, { method = 'GET', body, timeoutMs = env.ia.timeoutMs } = {}) {
  if (!configurado()) {
    throw ApiError.serviceUnavailable('La IA no esta configurada en el servidor');
  }

  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), timeoutMs);

  try {
    const respuesta = await fetch(`${BASE_URL}${ruta}`, {
      method,
      headers: {
        'x-goog-api-key': env.ia.apiKey,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controlador.signal,
    });

    const texto = await respuesta.text();
    let datos = {};
    try {
      datos = texto ? JSON.parse(texto) : {};
    } catch {
      datos = {};
    }

    if (!respuesta.ok) {
      const detalle = String(datos?.error?.message || '').slice(0, 180);

      if (respuesta.status === 429) {
        throw ApiError.tooManyRequests('La IA alcanzo su limite de cuota. Intenta de nuevo mas tarde');
      }
      if (respuesta.status === 401 || respuesta.status === 403) {
        throw ApiError.serviceUnavailable('La clave de IA no es valida o no tiene permisos');
      }
      if (respuesta.status === 404) {
        throw ApiError.serviceUnavailable('El modelo de IA configurado no esta disponible');
      }
      if (respuesta.status >= 500) {
        throw ApiError.badGateway('El servicio de IA no esta disponible en este momento');
      }
      throw ApiError.badGateway(`La IA rechazo la solicitud${detalle ? `: ${detalle}` : ''}`);
    }

    return datos;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw ApiError.gatewayTimeout('La IA tardo demasiado en responder');
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw ApiError.badGateway('No se pudo conectar con el servicio de IA');
  } finally {
    clearTimeout(temporizador);
  }
}

export async function verificarModelo() {
  if (!configurado()) {
    return { disponible: false, motivo: 'GEMINI_API_KEY no esta configurada' };
  }

  if (cacheModelo.valor && Date.now() < cacheModelo.expira) {
    return cacheModelo.valor;
  }

  try {
    const datos = await solicitar(`/models/${encodeURIComponent(env.ia.model)}`, {
      timeoutMs: Math.min(env.ia.timeoutMs, 12000),
    });
    const metodos = datos?.supportedGenerationMethods;
    const disponible = Array.isArray(metodos) && metodos.includes('generateContent');
    const valor = disponible
      ? { disponible: true, motivo: null }
      : { disponible: false, motivo: 'El modelo configurado no permite generateContent' };

    cacheModelo = { valor, expira: Date.now() + CACHE_MODELO_MS };
    return valor;
  } catch (error) {
    const valor = {
      disponible: false,
      motivo: error.message || 'No se pudo verificar el modelo de IA',
    };
    cacheModelo = { valor, expira: Date.now() + CACHE_ERROR_MS };
    return valor;
  }
}

function sumarUso(primero, segundo) {
  return {
    promptTokenCount: (Number(primero?.promptTokenCount) || 0) + (Number(segundo?.promptTokenCount) || 0),
    candidatesTokenCount:
      (Number(primero?.candidatesTokenCount) || 0) + (Number(segundo?.candidatesTokenCount) || 0),
    totalTokenCount: (Number(primero?.totalTokenCount) || 0) + (Number(segundo?.totalTokenCount) || 0),
  };
}

export async function generarJson({
  operacion,
  sistema,
  instruccion,
  maxOutputTokens,
  temperature = 0.35,
}) {
  const verificacion = await verificarModelo();
  if (!verificacion.disponible) {
    throw ApiError.serviceUnavailable(verificacion.motivo || 'La IA no esta disponible');
  }

  async function pedirTexto() {
    const datos = await solicitar(`/models/${encodeURIComponent(env.ia.model)}:generateContent`, {
      method: 'POST',
      body: {
        systemInstruction: { parts: [{ text: sistema }] },
        contents: [{ role: 'user', parts: [{ text: instruccion }] }],
        generationConfig: {
          temperature,
          maxOutputTokens,
          responseMimeType: 'application/json',
        },
      },
    });

    const candidato = datos?.candidates?.[0];
    const partes = candidato?.content?.parts;
    const texto = Array.isArray(partes)
      ? partes
          .filter((parte) => parte && !parte.thought && typeof parte.text === 'string')
          .map((parte) => parte.text)
          .join('')
      : '';
    const uso = datos?.usageMetadata || {};

    registrarUso(operacion, uso);

    if (!texto.trim()) {
      if (candidato?.finishReason === 'MAX_TOKENS') {
        throw ApiError.badGateway('La IA agoto el limite de tokens antes de responder');
      }
      throw ApiError.badGateway('La IA devolvio una respuesta vacia');
    }

    return { texto, uso };
  }

  const primera = await pedirTexto();

  try {
    return { datos: extraerJson(primera.texto), uso: primera.uso };
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 502) throw error;

    if (env.nodeEnv !== 'test') {
      console.warn(`[IA] ${operacion}: JSON invalido, reintentando`);
    }

    const segunda = await pedirTexto();
    return {
      datos: extraerJson(segunda.texto),
      uso: sumarUso(primera.uso, segunda.uso),
    };
  }
}
