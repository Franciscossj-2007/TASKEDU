import { Router } from 'express';
import * as controller from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';

const router = Router();

// POST /api/auth/register: valida el cuerpo y registra al usuario (ruta pública).
router.post('/register', validate({ body: registerSchema }), controller.registrar);
// POST /api/auth/login: valida el cuerpo e inicia sesión (ruta pública).
router.post('/login', validate({ body: loginSchema }), controller.login);
// GET /api/auth/me: devuelve el usuario del token (requiere estar autenticado).
router.get('/me', authenticate, controller.perfil);

export default router;
