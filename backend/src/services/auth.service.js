import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/errors.js';
import * as usuariosRepo from '../repositories/usuarios.repository.js';

const SALT_ROUNDS = 10;

function generarToken(usuario) {
  return jwt.sign(
    { sub: String(usuario.id), correo: usuario.correo },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn },
  );
}

export async function registrar({ nombre, correo, password }) {
  const existente = await usuariosRepo.buscarPorCorreo(correo);
  if (existente) {
    throw ApiError.conflict('El correo ya esta registrado');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const usuario = await usuariosRepo.crear({ nombre, correo, passwordHash });

  return { usuario, token: generarToken(usuario) };
}

export async function login({ correo, password }) {
  const usuario = await usuariosRepo.buscarPorCorreo(correo);

  // Mensaje generico para no revelar si el correo existe.
  if (!usuario) {
    throw ApiError.unauthorized('Correo o contraseña incorrectos');
  }

  const coincide = await bcrypt.compare(password, usuario.password_hash);
  if (!coincide) {
    throw ApiError.unauthorized('Correo o contraseña incorrectos');
  }

  const { password_hash, ...usuarioPublico } = usuario;
  return { usuario: usuarioPublico, token: generarToken(usuario) };
}

export async function perfil(usuarioId) {
  const usuario = await usuariosRepo.buscarPorId(usuarioId);
  if (!usuario) {
    throw ApiError.notFound('Usuario no encontrado');
  }
  return usuario;
}
