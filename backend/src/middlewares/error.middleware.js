import { ApiError } from '../utils/errors.js';
import { env } from '../config/env.js';

/**
 * Ruta no encontrada.
 */
export const notFound = (req, res, next) => {
  // Genera un 404 que el errorHandler convertirá en JSON.
  next(ApiError.notFound(`Ruta no encontrada: ${req.method} ${req.originalUrl}`));
};

/**
 * Middleware central de errores. Transforma cualquier error en una
 * respuesta JSON coherente sin exponer detalles internos.
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  // Error de restriccion UNIQUE de PostgreSQL (correo duplicado, etc.)
  if (err.code === '23505') {
    return res.status(409).json({
      error: 'Conflicto',
      mensaje: 'El recurso ya existe (valor duplicado)',
    });
  }

  // Violacion de clave foranea.
  if (err.code === '23503') {
    return res.status(400).json({
      error: 'Solicitud invalida',
      mensaje: 'El recurso relacionado no existe',
    });
  }

  // Violacion de restriccion CHECK.
  if (err.code === '23514') {
    return res.status(400).json({
      error: 'Solicitud invalida',
      mensaje: 'Uno de los valores no cumple las reglas permitidas',
    });
  }

  // Error controlado lanzado por la propia aplicación: se responde con su código y mensaje.
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      error: err.message,
      // Solo incluye "detalles" si existen.
      ...(err.details ? { detalles: err.details } : {}),
    });
  }

  // Error inesperado: se registra en consola (salvo en pruebas).
  if (env.nodeEnv !== 'test') {
    console.error('Error no controlado:', err);
  }

  // Al cliente se le da un mensaje genérico para no filtrar información interna.
  return res.status(500).json({
    error: 'Error interno del servidor',
    mensaje: 'Ocurrio un error inesperado',
  });
};
