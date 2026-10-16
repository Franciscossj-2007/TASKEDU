import * as tareasRepo from '../repositories/tareas.repository.js';

/**
 * Estadisticas del panel calculadas exclusivamente con los datos del
 * usuario autenticado.
 */
export function resumen(usuarioId) {
  return tareasRepo.estadisticas(usuarioId);
}
