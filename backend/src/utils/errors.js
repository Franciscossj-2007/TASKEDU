/**
 * Error controlado de la API. Los controladores y servicios lanzan
 * este error y el middleware central lo transforma en JSON.
 */
export class ApiError extends Error {
  constructor(status, message, details = undefined) {
    super(message); // mensaje del error
    this.name = 'ApiError';
    this.status = status; // código HTTP a responder
    this.details = details; // información extra (p. ej. errores por campo)
  }

  // 400: la petición es inválida.
  static badRequest(message, details) {
    return new ApiError(400, message, details);
  }

  // 401: falta autenticación o es incorrecta.
  static unauthorized(message = 'No autenticado') {
    return new ApiError(401, message);
  }

  // 403: autenticado pero sin permiso.
  static forbidden(message = 'No tiene permiso para acceder a este recurso') {
    return new ApiError(403, message);
  }

  // 404: el recurso no existe.
  static notFound(message = 'Recurso no encontrado') {
    return new ApiError(404, message);
  }

  // 409: conflicto (p. ej. correo ya registrado).
  static conflict(message, details) {
    return new ApiError(409, message, details);
  }

  // 429: demasiadas solicitudes en poco tiempo.
  static tooManyRequests(message = 'Demasiadas solicitudes. Intenta de nuevo mas tarde') {
    return new ApiError(429, message);
  }

  // 502: un servicio externo respondio con un error.
  static badGateway(message = 'El servicio externo no respondio correctamente') {
    return new ApiError(502, message);
  }

  // 503: el servicio no esta disponible o no esta configurado.
  static serviceUnavailable(message = 'Servicio no disponible') {
    return new ApiError(503, message);
  }

  // 504: el servicio externo excedio el tiempo de espera.
  static gatewayTimeout(message = 'El servicio externo tardo demasiado en responder') {
    return new ApiError(504, message);
  }
}
