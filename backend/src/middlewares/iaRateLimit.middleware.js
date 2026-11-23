import { env } from '../config/env.js';
import { ApiError } from '../utils/errors.js';

const VENTANA_MINUTO_MS = 60 * 1000;
const VENTANA_DIA_MS = 24 * 60 * 60 * 1000;
const registros = new Map();

function limiteAlcanzado(mensaje) {
  return ApiError.tooManyRequests(mensaje);
}

export function iaRateLimit(req, res, next) {
  const usuarioId = req.usuario?.id;
  if (!usuarioId) {
    return next(ApiError.unauthorized());
  }

  const ahora = Date.now();
  let registro = registros.get(usuarioId);

  if (!registro) {
    registro = { marcas: [], inicioDia: ahora, contadorDia: 0 };
    registros.set(usuarioId, registro);
  }

  if (ahora - registro.inicioDia >= VENTANA_DIA_MS) {
    registro.inicioDia = ahora;
    registro.contadorDia = 0;
  }

  registro.marcas = registro.marcas.filter((marca) => ahora - marca < VENTANA_MINUTO_MS);

  if (registro.marcas.length >= env.ia.limitePorMinuto) {
    res.set('Retry-After', '60');
    return next(limiteAlcanzado('Demasiadas consultas a la IA. Espera un minuto antes de reintentar'));
  }

  if (registro.contadorDia >= env.ia.limitePorDia) {
    return next(limiteAlcanzado('Alcanzaste el limite diario de consultas a la IA'));
  }

  registro.marcas.push(ahora);
  registro.contadorDia += 1;
  next();
}
