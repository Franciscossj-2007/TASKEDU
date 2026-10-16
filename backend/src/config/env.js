// Carga el archivo .env y lo vuelca en process.env.
import 'dotenv/config';

// Variables sin las cuales la aplicación no puede funcionar.
const required = ['DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];

// Si falta alguna, se detiene el arranque con un mensaje claro.
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Falta la variable de entorno obligatoria: ${key}`);
  }
}

// Objeto de configuración que usa el resto de la aplicación.
export const env = {
  // Puerto HTTP del servidor (3000 por defecto).
  port: Number(process.env.PORT) || 3000,
  // Entorno de ejecución: development, production, test...
  nodeEnv: process.env.NODE_ENV || 'development',
  // Datos de conexión a PostgreSQL.
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  // Configuración de los tokens JWT.
  jwt: {
    // Clave secreta con la que se firman los tokens.
    secret: process.env.JWT_SECRET,
    // Tiempo de vida del token (2 horas por defecto).
    expiresIn: process.env.JWT_EXPIRES_IN || '2h',
  },
  // Origen del frontend autorizado por CORS ('*' = cualquiera).
  corsOrigin: process.env.CORS_ORIGIN || '*',
};
