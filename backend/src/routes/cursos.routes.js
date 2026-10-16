import { Router } from 'express';
import * as controller from '../controllers/cursos.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import {
  crearCursoSchema,
  actualizarCursoSchema,
  idParamSchema,
} from '../validators/cursos.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', controller.listar);
router.post('/', validate({ body: crearCursoSchema }), controller.crear);
router.get('/:id', validate({ params: idParamSchema }), controller.obtener);
router.put(
  '/:id',
  validate({ params: idParamSchema, body: actualizarCursoSchema }),
  controller.actualizar,
);
router.delete('/:id', validate({ params: idParamSchema }), controller.eliminar);
router.get('/:id/tareas', validate({ params: idParamSchema }), controller.tareas);

export default router;
