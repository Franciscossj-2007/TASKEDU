import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pg from 'pg';
import { env } from './env.js';

const { Client } = pg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(__dirname, '../../sql/schema.sql');

async function ensureDatabase() {
  const admin = new Client({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: 'postgres',
  });

  await admin.connect();
  try {
    const { rowCount } = await admin.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [env.db.database],
    );
    if (rowCount === 0) {
      await admin.query(`CREATE DATABASE "${env.db.database}"`);
      console.log(`Base de datos creada: ${env.db.database}`);
    } else {
      console.log(`La base de datos ya existe: ${env.db.database}`);
    }
  } finally {
    await admin.end();
  }
}

async function applySchema() {
  const sql = await readFile(schemaPath, 'utf8');
  const client = new Client({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
  });

  await client.connect();
  try {
    await client.query(sql);
    console.log('Esquema aplicado correctamente.');
  } finally {
    await client.end();
  }
}

async function main() {
  try {
    await ensureDatabase();
    await applySchema();
    console.log('Base de datos lista.');
  } catch (error) {
    console.error('Error al preparar la base de datos:', error.message);
    process.exitCode = 1;
  }
}

main();
