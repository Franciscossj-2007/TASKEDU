import { ApiError } from '../utils/errors.js';

/**
 * Middleware de validacion con zod. Recibe un objeto con los esquemas
 * para body, params y query. Reemplaza los valores por los datos ya
 * validados (y transformados) por zod.
 */
export const validate = (schemas) => (req, res, next) => {
  try {
    // Valida cada parte de la petición que tenga un esquema definido.
    for (const key of ['body', 'params', 'query']) {
      if (schemas[key]) {
        // safeParse no lanza excepción: devuelve { success, data | error }.
        const result = schemas[key].safeParse(req[key]);
        if (!result.success) {
          // Convierte los errores de zod en una lista simple { campo, mensaje }.
          const details = result.error.issues.map((issue) => ({
            campo: issue.path.join('.') || key,
            mensaje: issue.message,
          }));
          throw ApiError.badRequest('Datos invalidos', details);
        }
        // Sustituye el valor original por el ya limpio y convertido (trim, números, fechas...).
        req[key] = result.data;
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};
