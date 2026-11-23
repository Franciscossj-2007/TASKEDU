import { z } from 'zod';

const cursoId = z.coerce
  .number({ required_error: 'El curso es obligatorio' })
  .int('El curso debe ser un entero')
  .positive('El curso debe ser positivo');

const tema = z
  .string({ required_error: 'El tema es obligatorio' })
  .trim()
  .min(3, 'El tema debe tener al menos 3 caracteres')
  .max(200, 'El tema es demasiado largo');

const pregunta = z
  .string({ required_error: 'La pregunta es obligatoria' })
  .trim()
  .min(5, 'La pregunta debe tener al menos 5 caracteres')
  .max(600, 'La pregunta es demasiado larga');

const duda = z
  .string({ required_error: 'La duda es obligatoria' })
  .trim()
  .min(3, 'La duda debe tener al menos 3 caracteres')
  .max(1000, 'La duda es demasiado larga');

export const organizadorSchema = z
  .object({
    enfoque: z.string().trim().max(300, 'El enfoque es demasiado largo').optional(),
  })
  .strict()
  .default({});

export const preguntasTutorSchema = z.object({
  curso_id: cursoId,
  tema,
});

export const responderTutorSchema = z.object({
  curso_id: cursoId,
  tema,
  pregunta,
});

export const dudaTutorSchema = z.object({
  curso_id: cursoId,
  tema,
  duda,
  pregunta: pregunta.optional(),
});
