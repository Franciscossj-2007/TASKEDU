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

// Todas las rutas de cursos exigen token válido.
router.use(authenticate);

// GET /api/cursos: lista los cursos del usuario.
router.get('/', controller.listar);
// POST /api/cursos: crea un curso (valida el cuerpo).
router.post('/', validate({ body: crearCursoSchema }), controller.crear);
// GET /api/cursos/:id: un curso (valida que :id sea un entero positivo).
router.get('/:id', validate({ params: idParamSchema }), controller.obtener);
// PUT /api/cursos/:id: actualiza un curso (valida id y cuerpo).
router.put(
  '/:id',
  validate({ params: idParamSchema, body: actualizarCursoSchema }),
  controller.actualizar,
);
// DELETE /api/cursos/:id: elimina un curso y, por cascada, sus tareas.
router.delete('/:id', validate({ params: idParamSchema }), controller.eliminar);
// GET /api/cursos/:id/tareas: tareas de un curso.
router.get('/:id/tareas', validate({ params: idParamSchema }), controller.tareas);

export default router;
