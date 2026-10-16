import { asyncHandler } from '../utils/asyncHandler.js';
import * as tareasService from '../services/tareas.service.js';

export const listar = asyncHandler(async (req, res) => {
  const { datos, total } = await tareasService.listar(req.usuario.id, req.query);
  res.status(200).json({ tareas: datos, total });
});

export const obtener = asyncHandler(async (req, res) => {
  const tarea = await tareasService.obtener(req.usuario.id, req.params.id);
  res.status(200).json({ tarea });
});

export const crear = asyncHandler(async (req, res) => {
  const tarea = await tareasService.crear(req.usuario.id, req.body);
  res.status(201).json({ tarea });
});

export const actualizar = asyncHandler(async (req, res) => {
  const tarea = await tareasService.actualizar(
    req.usuario.id,
    req.params.id,
    req.body,
  );
  res.status(200).json({ tarea });
});

export const cambiarEstado = asyncHandler(async (req, res) => {
  const tarea = await tareasService.cambiarEstado(
    req.usuario.id,
    req.params.id,
    req.body.estado,
  );
  res.status(200).json({ tarea });
});

export const eliminar = asyncHandler(async (req, res) => {
  await tareasService.eliminar(req.usuario.id, req.params.id);
  res.status(204).send();
});
