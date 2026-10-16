import { asyncHandler } from '../utils/asyncHandler.js';
import * as dashboardService from '../services/dashboard.service.js';

// Devuelve las estadísticas del panel del usuario autenticado.
export const resumen = asyncHandler(async (req, res) => {
  const datos = await dashboardService.resumen(req.usuario.id);
  res.status(200).json(datos);
});
