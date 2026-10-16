// Cliente oficial de PostgreSQL para Node.js.
import pg from 'pg';
import { env } from './env.js';

// Pool: conjunto de conexiones reutilizables a la base de datos.
const { Pool } = pg;

// Crea el pool con los datos del .env.
export const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  max: 10, // máximo de conexiones simultáneas
  idleTimeoutMillis: 30000, // cierra conexiones inactivas tras 30 s
  connectionTimeoutMillis: 5000, // falla si no logra conectar en 5 s
});

// Evita que un error de una conexión inactiva tumbe todo el proceso.
pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err.message);
});

/**
 * Ejecuta una consulta parametrizada.
 * @param {string} text SQL con placeholders ($1, $2, ...)
 * @param {Array} params Valores de la consulta
 */
export function query(text, params) {
  // Los parámetros se envían aparte del SQL: esto evita inyección SQL.
  return pool.query(text, params);
}

/**
 * Ejecuta una funcion dentro de una transaccion.
 * @param {(client: import('pg').PoolClient) => Promise<any>} callback
 */
export async function transaction(callback) {
  // Toma una conexión exclusiva del pool.
  const client = await pool.connect();
  try {
    await client.query('BEGIN'); // inicia la transacción
    const result = await callback(client); // ejecuta las operaciones
    await client.query('COMMIT'); // confirma los cambios
    return result;
  } catch (error) {
    await client.query('ROLLBACK'); // deshace todo si algo falló
    throw error;
  } finally {
    client.release(); // devuelve la conexión al pool
  }
}

/**
 * Comprueba la conexion con PostgreSQL.
 */
export async function testConnection() {
  const { rows } = await query('SELECT NOW() AS ahora');
  return rows[0].ahora;
}

// Cierra todas las conexiones (se usa al apagar el servidor o terminar un script).
export async function closePool() {
  await pool.end();
}
