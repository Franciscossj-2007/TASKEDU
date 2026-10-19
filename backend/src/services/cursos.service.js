import { ApiError } from '../utils/errors.js';
import * as cursosRepo from '../repositories/cursos.repository.js';

// Lista los cursos del usuario.
export function listar(usuarioId) {
  return cursosRepo.listarPorUsuario(usuarioId);
}

/**
 * Obtiene un curso propio. Si el curso no existe o pertenece a otro
 * usuario se responde 404 para no revelar su existencia.
 */
export async function obtener(usuarioId, cursoId) {
  const curso = await cursosRepo.buscarPorId(cursoId);
  // Comprueba existencia y propiedad en un solo paso.
  if (!curso || curso.usuario_id !== usuarioId) {
    throw ApiError.notFound('Curso no encontrado');
  }
  return curso;
}

// Crea un curso asociado al usuario autenticado.
export function crear(usuarioId, datos) {
  return cursosRepo.crear({ usuarioId, ...datos });
}

// Actualiza un curso (antes verifica que sea del usuario).
export async function actualizar(usuarioId, cursoId, datos) {
  await obtener(usuarioId, cursoId);
  return cursosRepo.actualizar(cursoId, datos);
}

// Elimina un curso (antes verifica que sea del usuario).
export async function eliminar(usuarioId, cursoId) {
  await obtener(usuarioId, cursoId);
  await cursosRepo.eliminar(cursoId);
}

// Lista las tareas de un curso (antes verifica que sea del usuario).
export async function tareas(usuarioId, cursoId) {
  await obtener(usuarioId, cursoId);
  return cursosRepo.listarTareas(cursoId);
}
