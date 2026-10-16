// Framework web para crear el servidor HTTP y las rutas.
import express from 'express';
// Middleware que permite (o restringe) peticiones desde otros orígenes (el frontend).
import cors from 'cors';
// Router principal que agrupa todas las rutas de la API.
import routes from './routes/index.js';
// Manejadores de "ruta no encontrada" y de errores globales.
import { notFound, errorHandler } from './middlewares/error.middleware.js';
// Variables de entorno ya validadas.
import { env } from './config/env.js';

// Crea la aplicación Express.
const app = express();

// Habilita CORS solo para el origen configurado en el .env.
app.use(cors({ origin: env.corsOrigin }));
// Interpreta el cuerpo de las peticiones JSON (máximo 1 MB) y lo deja en req.body.
app.use(express.json({ limit: '1mb' }));

// Ruta raíz: mensaje simple para comprobar que la API responde.
app.get('/', (req, res) => {
  res.json({ mensaje: 'API de Gestion de Tareas Academicas', api: '/api' });
});

// Todas las rutas de la API cuelgan del prefijo /api.
app.use('/api', routes);

// Si ninguna ruta coincidió, responde 404.
app.use(notFound);
// Último middleware: convierte cualquier error en una respuesta JSON.
app.use(errorHandler);

// Exporta la app para que server.js la ponga a escuchar.
export default app;
