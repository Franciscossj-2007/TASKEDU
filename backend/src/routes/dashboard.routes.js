import { Router } from 'express';
import * as controller from '../controllers/dashboard.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// El panel solo es accesible con token válido.
router.use(authenticate);

// GET /api/dashboard/resumen: estadísticas del usuario autenticado.
router.get('/resumen', controller.resumen);

export default router;
