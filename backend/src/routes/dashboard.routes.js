import { Router } from 'express';
import * as controller from '../controllers/dashboard.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/resumen', controller.resumen);

export default router;
