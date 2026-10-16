# TASKEDU

Sistema de Gestion de Tareas Academicas. Backend REST con Node.js, Express
y PostgreSQL, siguiendo el plan de desarrollo del proyecto.

## Tecnologias

- Node.js + Express
- PostgreSQL (administrado con pgAdmin)
- `pg`, `bcrypt`, `jsonwebtoken`, `zod`, `dotenv`, `cors`

## Estructura

```
backend/
├── sql/
│   └── schema.sql          Esquema de la base de datos
├── src/
│   ├── config/             Variables de entorno y pool de conexion
│   ├── routes/             Definicion de endpoints
│   ├── controllers/        Coordinan peticion y respuesta
│   ├── services/           Reglas de negocio y autorizaciones
│   ├── repositories/       Consultas SQL parametrizadas
│   ├── middlewares/        Autenticacion, validacion y errores
│   ├── validators/         Esquemas de validacion con zod
│   ├── utils/              Helpers (errores, asyncHandler)
│   ├── app.js              Configuracion de Express
│   └── server.js           Arranque del servidor
├── .env                    Credenciales locales (NO se sube a Git)
└── .env.example            Plantilla de variables de entorno
```

## Puesta en marcha

1. Instalar dependencias:

   ```
   cd backend
   npm install
   ```

2. Configurar el archivo `.env` (copiar de `.env.example`) con los datos
   de PostgreSQL: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`,
   `DB_NAME`, `JWT_SECRET`.

3. Crear la base de datos y aplicar el esquema:

   ```
   npm run db:setup
   ```

   Tambien se puede ejecutar `backend/sql/schema.sql` desde el Query Tool
   de pgAdmin.

4. (Opcional) Insertar datos de prueba:

   ```
   npm run db:seed
   ```

   Usuario demo: `demo@taskedu.com` / contrasena `Demo1234`.

5. Iniciar el servidor:

   ```
   npm start        # produccion
   npm run dev      # desarrollo con recarga
   ```

   La API queda disponible en `http://localhost:3000/api`.

## Endpoints

| Metodo | Endpoint                     | Descripcion                |
| ------ | ---------------------------- | -------------------------- |
| POST   | `/api/auth/register`         | Registrar usuario          |
| POST   | `/api/auth/login`            | Iniciar sesion             |
| GET    | `/api/auth/me`               | Usuario autenticado        |
| GET    | `/api/cursos`                | Listar cursos propios      |
| POST   | `/api/cursos`                | Crear curso                |
| GET    | `/api/cursos/:id`            | Consultar curso propio     |
| PUT    | `/api/cursos/:id`            | Actualizar curso           |
| DELETE | `/api/cursos/:id`            | Eliminar curso             |
| GET    | `/api/cursos/:id/tareas`     | Tareas del curso           |
| GET    | `/api/tareas`                | Listar y filtrar tareas    |
| POST   | `/api/tareas`                | Crear tarea                |
| GET    | `/api/tareas/:id`            | Consultar tarea propia     |
| PUT    | `/api/tareas/:id`            | Actualizar tarea           |
| PATCH  | `/api/tareas/:id/estado`     | Cambiar estado             |
| DELETE | `/api/tareas/:id`            | Eliminar tarea             |
| GET    | `/api/dashboard/resumen`     | Estadisticas propias       |
| GET    | `/api/health`                | Estado y conexion a la BD  |

Las rutas privadas requieren el encabezado
`Authorization: Bearer <token>`.

### Filtros de tareas

```
GET /api/tareas?estado=pendiente
GET /api/tareas?prioridad=alta
GET /api/tareas?curso_id=2
GET /api/tareas?vencimiento=proximas   (vence en los proximos 7 dias)
GET /api/tareas?vencimiento=vencidas
GET /api/tareas?busqueda=parcial
GET /api/tareas?orden=fecha_entrega&dir=asc
GET /api/tareas?page=1&limit=10
```
