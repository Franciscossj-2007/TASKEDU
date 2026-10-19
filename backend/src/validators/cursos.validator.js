import { z } from 'zod';

// Nombre del curso: obligatorio, sin espacios sobrantes, 1 a 100 caracteres.
const nombre = z
  .string({ required_error: 'El nombre es obligatorio' })
  .trim()
  .min(1, 'El nombre no puede estar vacio')
  .max(100, 'El nombre es demasiado largo');

// Docente: opcional; puede omitirse o enviarse como null.
const docente = z
  .string()
  .trim()
  .max(100, 'El docente es demasiado largo')
  .optional()
  .nullable();

// Descripción: opcional, hasta 2000 caracteres.
const descripcion = z
  .string()
  .trim()
  .max(2000, 'La descripcion es demasiado larga')
  .optional()
  .nullable();

// Cuerpo de POST /cursos.
export const crearCursoSchema = z.object({
  nombre,
  docente,
  descripcion,
});

// Cuerpo de PUT /cursos/:id: todos los campos son opcionales...
export const actualizarCursoSchema = z
  .object({
    nombre: nombre.optional(),
    docente,
    descripcion,
  })
  // ...pero debe venir al menos uno.
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar',
  });

// Valida el parámetro :id de la URL. La URL siempre es texto, por eso se convierte a número.
export const idParamSchema = z.object({
  id: z.coerce
    .number({ invalid_type_error: 'El id debe ser numerico' })
    .int('El id debe ser un entero')
    .positive('El id debe ser positivo'),
});
