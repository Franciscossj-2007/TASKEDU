import { Router } from 'express';
import * as controller from '../controllers/tareas.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import {
  crearTareaSchema,
  actualizarTareaSchema,
  cambiarEstadoSchema,
  idParamSchema,
  listarTareasQuerySchema,
} from '../validators/tareas.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', validate({ query: listarTareasQuerySchema }), controller.listar);
router.post('/', validate({ body: crearTareaSchema }), controller.crear);
router.get('/:id', validate({ params: idParamSchema }), controller.obtener);
router.put(
  '/:id',
  validate({ params: idParamSchema, body: actualizarTareaSchema }),
  controller.actualizar,
);
router.patch(
  '/:id/estado',
  validate({ params: idParamSchema, body: cambiarEstadoSchema }),
  controller.cambiarEstado,
);
router.delete('/:id', validate({ params: idParamSchema }), controller.eliminar);

export default router;
