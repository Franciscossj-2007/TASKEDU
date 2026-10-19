// bcrypt: cifra y compara contraseñas de forma segura.
import bcrypt from 'bcrypt';
// jsonwebtoken: crea y verifica tokens JWT.
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/errors.js';
import * as usuariosRepo from '../repositories/usuarios.repository.js';

// Rondas de cifrado: más rondas = más seguro pero más lento.
const SALT_ROUNDS = 10;

// Crea un token firmado con el id (sub) y el correo del usuario.
function generarToken(usuario) {
  return jwt.sign(
    { sub: String(usuario.id), correo: usuario.correo }, // contenido del token
    env.jwt.secret, // clave de firma
    { expiresIn: env.jwt.expiresIn }, // caducidad
  );
}

// Registra un nuevo usuario y le entrega un token para que quede con sesión iniciada.
export async function registrar({ nombre, correo, password }) {
  // Evita correos duplicados.
  const existente = await usuariosRepo.buscarPorCorreo(correo);
  if (existente) {
    throw ApiError.conflict('El correo ya esta registrado');
  }

  // Nunca se guarda la contraseña en claro: solo su hash.
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const usuario = await usuariosRepo.crear({ nombre, correo, passwordHash });

  return { usuario, token: generarToken(usuario) };
}

// Valida las credenciales y devuelve usuario + token.
export async function login({ correo, password }) {
  const usuario = await usuariosRepo.buscarPorCorreo(correo);

  // Mensaje generico para no revelar si el correo existe.
  if (!usuario) {
    throw ApiError.unauthorized('Correo o contraseña incorrectos');
  }

  // Compara la contraseña recibida con el hash guardado.
  const coincide = await bcrypt.compare(password, usuario.password_hash);
  if (!coincide) {
    throw ApiError.unauthorized('Correo o contraseña incorrectos');
  }

  // Quita el hash de la respuesta para no exponerlo.
  const { password_hash, ...usuarioPublico } = usuario;
  return { usuario: usuarioPublico, token: generarToken(usuario) };
}

// Devuelve los datos públicos del usuario con ese id.
export async function perfil(usuarioId) {
  const usuario = await usuariosRepo.buscarPorId(usuarioId);
  if (!usuario) {
    throw ApiError.notFound('Usuario no encontrado');
  }
  return usuario;
}
