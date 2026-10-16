import { ApiError } from '../utils/errors.js';
import * as cursosRepo from '../repositories/cursos.repository.js';

export function listar(usuarioId) {
  return cursosRepo.listarPorUsuario(usuarioId);
}

/**
 * Obtiene un curso propio. Si el curso no existe o pertenece a otro
 * usuario se responde 404 para no revelar su existencia.
 */
export async function obtener(usuarioId, cursoId) {
  const curso = await cursosRepo.buscarPorId(cursoId);
  if (!curso || curso.usuario_id !== usuarioId) {
    throw ApiError.notFound('Curso no encontrado');
  }
  return curso;
}

export function crear(usuarioId, datos) {
  return cursosRepo.crear({ usuarioId, ...datos });
}

export async function actualizar(usuarioId, cursoId, datos) {
  await obtener(usuarioId, cursoId);
  return cursosRepo.actualizar(cursoId, datos);
}

export async function eliminar(usuarioId, cursoId) {
  await obtener(usuarioId, cursoId);
  await cursosRepo.eliminar(cursoId);
}

export async function tareas(usuarioId, cursoId) {
  await obtener(usuarioId, cursoId);
  return cursosRepo.listarTareas(cursoId);
}
