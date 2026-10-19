// zod: librería para describir y validar la forma de los datos.
import { z } from 'zod';

// Regla reutilizable para el correo.
const correo = z
  .string({ required_error: 'El correo es obligatorio' })
  .trim() // quita espacios al inicio y al final
  .email('El correo no tiene un formato valido')
  .max(150, 'El correo es demasiado largo')
  .toLowerCase(); // se guarda siempre en minúsculas

// Regla reutilizable para la contraseña. Máximo 72 porque bcrypt ignora lo que pase de 72 bytes.
const password = z
  .string({ required_error: 'La contrasena es obligatoria' })
  .min(8, 'La contrasena debe tener al menos 8 caracteres')
  .max(72, 'La contrasena es demasiado larga');

// Cuerpo esperado en POST /auth/register.
export const registerSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre es obligatorio' })
    .trim()
    .min(1, 'El nombre no puede estar vacio')
    .max(100, 'El nombre es demasiado largo'),
  correo,
  password,
});

// Cuerpo esperado en POST /auth/login (no se exige mínimo de 8: solo que no esté vacía).
export const loginSchema = z.object({
  correo,
  password: z
    .string({ required_error: 'La contrasena es obligatoria' })
    .min(1, 'La contrasena es obligatoria'),
});
