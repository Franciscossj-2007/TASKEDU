import { asyncHandler } from '../utils/asyncHandler.js';
import * as cursosService from '../services/cursos.service.js';

// Lista los cursos del usuario autenticado.
export const listar = asyncHandler(async (req, res) => {
  const cursos = await cursosService.listar(req.usuario.id);
  res.status(200).json({ cursos });
});

// Devuelve un curso por id (req.params.id), solo si es del usuario.
export const obtener = asyncHandler(async (req, res) => {
  const curso = await cursosService.obtener(req.usuario.id, req.params.id);
  res.status(200).json({ curso });
});

// Crea un curso con los datos del cuerpo; responde 201 Created.
export const crear = asyncHandler(async (req, res) => {
  const curso = await cursosService.crear(req.usuario.id, req.body);
  res.status(201).json({ curso });
});

// Actualiza los campos enviados de un curso.
export const actualizar = asyncHandler(async (req, res) => {
  const curso = await cursosService.actualizar(
    req.usuario.id,
    req.params.id,
    req.body,
  );
  res.status(200).json({ curso });
});

// Elimina un curso; 204 No Content = éxito sin cuerpo.
export const eliminar = asyncHandler(async (req, res) => {
  await cursosService.eliminar(req.usuario.id, req.params.id);
  res.status(204).send();
});

// Lista las tareas pertenecientes a un curso.
export const tareas = asyncHandler(async (req, res) => {
  const tareas = await cursosService.tareas(req.usuario.id, req.params.id);
  res.status(200).json({ tareas });
});
