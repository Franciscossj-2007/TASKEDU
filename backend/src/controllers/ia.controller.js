import { asyncHandler } from '../utils/asyncHandler.js';
import * as iaService from '../services/ia.service.js';

export const estado = asyncHandler(async (req, res) => {
  const datos = await iaService.estado();
  res.status(200).json(datos);
});

export const organizador = asyncHandler(async (req, res) => {
  const datos = await iaService.organizador(req.usuario.id, req.body);
  res.status(200).json(datos);
});

export const preguntas = asyncHandler(async (req, res) => {
  const datos = await iaService.preguntasTutor(req.usuario.id, req.body);
  res.status(200).json(datos);
});

export const responder = asyncHandler(async (req, res) => {
  const datos = await iaService.responderTutor(req.usuario.id, req.body);
  res.status(200).json(datos);
});

export const duda = asyncHandler(async (req, res) => {
  const datos = await iaService.responderDuda(req.usuario.id, req.body);
  res.status(200).json(datos);
});
