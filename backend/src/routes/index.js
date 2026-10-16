import { Router } from 'express';
import authRoutes from './auth.routes.js';
import cursosRoutes from './cursos.routes.js';
import tareasRoutes from './tareas.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import { testConnection } from '../config/database.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get(
  '/health',
  asyncHandler(async (req, res) => {
    const ahora = await testConnection();
    res.status(200).json({ estado: 'ok', baseDeDatos: 'conectada', ahora });
  }),
);

router.use('/auth', authRoutes);
router.use('/cursos', cursosRoutes);
router.use('/tareas', tareasRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
