import { z } from 'zod';

// Valores permitidos (deben coincidir con las restricciones CHECK de la base de datos).
export const ESTADOS = ['pendiente', 'en_progreso', 'completada'];
export const PRIORIDADES = ['baja', 'media', 'alta'];

// Título: obligatorio, 1 a 150 caracteres.
const titulo = z
  .string({ required_error: 'El titulo es obligatorio' })
  .trim()
  .min(1, 'El titulo no puede estar vacio')
  .max(150, 'El titulo es demasiado largo');

// Descripción: opcional, hasta 2000 caracteres.
const descripcion = z
  .string()
  .trim()
  .max(2000, 'La descripcion es demasiado larga')
  .optional()
  .nullable();

// Fecha de entrega: texto que Date pueda interpretar; se normaliza a ISO 8601 (UTC).
const fechaEntrega = z
  .string({ required_error: 'La fecha de entrega es obligatoria' })
  .refine((valor) => !Number.isNaN(Date.parse(valor)), {
    message: 'La fecha de entrega no tiene un formato valido (ISO 8601)',
  })
  .transform((valor) => new Date(valor).toISOString());

// Prioridad: solo baja, media o alta.
const prioridad = z.enum(PRIORIDADES, {
  errorMap: () => ({ message: 'La prioridad debe ser baja, media o alta' }),
});

// Estado: solo pendiente, en_progreso o completada.
const estado = z.enum(ESTADOS, {
  errorMap: () => ({
    message: 'El estado debe ser pendiente, en_progreso o completada',
  }),
});

// Cuerpo de POST /tareas. El estado es opcional (por defecto 'pendiente').
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

// Cuerpo de PUT /tareas/:id: todo opcional, pero con al menos un campo.
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

// Cuerpo de PATCH /tareas/:id/estado: solo el estado, obligatorio.
export const cambiarEstadoSchema = z.object({
  estado,
});

// Valida el parámetro :id de la URL (texto → entero positivo).
export const idParamSchema = z.object({
  id: z.coerce
    .number({ invalid_type_error: 'El id debe ser numerico' })
    .int('El id debe ser un entero')
    .positive('El id debe ser positivo'),
});

// Parámetros de la query string de GET /tareas (todos opcionales).
export const listarTareasQuerySchema = z.object({
  estado: estado.optional(), // filtrar por estado
  prioridad: prioridad.optional(), // filtrar por prioridad
  curso_id: z.coerce.number().int().positive().optional(), // filtrar por curso
  vencimiento: z.enum(['proximas', 'vencidas', 'todas']).optional(), // filtro por fecha
  busqueda: z.string().trim().max(150).optional(), // texto a buscar en el título
  orden: z.enum(['fecha_entrega', 'prioridad', 'creado_en']).optional(), // campo de orden
  dir: z.enum(['asc', 'desc']).optional(), // sentido del orden
  page: z.coerce.number().int().positive().optional(), // número de página
  limit: z.coerce.number().int().positive().max(100).optional(), // resultados por página (máx. 100)
});
