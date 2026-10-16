import { asyncHandler } from '../utils/asyncHandler.js';
import * as tareasService from '../services/tareas.service.js';

// Lista tareas aplicando los filtros de req.query; devuelve también el total para paginar.
export const listar = asyncHandler(async (req, res) => {
  const { datos, total } = await tareasService.listar(req.usuario.id, req.query);
  res.status(200).json({ tareas: datos, total });
});

// Devuelve una tarea propia por id.
export const obtener = asyncHandler(async (req, res) => {
  const tarea = await tareasService.obtener(req.usuario.id, req.params.id);
  res.status(200).json({ tarea });
});

// Crea una tarea; responde 201 Created.
export const crear = asyncHandler(async (req, res) => {
  const tarea = await tareasService.crear(req.usuario.id, req.body);
  res.status(201).json({ tarea });
});

// Actualiza los campos enviados de una tarea.
export const actualizar = asyncHandler(async (req, res) => {
  const tarea = await tareasService.actualizar(
    req.usuario.id,
    req.params.id,
    req.body,
  );
  res.status(200).json({ tarea });
});

// Cambia únicamente el estado (pendiente / en_progreso / completada).
export const cambiarEstado = asyncHandler(async (req, res) => {
  const tarea = await tareasService.cambiarEstado(
    req.usuario.id,
    req.params.id,
    req.body.estado,
  );
  res.status(200).json({ tarea });
});

// Elimina una tarea; 204 No Content = éxito sin cuerpo.
export const eliminar = asyncHandler(async (req, res) => {
  await tareasService.eliminar(req.usuario.id, req.params.id);
  res.status(204).send();
});
