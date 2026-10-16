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

export function listar(usuarioId, filtros) {
  return tareasRepo.listar(usuarioId, filtros);
}

/**
 * Obtiene una tarea propia. Devuelve 404 si no existe o es ajena.
 */
export async function obtener(usuarioId, tareaId) {
  const tarea = await tareasRepo.buscarPorId(tareaId);
  if (!tarea || tarea.propietario_id !== usuarioId) {
    throw ApiError.notFound('Tarea no encontrada');
  }
  const { propietario_id, ...tareaPublica } = tarea;
  return tareaPublica;
}

export async function crear(usuarioId, datos) {
  await verificarCursoPropio(usuarioId, datos.curso_id);
  return tareasRepo.crear({
    cursoId: datos.curso_id,
    titulo: datos.titulo,
    descripcion: datos.descripcion,
    fechaEntrega: datos.fecha_entrega,
    prioridad: datos.prioridad,
    estado: datos.estado,
  });
}

export async function actualizar(usuarioId, tareaId, datos) {
  await obtener(usuarioId, tareaId);

  if (datos.curso_id !== undefined) {
    await verificarCursoPropio(usuarioId, datos.curso_id);
  }

  return tareasRepo.actualizar(tareaId, datos);
}

export async function cambiarEstado(usuarioId, tareaId, estado) {
  await obtener(usuarioId, tareaId);
  return tareasRepo.actualizarEstado(tareaId, estado);
}

export async function eliminar(usuarioId, tareaId) {
  await obtener(usuarioId, tareaId);
  await tareasRepo.eliminar(tareaId);
}
