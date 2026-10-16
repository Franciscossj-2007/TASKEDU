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

// Todas las rutas de tareas exigen token válido.
router.use(authenticate);

// GET /api/tareas: lista con filtros, orden y paginación (valida la query string).
router.get('/', validate({ query: listarTareasQuerySchema }), controller.listar);
// POST /api/tareas: crea una tarea.
router.post('/', validate({ body: crearTareaSchema }), controller.crear);
// GET /api/tareas/:id: consulta una tarea.
router.get('/:id', validate({ params: idParamSchema }), controller.obtener);
// PUT /api/tareas/:id: actualiza campos de la tarea.
router.put(
  '/:id',
  validate({ params: idParamSchema, body: actualizarTareaSchema }),
  controller.actualizar,
);
// PATCH /api/tareas/:id/estado: cambia solo el estado.
router.patch(
  '/:id/estado',
  validate({ params: idParamSchema, body: cambiarEstadoSchema }),
  controller.cambiarEstado,
);
// DELETE /api/tareas/:id: elimina la tarea.
router.delete('/:id', validate({ params: idParamSchema }), controller.eliminar);

export default router;
