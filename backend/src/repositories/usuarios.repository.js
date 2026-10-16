import { query } from '../config/database.js';

const COLUMNAS_PUBLICAS = 'id, nombre, correo, creado_en';

export async function crear({ nombre, correo, passwordHash }) {
  const { rows } = await query(
    `INSERT INTO usuarios (nombre, correo, password_hash)
     VALUES ($1, $2, $3)
     RETURNING ${COLUMNAS_PUBLICAS}`,
    [nombre, correo, passwordHash],
  );
  return rows[0];
}

export async function buscarPorCorreo(correo) {
  const { rows } = await query(
    'SELECT id, nombre, correo, password_hash, creado_en FROM usuarios WHERE correo = $1',
    [correo],
  );
  return rows[0] || null;
}

export async function buscarPorId(id) {
  const { rows } = await query(
    `SELECT ${COLUMNAS_PUBLICAS} FROM usuarios WHERE id = $1`,
    [id],
  );
  return rows[0] || null;
}
