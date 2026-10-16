import { ApiError } from '../utils/errors.js';
import * as tareasRepo from '../repositories/tareas.repository.js';
import * as cursosRepo from '../repositories/cursos.repository.js';

/**
 * Verifica que el curso exista y pertenezca al usuario autenticado.
 */
async function verificarCursoPropio(usuarioId, cursoId) {
  const curso = await cursosRepo.buscarPorId(cursoId);
  if (!curso || curso.usuario_id !== usuarioId) {
    throw ApiError.notFound('El curso indicado no existe o no le pertenece');
  }
  return curso;
}

// Lista las tareas del usuario según los filtros recibidos.
export function listar(usuarioId, filtros) {
  return tareasRepo.listar(usuarioId, filtros);
}

/**
 * Obtiene una tarea propia. Devuelve 404 si no existe o es ajena.
 */
export async function obtener(usuarioId, tareaId) {
  const tarea = await tareasRepo.buscarPorId(tareaId);
  // La propiedad se deduce del curso al que pertenece la tarea.
  if (!tarea || tarea.propietario_id !== usuarioId) {
    throw ApiError.notFound('Tarea no encontrada');
  }
  // Quita el campo interno propietario_id antes de responder.
  const { propietario_id, ...tareaPublica } = tarea;
  return tareaPublica;
}

// Crea una tarea, comprobando antes que el curso sea del usuario.
export async function crear(usuarioId, datos) {
  await verificarCursoPropio(usuarioId, datos.curso_id);
  // Traduce los nombres snake_case de la API a los camelCase del repositorio.
  return tareasRepo.crear({
    cursoId: datos.curso_id,
    titulo: datos.titulo,
    descripcion: datos.descripcion,
    fechaEntrega: datos.fecha_entrega,
    prioridad: datos.prioridad,
    estado: datos.estado,
  });
}

// Actualiza una tarea propia; si cambia de curso, el nuevo también debe ser propio.
export async function actualizar(usuarioId, tareaId, datos) {
  await obtener(usuarioId, tareaId);

  if (datos.curso_id !== undefined) {
    await verificarCursoPropio(usuarioId, datos.curso_id);
  }

  return tareasRepo.actualizar(tareaId, datos);
}

// Cambia el estado de una tarea propia.
export async function cambiarEstado(usuarioId, tareaId, estado) {
  await obtener(usuarioId, tareaId);
  return tareasRepo.actualizarEstado(tareaId, estado);
}

// Elimina una tarea propia.
export async function eliminar(usuarioId, tareaId) {
  await obtener(usuarioId, tareaId);
  await tareasRepo.eliminar(tareaId);
}
