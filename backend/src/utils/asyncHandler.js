/**
 * Envuelve un handler async para reenviar los errores al middleware
 * central de errores sin usar try/catch en cada controlador.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
