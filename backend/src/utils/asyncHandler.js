/**
 * Envuelve un handler async para reenviar los errores al middleware
 * central de errores sin usar try/catch en cada controlador.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  // Si la promesa falla, el error se pasa a next() y llega al errorHandler.
  Promise.resolve(fn(req, res, next)).catch(next);
};
