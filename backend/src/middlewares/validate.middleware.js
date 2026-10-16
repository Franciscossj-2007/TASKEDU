import { ApiError } from '../utils/errors.js';

/**
 * Middleware de validacion con zod. Recibe un objeto con los esquemas
 * para body, params y query. Reemplaza los valores por los datos ya
 * validados (y transformados) por zod.
 */
export const validate = (schemas) => (req, res, next) => {
  try {
    for (const key of ['body', 'params', 'query']) {
      if (schemas[key]) {
        const result = schemas[key].safeParse(req[key]);
        if (!result.success) {
          const details = result.error.issues.map((issue) => ({
            campo: issue.path.join('.') || key,
            mensaje: issue.message,
          }));
          throw ApiError.badRequest('Datos invalidos', details);
        }
        req[key] = result.data;
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};
