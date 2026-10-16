import { z } from 'zod';

const nombre = z
  .string({ required_error: 'El nombre es obligatorio' })
  .trim()
  .min(1, 'El nombre no puede estar vacio')
  .max(100, 'El nombre es demasiado largo');

const docente = z
  .string()
  .trim()
  .max(100, 'El docente es demasiado largo')
  .optional()
  .nullable();

const descripcion = z
  .string()
  .trim()
  .max(2000, 'La descripcion es demasiado larga')
  .optional()
  .nullable();

export const crearCursoSchema = z.object({
  nombre,
  docente,
  descripcion,
});

export const actualizarCursoSchema = z
  .object({
    nombre: nombre.optional(),
    docente,
    descripcion,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar',
  });

export const idParamSchema = z.object({
  id: z.coerce
    .number({ invalid_type_error: 'El id debe ser numerico' })
    .int('El id debe ser un entero')
    .positive('El id debe ser positivo'),
});
