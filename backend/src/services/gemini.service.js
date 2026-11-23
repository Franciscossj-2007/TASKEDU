import { env } from '../config/env.js';
import { ApiError } from '../utils/errors.js';

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const CACHE_MODELO_MS = 10 * 60 * 1000;
const CACHE_ERROR_MS = 60 * 1000;
const CACHE_ERROR_TEMPORAL_MS = 15 * 1000;

// Un solo reintento por operación: evita duplicar consumo y latencia en móvil.
const MAX_REINTENTOS = 1;
const ESPERA_REINTENTO_MS = 400;

// Aun si el .env trae un valor mayor, cada intento queda acotado.
const TIMEOUT_MIN_MS = 5000;
const TIMEOUT_MAX_MS = 20000;
const TIMEOUT_VERIFICACION_MS = 8000;

const ESTADOS_TEMPORALES = new Set([408, 500, 502, 503, 504]);

let cacheModelo = { valor: null, expira: 0 };

export function configurado() {
  return Boolean(env.ia.apiKey);
}

function timeoutEfectivo(valor = env.ia.timeoutMs) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return TIMEOUT_MAX_MS;
  return Math.min(Math.max(Math.trunc(numero), TIMEOUT_MIN_MS), TIMEOUT_MAX_MS);
}

/**
 * Logs operativos: solo código de error, estado HTTP e intento.
 * Nunca se registran la clave, el prompt, las tareas ni mensajes del proveedor.
 */
function registrar(nivel, operacion, evento, campos = {}) {
  if (env.nodeEnv === 'test') return;

  const detalles = Object.entries(campos)
    .filter(([, valor]) => valor !== undefined && valor !== null && valor !== '')
    .map(([clave, valor]) => `${clave}=${valor}`)
    .join(' ');
  const mensaje = `[IA] ${operacion} ${evento}${detalles ? ` ${detalles}` : ''}`;

  if (nivel === 'error') console.error(mensaje);
  else if (nivel === 'warn') console.warn(mensaje);
  else console.info(mensaje);
}

function conCodigo(error, codigo, { temporal = false, estado = undefined } = {}) {
  error.codigo = codigo;
  error.temporal = temporal;
  if (estado !== undefined) error.estadoRemoto = estado;
  return error;
}

function errorPorEstado(estado) {
  if (estado === 429) {
    return conCodigo(
      ApiError.tooManyRequests('Gemini alcanzó su cuota. Intenta de nuevo más tarde'),
      'CUOTA',
      { estado },
    );
  }
  if (estado === 401 || estado === 403) {
    return conCodigo(
      ApiError.serviceUnavailable('La clave de IA no es válida o no tiene permisos'),
      'CREDENCIALES',
      { estado },
    );
  }
  if (estado === 404) {
    return conCodigo(
      ApiError.serviceUnavailable('El modelo de IA configurado no está disponible'),
      'MODELO',
      { estado },
    );
  }
  if (estado === 503) {
    return conCodigo(
      ApiError.serviceUnavailable('Gemini no está disponible en este momento. Intenta de nuevo'),
      'SERVICIO_NO_DISPONIBLE',
      { temporal: true, estado },
    );
  }
  if (estado === 504) {
    return conCodigo(
      ApiError.gatewayTimeout('Gemini tardó demasiado en responder. Intenta de nuevo'),
      'TIEMPO_ESPERA',
      { temporal: true, estado },
    );
  }
  if (ESTADOS_TEMPORALES.has(estado)) {
    return conCodigo(
      ApiError.badGateway('Gemini tuvo un problema temporal. Intenta de nuevo'),
      'ERROR_TEMPORAL',
      { temporal: true, estado },
    );
  }
  return conCodigo(
    ApiError.badGateway('Gemini rechazó la solicitud. Revisa el contenido e inténtalo de nuevo'),
    'SOLICITUD_RECHAZADA',
    { estado },
  );
}

function errorJson(mensaje) {
  return conCodigo(ApiError.badGateway(mensaje), 'JSON_INVALIDO');
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
      throw errorJson('La IA devolvió una respuesta que no es JSON');
    }
    const cierre = limpio[inicio] === '{' ? limpio.lastIndexOf('}') : limpio.lastIndexOf(']');
    if (cierre <= inicio) {
      throw errorJson('La IA devolvió un JSON incompleto');
    }
    try {
      return JSON.parse(limpio.slice(inicio, cierre + 1));
    } catch {
      throw errorJson('La IA devolvió un JSON inválido');
    }
  }
}

function extraerTexto(datos) {
  const candidato = datos?.candidates?.[0];
  const partes = candidato?.content?.parts;
  const texto = Array.isArray(partes)
    ? partes
        .filter((parte) => parte && !parte.thought && typeof parte.text === 'string')
        .map((parte) => parte.text)
        .join('')
    : '';

  if (!texto.trim()) {
    if (candidato?.finishReason === 'MAX_TOKENS') {
      throw conCodigo(
        ApiError.badGateway('La IA agotó el límite de tokens antes de responder'),
        'LIMITE_TOKENS',
      );
    }
    throw errorJson('La IA devolvió una respuesta vacía');
  }

  return texto;
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

function acumularUso(acumulado, uso) {
  acumulado.promptTokenCount += Number(uso?.promptTokenCount) || 0;
  acumulado.candidatesTokenCount += Number(uso?.candidatesTokenCount) || 0;
  acumulado.totalTokenCount += Number(uso?.totalTokenCount) || 0;
}

/**
 * Un único intento HTTP. El reintento se decide en `conReintento` para que
 * transporte y JSON inválido compartan el mismo presupuesto (máximo 1).
 */
async function solicitar(ruta, { method = 'GET', body, timeoutMs } = {}) {
  if (!configurado()) {
    throw conCodigo(
      ApiError.serviceUnavailable('La IA no está configurada en el servidor'),
      'SIN_CONFIGURACION',
    );
  }

  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), timeoutEfectivo(timeoutMs));

  try {
    const respuesta = await fetch(`${BASE_URL}${ruta}`, {
      method,
      headers: {
        'x-goog-api-key': env.ia.apiKey,
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controlador.signal,
    });

    const texto = await respuesta.text();
    let datos = {};
    let cuerpoInvalido = false;
    try {
      datos = texto ? JSON.parse(texto) : {};
    } catch {
      cuerpoInvalido = true;
    }

    if (!respuesta.ok) {
      throw errorPorEstado(respuesta.status);
    }
    if (cuerpoInvalido) {
      throw errorJson('La IA devolvió una respuesta no válida');
    }

    return datos;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error?.name === 'AbortError' || error?.name === 'TimeoutError') {
      throw conCodigo(
        ApiError.gatewayTimeout('Gemini tardó demasiado en responder. Intenta de nuevo'),
        'TIEMPO_ESPERA',
        { temporal: true },
      );
    }
    throw conCodigo(
      ApiError.badGateway('No se pudo conectar con el servicio de IA'),
      'RED',
      { temporal: true },
    );
  } finally {
    clearTimeout(temporizador);
  }
}

function debeReintentar(error) {
  return Boolean(error?.temporal || error?.codigo === 'JSON_INVALIDO');
}

async function esperar(ms) {
  if (env.nodeEnv === 'test' || ms <= 0) return;
  await new Promise((resolver) => setTimeout(resolver, ms));
}

async function conReintento(operacion, accion, { nivelFallo = 'error' } = {}) {
  for (let intento = 0; intento <= MAX_REINTENTOS; intento += 1) {
    try {
      const resultado = await accion(intento);
      if (intento > 0) registrar('info', operacion, 'recuperado', { intento: intento + 1 });
      return resultado;
    } catch (error) {
      const campos = {
        intento: intento + 1,
        codigo: error?.codigo ?? 'desconocido',
        ...(error?.estadoRemoto ? { estado: error.estadoRemoto } : {}),
      };
      const puedeReintentar = intento < MAX_REINTENTOS && debeReintentar(error);

      if (!puedeReintentar) {
        registrar(nivelFallo, operacion, 'fallo', campos);
        throw error;
      }

      registrar('warn', operacion, 'reintentando', campos);
      await esperar(ESPERA_REINTENTO_MS * (intento + 1));
    }
  }

  throw ApiError.badGateway('La IA no pudo completar la solicitud');
}

export async function verificarModelo() {
  if (!configurado()) {
    return { disponible: false, motivo: 'GEMINI_API_KEY no está configurada', temporal: false };
  }

  if (cacheModelo.valor && Date.now() < cacheModelo.expira) {
    return cacheModelo.valor;
  }

  const valor = await conReintento(
    'verificar-modelo',
    async () => {
      const datos = await solicitar(`/models/${encodeURIComponent(env.ia.model)}`, {
        timeoutMs: Math.min(timeoutEfectivo(), TIMEOUT_VERIFICACION_MS),
      });
      const metodos = datos?.supportedGenerationMethods;
      if (!Array.isArray(metodos) || !metodos.includes('generateContent')) {
        throw conCodigo(
          ApiError.serviceUnavailable('El modelo configurado no permite generateContent'),
          'MODELO',
        );
      }
      return { disponible: true, motivo: null, temporal: false };
    },
    { nivelFallo: 'warn' },
  ).catch((error) => ({
    disponible: false,
    motivo: error?.message || 'No se pudo verificar el modelo de IA',
    temporal: Boolean(error?.temporal),
  }));

  // Un fallo temporal no debe dejar el modo básico "pegado" durante un minuto.
  const ttl = valor.temporal ? CACHE_ERROR_TEMPORAL_MS : CACHE_ERROR_MS;
  cacheModelo = { valor, expira: Date.now() + ttl };
  return valor;
}

export async function generarJson({
  operacion,
  sistema,
  instruccion,
  maxOutputTokens,
  temperature = 0.35,
}) {
  const uso = { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 };

  // No se llama a verificarModelo(): ese endpoint añadía latencia, consumo y
  // podía bloquear la generación por un 503 temporal. La respuesta de
  // generateContent es la fuente de verdad.
  const datos = await conReintento(operacion, async () => {
    const respuesta = await solicitar(`/models/${encodeURIComponent(env.ia.model)}:generateContent`, {
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

    acumularUso(uso, respuesta?.usageMetadata);
    return extraerJson(extraerTexto(respuesta));
  });

  registrarUso(operacion, uso);
  return { datos, uso };
}
