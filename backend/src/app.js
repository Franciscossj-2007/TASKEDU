import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middlewares/error.middleware.js';
import { env } from './config/env.js';

const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: '1mb' }));

app.get('/', (req, res) => {
  res.json({ mensaje: 'API de Gestion de Tareas Academicas', api: '/api' });
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
