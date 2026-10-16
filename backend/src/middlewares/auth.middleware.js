import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/errors.js';

/**
 * Verifica el token JWT del encabezado Authorization: Bearer <token>.
 * Deja la identidad validada en req.usuario. El backend nunca confia
 * en un usuario_id enviado por el cliente.
 */
export const authenticate = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Falta el token de autenticacion'));
  }

  const token = header.slice(7).trim();

  try {
    const payload = jwt.verify(token, env.jwt.secret);
    req.usuario = { id: Number(payload.sub), correo: payload.correo };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('El token ha expirado'));
    }
    return next(ApiError.unauthorized('Token invalido'));
  }
};
