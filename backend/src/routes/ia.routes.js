import { Router } from 'express';
import * as controller from '../controllers/ia.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { iaRateLimit } from '../middlewares/iaRateLimit.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  organizadorSchema,
  preguntasTutorSchema,
  responderTutorSchema,
  dudaTutorSchema,
} from '../validators/ia.validator.js';

const router = Router();

router.use(authenticate);

router.get('/estado', controller.estado);
router.post('/organizador', iaRateLimit, validate({ body: organizadorSchema }), controller.organizador);
router.post('/tutor/preguntas', iaRateLimit, validate({ body: preguntasTutorSchema }), controller.preguntas);
router.post('/tutor/responder', iaRateLimit, validate({ body: responderTutorSchema }), controller.responder);
router.post('/tutor/duda', iaRateLimit, validate({ body: dudaTutorSchema }), controller.duda);

export default router;
