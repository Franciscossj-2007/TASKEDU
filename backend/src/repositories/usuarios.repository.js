import { query } from '../config/database.js';

// Columnas que se pueden devolver al cliente (nunca password_hash).
const COLUMNAS_PUBLICAS = 'id, nombre, correo, creado_en';

// Inserta un usuario nuevo y devuelve sus datos públicos.
export async function crear({ nombre, correo, passwordHash }) {
  const { rows } = await query(
    `INSERT INTO usuarios (nombre, correo, password_hash)
     VALUES ($1, $2, $3)
     RETURNING ${COLUMNAS_PUBLICAS}`,
    [nombre, correo, passwordHash],
  );
  return rows[0];
}

// Busca por correo incluyendo password_hash (se necesita para verificar el login).
export async function buscarPorCorreo(correo) {
  const { rows } = await query(
    'SELECT id, nombre, correo, password_hash, creado_en FROM usuarios WHERE correo = $1',
    [correo],
  );
  // Devuelve null si no hay coincidencias.
  return rows[0] || null;
}

// Busca por id devolviendo solo datos públicos.
export async function buscarPorId(id) {
  const { rows } = await query(
    `SELECT ${COLUMNAS_PUBLICAS} FROM usuarios WHERE id = $1`,
    [id],
  );
  return rows[0] || null;
}
