import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/errors.js';

/**
 * Verifica el token JWT del encabezado Authorization: Bearer <token>.
 * Deja la identidad validada en req.usuario. El backend nunca confia
 * en un usuario_id enviado por el cliente.
 */
export const authenticate = (req, res, next) => {
  // Lee el encabezado Authorization de la petición.
  const header = req.headers.authorization;

  // Debe existir y empezar por "Bearer ".
  if (!header || !header.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Falta el token de autenticacion'));
  }

  // Quita los 7 caracteres de "Bearer " y deja solo el token.
  const token = header.slice(7).trim();

  try {
    // Verifica la firma y la caducidad; devuelve el contenido (payload) del token.
    const payload = jwt.verify(token, env.jwt.secret);
    // Guarda la identidad verificada para que la usen los controladores.
    req.usuario = { id: Number(payload.sub), correo: payload.correo };
    next();
  } catch (error) {
    // Mensaje específico si el token solo está vencido.
    if (error.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('El token ha expirado'));
    }
    // Cualquier otro problema: firma incorrecta, token mal formado, etc.
    return next(ApiError.unauthorized('Token invalido'));
  }
};
