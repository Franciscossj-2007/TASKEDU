import { z } from 'zod';

const correo = z
  .string({ required_error: 'El correo es obligatorio' })
  .trim()
  .email('El correo no tiene un formato valido')
  .max(150, 'El correo es demasiado largo')
  .toLowerCase();

const password = z
  .string({ required_error: 'La contrasena es obligatoria' })
  .min(8, 'La contrasena debe tener al menos 8 caracteres')
  .max(72, 'La contrasena es demasiado larga');

export const registerSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre es obligatorio' })
    .trim()
    .min(1, 'El nombre no puede estar vacio')
    .max(100, 'El nombre es demasiado largo'),
  correo,
  password,
});

export const loginSchema = z.object({
  correo,
  password: z
    .string({ required_error: 'La contrasena es obligatoria' })
    .min(1, 'La contrasena es obligatoria'),
});
