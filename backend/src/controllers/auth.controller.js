import { asyncHandler } from '../utils/asyncHandler.js';
import * as authService from '../services/auth.service.js';

// Registra un usuario con los datos ya validados (req.body) y responde 201 Created.
export const registrar = asyncHandler(async (req, res) => {
  const resultado = await authService.registrar(req.body);
  res.status(201).json(resultado); // { usuario, token }
});

// Inicia sesión y responde 200 con el usuario y su token.
export const login = asyncHandler(async (req, res) => {
  const resultado = await authService.login(req.body);
  res.status(200).json(resultado);
});

// Devuelve el perfil del usuario identificado por el token (req.usuario lo puso authenticate).
export const perfil = asyncHandler(async (req, res) => {
  const usuario = await authService.perfil(req.usuario.id);
  res.status(200).json({ usuario });
});
