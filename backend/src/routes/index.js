import { Router } from 'express';
// Sub-routers de cada módulo.
import authRoutes from './auth.routes.js';
import cursosRoutes from './cursos.routes.js';
import tareasRoutes from './tareas.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import { testConnection } from '../config/database.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// GET /api/health: comprueba que el servidor y la base de datos responden.
router.get(
  '/health',
  asyncHandler(async (req, res) => {
    const ahora = await testConnection();
    res.status(200).json({ estado: 'ok', baseDeDatos: 'conectada', ahora });
  }),
);

// Monta cada módulo bajo su prefijo: /api/auth, /api/cursos, etc.
router.use('/auth', authRoutes);
router.use('/cursos', cursosRoutes);
router.use('/tareas', tareasRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
