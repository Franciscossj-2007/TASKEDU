// Aplicación Express ya configurada (middlewares y rutas).
import app from './app.js';
// Configuración leída del archivo .env.
import { env } from './config/env.js';
// Funciones para probar la conexión a PostgreSQL y cerrar el pool.
import { testConnection, closePool } from './config/database.js';

// Función de arranque: primero verifica la base de datos y luego levanta el servidor.
async function iniciar() {
  try {
    // Ejecuta una consulta simple (SELECT NOW()) para comprobar la conexión.
    const ahora = await testConnection();
    console.log(`Conexion a PostgreSQL establecida (${ahora.toISOString()}).`);
  } catch (error) {
    // Sin base de datos no tiene sentido arrancar: se informa y se termina el proceso.
    console.error('No se pudo conectar a PostgreSQL:', error.message);
    console.error('Verifique las credenciales y que el servidor este activo.');
    process.exit(1);
  }

  // Pone la aplicación a escuchar peticiones en el puerto configurado.
  const server = app.listen(env.port, () => {
    console.log(`Servidor escuchando en http://localhost:${env.port}`);
    console.log(`Entorno: ${env.nodeEnv}`);
  });

  // Errores al abrir el puerto (por ejemplo, otra copia del backend ya esta corriendo).
  server.on('error', async (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`El puerto ${env.port} ya esta en uso. Probablemente el backend ya esta corriendo.`);
      console.error('Cierre el otro proceso o cambie PORT en backend/.env.');
      console.error(`Para liberarlo (PowerShell): Get-NetTCPConnection -LocalPort ${env.port} -State Listen | % { Stop-Process -Id $_.OwningProcess -Force }`);
    } else {
      console.error('Error del servidor:', error.message);
    }
    await closePool();
    process.exit(1);
  });

  // Cierre ordenado: deja de aceptar peticiones y cierra las conexiones a la BD.
  const apagar = async (senal) => {
    console.log(`\n${senal} recibida. Cerrando servidor...`);
    server.close(async () => {
      await closePool();
      console.log('Conexiones cerradas. Adios.');
      process.exit(0);
    });
  };

  // Ctrl+C en la terminal.
  process.on('SIGINT', () => apagar('SIGINT'));
  // Señal de terminación enviada por el sistema o un gestor de procesos.
  process.on('SIGTERM', () => apagar('SIGTERM'));
}

// Ejecuta el arranque.
iniciar();
