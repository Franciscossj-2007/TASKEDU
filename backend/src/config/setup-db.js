// Lee archivos del disco (el esquema SQL).
import { readFile } from 'node:fs/promises';
// Utilidades para obtener la ruta de este archivo en módulos ES.
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pg from 'pg';
import { env } from './env.js';

// Se usa Client (una sola conexión) en lugar de Pool porque es un script puntual.
const { Client } = pg;

// En módulos ES no existe __dirname, se reconstruye a partir de import.meta.url.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Ruta absoluta de sql/schema.sql.
const schemaPath = path.resolve(__dirname, '../../sql/schema.sql');

// Crea la base de datos si todavía no existe.
async function ensureDatabase() {
  // Se conecta a la base "postgres" (siempre existe) para poder crear la nuestra.
  const admin = new Client({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: 'postgres',
  });

  await admin.connect();
  try {
    // Consulta el catálogo del sistema para saber si ya existe.
    const { rowCount } = await admin.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [env.db.database],
    );
    if (rowCount === 0) {
      // CREATE DATABASE no admite parámetros ($1), por eso se interpola el nombre entre comillas.
      await admin.query(`CREATE DATABASE "${env.db.database}"`);
      console.log(`Base de datos creada: ${env.db.database}`);
    } else {
      console.log(`La base de datos ya existe: ${env.db.database}`);
    }
  } finally {
    // Siempre cierra la conexión administrativa.
    await admin.end();
  }
}

// Ejecuta schema.sql (tablas, índices y trigger) sobre la base de datos del proyecto.
async function applySchema() {
  // Lee el contenido completo del archivo SQL.
  const sql = await readFile(schemaPath, 'utf8');
  // Ahora sí se conecta a la base de datos del proyecto.
  const client = new Client({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
  });

  await client.connect();
  try {
    // Ejecuta todas las sentencias del esquema de una vez.
    await client.query(sql);
    console.log('Esquema aplicado correctamente.');
  } finally {
    await client.end();
  }
}

// Orquesta los dos pasos y gestiona los errores.
async function main() {
  try {
    await ensureDatabase();
    await applySchema();
    console.log('Base de datos lista.');
  } catch (error) {
    console.error('Error al preparar la base de datos:', error.message);
    // Marca el proceso con código de error sin cortarlo bruscamente.
    process.exitCode = 1;
  }
}

main();
