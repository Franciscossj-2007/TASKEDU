import { asyncHandler } from '../utils/asyncHandler.js';
import * as cursosService from '../services/cursos.service.js';

export const listar = asyncHandler(async (req, res) => {
  const cursos = await cursosService.listar(req.usuario.id);
  res.status(200).json({ cursos });
});

export const obtener = asyncHandler(async (req, res) => {
  const curso = await cursosService.obtener(req.usuario.id, req.params.id);
  res.status(200).json({ curso });
});

export const crear = asyncHandler(async (req, res) => {
  const curso = await cursosService.crear(req.usuario.id, req.body);
  res.status(201).json({ curso });
});

export const actualizar = asyncHandler(async (req, res) => {
  const curso = await cursosService.actualizar(
    req.usuario.id,
    req.params.id,
    req.body,
  );
  res.status(200).json({ curso });
});

export const eliminar = asyncHandler(async (req, res) => {
  await cursosService.eliminar(req.usuario.id, req.params.id);
  res.status(204).send();
});

export const tareas = asyncHandler(async (req, res) => {
  const tareas = await cursosService.tareas(req.usuario.id, req.params.id);
  res.status(200).json({ tareas });
});
