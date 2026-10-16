import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

export const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err.message);
});

/**
 * Ejecuta una consulta parametrizada.
 * @param {string} text SQL con placeholders ($1, $2, ...)
 * @param {Array} params Valores de la consulta
 */
export function query(text, params) {
  return pool.query(text, params);
}

/**
 * Ejecuta una funcion dentro de una transaccion.
 * @param {(client: import('pg').PoolClient) => Promise<any>} callback
 */
export async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Comprueba la conexion con PostgreSQL.
 */
export async function testConnection() {
  const { rows } = await query('SELECT NOW() AS ahora');
  return rows[0].ahora;
}

export async function closePool() {
  await pool.end();
}
