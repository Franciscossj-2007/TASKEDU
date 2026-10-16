import { Router } from 'express';
import * as controller from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';

const router = Router();

router.post('/register', validate({ body: registerSchema }), controller.registrar);
router.post('/login', validate({ body: loginSchema }), controller.login);
router.get('/me', authenticate, controller.perfil);

export default router;
