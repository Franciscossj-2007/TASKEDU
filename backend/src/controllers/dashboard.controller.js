import { asyncHandler } from '../utils/asyncHandler.js';
import * as dashboardService from '../services/dashboard.service.js';

export const resumen = asyncHandler(async (req, res) => {
  const datos = await dashboardService.resumen(req.usuario.id);
  res.status(200).json(datos);
});
