import app from './app.js';
import { env } from './config/env.js';
import { testConnection, closePool } from './config/database.js';

async function iniciar() {
  try {
    const ahora = await testConnection();
    console.log(`Conexion a PostgreSQL establecida (${ahora.toISOString()}).`);
  } catch (error) {
    console.error('No se pudo conectar a PostgreSQL:', error.message);
    console.error('Verifique las credenciales y que el servidor este activo.');
    process.exit(1);
  }

  const server = app.listen(env.port, () => {
    console.log(`Servidor escuchando en http://localhost:${env.port}`);
    console.log(`Entorno: ${env.nodeEnv}`);
  });

  const apagar = async (senal) => {
    console.log(`\n${senal} recibida. Cerrando servidor...`);
    server.close(async () => {
      await closePool();
      console.log('Conexiones cerradas. Adios.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => apagar('SIGINT'));
  process.on('SIGTERM', () => apagar('SIGTERM'));
}

iniciar();
