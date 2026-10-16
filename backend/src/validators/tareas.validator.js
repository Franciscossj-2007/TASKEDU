import { z } from 'zod';

export const ESTADOS = ['pendiente', 'en_progreso', 'completada'];
export const PRIORIDADES = ['baja', 'media', 'alta'];

const titulo = z
  .string({ required_error: 'El titulo es obligatorio' })
  .trim()
  .min(1, 'El titulo no puede estar vacio')
  .max(150, 'El titulo es demasiado largo');

const descripcion = z
  .string()
  .trim()
  .max(2000, 'La descripcion es demasiado larga')
  .optional()
  .nullable();

const fechaEntrega = z
  .string({ required_error: 'La fecha de entrega es obligatoria' })
  .refine((valor) => !Number.isNaN(Date.parse(valor)), {
    message: 'La fecha de entrega no tiene un formato valido (ISO 8601)',
  })
  .transform((valor) => new Date(valor).toISOString());

const prioridad = z.enum(PRIORIDADES, {
  errorMap: () => ({ message: 'La prioridad debe ser baja, media o alta' }),
});

const estado = z.enum(ESTADOS, {
  errorMap: () => ({
    message: 'El estado debe ser pendiente, en_progreso o completada',
  }),
});

export const crearTareaSchema = z.object({
  curso_id: z.coerce
    .number({ required_error: 'El curso es obligatorio' })
    .int('El curso debe ser un entero')
    .positive('El curso debe ser positivo'),
  titulo,
  descripcion,
  fecha_entrega: fechaEntrega,
  prioridad,
  estado: estado.optional(),
});

export const actualizarTareaSchema = z
  .object({
    curso_id: z.coerce.number().int().positive().optional(),
    titulo: titulo.optional(),
    descripcion,
    fecha_entrega: fechaEntrega.optional(),
    prioridad: prioridad.optional(),
    estado: estado.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar',
  });

export const cambiarEstadoSchema = z.object({
  estado,
});

export const idParamSchema = z.object({
  id: z.coerce
    .number({ invalid_type_error: 'El id debe ser numerico' })
    .int('El id debe ser un entero')
    .positive('El id debe ser positivo'),
});

export const listarTareasQuerySchema = z.object({
  estado: estado.optional(),
  prioridad: prioridad.optional(),
  curso_id: z.coerce.number().int().positive().optional(),
  vencimiento: z.enum(['proximas', 'vencidas', 'todas']).optional(),
  busqueda: z.string().trim().max(150).optional(),
  orden: z.enum(['fecha_entrega', 'prioridad', 'creado_en']).optional(),
  dir: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});
