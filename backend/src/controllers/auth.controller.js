import { asyncHandler } from '../utils/asyncHandler.js';
import * as authService from '../services/auth.service.js';

export const registrar = asyncHandler(async (req, res) => {
  const resultado = await authService.registrar(req.body);
  res.status(201).json(resultado);
});

export const login = asyncHandler(async (req, res) => {
  const resultado = await authService.login(req.body);
  res.status(200).json(resultado);
});

export const perfil = asyncHandler(async (req, res) => {
  const usuario = await authService.perfil(req.usuario.id);
  res.status(200).json({ usuario });
});
