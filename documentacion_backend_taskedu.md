# Documentacion del Backend - TASKEDU

**Proyecto:** Sistema de Gestion de Tareas Academicas
**Componente:** Backend REST + Base de datos PostgreSQL
**Autor del backend:** (tu nombre)
**Fecha:** Octubre 2026
**Ubicacion del codigo:** `C:\Users\francisco\Desktop\TASKEDU\TASKEDU\backend`

> Este documento explica **que** se construyo en el backend y **como** se
> construyo. Se hace especial enfasis en el manejo seguro de contrasenas
> (hashing), que fue el tema que mas interes despertó.

---

## 1. Vision general

El backend es una **API REST** hecha con **Node.js + Express** que se
conecta a una base de datos **PostgreSQL**. Sigue una **arquitectura
modular por capas**, que separa responsabilidades para que el codigo sea
facil de leer, probar y mantener.

El flujo de una peticion es:

```
Cliente (Postman / React)
        |
        v
     Rutas  (definen URL + metodo + middlewares)
        |
        v
  Middlewares (autenticacion, validacion)
        |
        v
  Controladores (arman la respuesta HTTP)
        |
        v
    Servicios (reglas de negocio y autorizacion)
        |
        v
  Repositorios (SQL parametrizado)
        |
        v
   PostgreSQL (pool de conexiones con 'pg')
```

Ninguna capa "salta" a otra: el controlador nunca escribe SQL, y el
repositorio nunca sabe nada de HTTP. Esta separacion es justamente lo que
pide la seccion 6.2 del plan.

---

## 2. Tecnologias utilizadas

| Paquete          | Para que se uso                                        |
| ---------------- | ------------------------------------------------------ |
| `express`        | Servidor HTTP, rutas y middlewares                     |
| `pg`             | Pool de conexiones y consultas a PostgreSQL            |
| `dotenv`         | Cargar variables de entorno desde `.env`               |
| `cors`           | Autorizar peticiones desde el frontend                 |
| `bcrypt`         | Generar y verificar hashes de contrasenas              |
| `jsonwebtoken`   | Crear y verificar tokens JWT                           |
| `zod`            | Validar los datos de entrada                           |

Se decidio **NO usar un ORM** (como Sequelize o Prisma) en esta etapa,
tal como recomienda el plan: escribir SQL a mano ayuda a entender las
consultas, las relaciones y las restricciones de PostgreSQL.

El proyecto usa **modulos ES** (`"type": "module"` en `package.json`), por
eso se usa `import` / `export` en lugar de `require`.

---

## 3. Base de datos

### 3.1 Creacion

La base de datos se llama `gestion_tareas_academicas`. El esquema completo
esta versionado en el archivo:

```
backend/sql/schema.sql
```

Ese archivo se puede ejecutar de dos formas:

1. Desde **pgAdmin** (Query Tool), pegando su contenido.
2. Desde la terminal con el script automatizado:

   ```
   npm run db:setup
   ```

Este script (`src/config/setup-db.js`) hace dos cosas:

- Se conecta a la base `postgres` para **crear la base de datos si no existe**.
- Se conecta a `gestion_tareas_academicas` y **aplica el `schema.sql`**.

El esquema es **idempotente** (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX
IF NOT EXISTS`), o sea, se puede ejecutar varias veces sin romperse.

### 3.2 Tablas

**`usuarios`** — cuentas de los estudiantes.

| Campo            | Tipo                  | Notas                          |
| ---------------- | --------------------- | ------------------------------ |
| `id`             | `INTEGER IDENTITY`    | Clave primaria                 |
| `nombre`         | `VARCHAR(100)`        | Obligatorio, no vacio          |
| `correo`         | `VARCHAR(150)`        | Unico, con formato valido      |
| `password_hash`  | `VARCHAR(255)`        | **Nunca** la contrasena plana  |
| `creado_en`      | `TIMESTAMPTZ`         | Por defecto `NOW()`            |

**`cursos`** — cada curso pertenece a un usuario.

- `usuario_id` es clave foranea a `usuarios(id)` con `ON DELETE CASCADE`
  (si se borra el usuario, se borran sus cursos).

**`tareas`** — cada tarea pertenece a un curso.

- `curso_id` es clave foranea a `cursos(id)` con `ON DELETE CASCADE`.
- `prioridad` limitada por `CHECK` a `baja`, `media`, `alta`.
- `estado` limitado por `CHECK` a `pendiente`, `en_progreso`, `completada`.
- `actualizado_en` se actualiza **automaticamente** con un *trigger* de
  PostgreSQL (`trg_tareas_actualizado_en`), sin que el backend tenga que
  acordarse de hacerlo.

### 3.3 Restricciones e indices

- `UNIQUE` en `usuarios.correo` → evita correos duplicados.
- `CHECK` en estados y prioridades → la base misma rechaza valores invalidos.
- `CHECK` de correo con expresion regular → formato valido.
- Indices en `usuario_id`, `curso_id`, `estado`, `prioridad`, `fecha_entrega`
  y un indice compuesto `(curso_id, estado)` → aceleran las consultas mas
  frecuentes (listar tareas por curso y filtrar).

### 3.4 Una regla clave de integridad "de negocio"

Una clave foranea garantiza que una tarea apunte a un curso existente,
**pero no garantiza que ese curso sea del usuario autenticado**. Esa
verificacion se hace en la capa de servicios (ver seccion 7.2). El plan lo
advierte explicitamente en la seccion 5.4.

---

## 4. Configuracion y conexion

### 4.1 Variables de entorno (`.env`)

Las credenciales **no viven en el codigo**. Estan en `backend/.env`, que
**no se sube a Git** (esta en `.gitignore`). El archivo `.env.example`
sirve de plantilla sin secretos:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_password_aqui
DB_NAME=gestion_tareas_academicas

JWT_SECRET=CAMBIAR_POR_UN_SECRETO_SEGURO
JWT_EXPIRES_IN=2h

CORS_ORIGIN=http://localhost:5173
```

El modulo `src/config/env.js` carga esas variables con `dotenv` y
**valida que existan las obligatorias** (`DB_USER`, `DB_PASSWORD`,
`DB_NAME`, `JWT_SECRET`). Si falta alguna, el servidor **no arranca** y
avisa cual falta. Asi se evitan fallos silenciosos.

### 4.2 Pool de conexiones (`pg`)

En `src/config/database.js` se crea un **pool** en lugar de una conexion
unica:

```js
export const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  max: 10,                      // maximo 10 conexiones simultaneas
  idleTimeoutMillis: 30000,     // cierra conexiones inactivas
  connectionTimeoutMillis: 5000 // tiempo maximo de espera
});
```

**Por que un pool y no una sola conexion:** abrir y cerrar una conexion a
PostgreSQL es costoso. El pool mantiene un conjunto de conexiones listas y
las reutiliza; cada peticion toma una, la usa y la devuelve. Es mas
eficiente y soporta varias peticiones a la vez.

El modulo exporta ademas:

- `query(text, params)` → ejecuta SQL **parametrizado**.
- `transaction(callback)` → ejecuta varias consultas como una sola unidad
  (`BEGIN` / `COMMIT` / `ROLLBACK`), por si una operacion necesita
  atomicidad.
- `testConnection()` → ejecuta `SELECT NOW()` para comprobar que la
  conexion funciona.
- `closePool()` → cierra todo limpiamente al apagar el servidor.

### 4.3 Arranque (`server.js`)

Al arrancar, el servidor **primero prueba la conexion** con `SELECT NOW()`.
Si falla, muestra un mensaje claro y termina con codigo de error; si
funciona, empieza a escuchar y registra tambien el apagado ordenado
(`SIGINT`/`SIGTERM`) para cerrar el pool.

---

## 5. Estructura de carpetas

```
backend/
├── sql/
│   └── schema.sql              Esquema de la base de datos
├── src/
│   ├── config/
│   │   ├── env.js              Carga y valida variables de entorno
│   │   ├── database.js         Pool, query, transaction, testConnection
│   │   ├── setup-db.js         Crea la BD y aplica schema.sql
│   │   └── seed.js             Inserta datos de prueba
│   ├── routes/                 Define URL + metodo + middlewares
│   ├── controllers/            Reciben req, llaman al servicio, envian res
│   ├── services/               Reglas de negocio y autorizacion
│   ├── repositories/           Consultas SQL parametrizadas
│   ├── middlewares/
│   │   ├── auth.middleware.js      Verifica el JWT
│   │   ├── validate.middleware.js  Valida body/params/query con zod
│   │   └── error.middleware.js      Manejo central de errores
│   ├── validators/             Esquemas de validacion (zod)
│   ├── utils/
│   │   ├── errors.js           Clase ApiError
│   │   └── asyncHandler.js     Envuelve handlers async
│   ├── app.js                  Configura Express (cors, json, rutas)
│   └── server.js               Arranca el servidor
├── .env                        Credenciales reales (NO se sube)
├── .env.example                Plantilla sin secretos
└── package.json
```

---

## 6. Autenticacion y seguridad

Este es el modulo mas importante en cuanto a seguridad. Cubre registro,
inicio de sesion y proteccion de rutas privadas.

### 6.1 Hashing de contrasenas (el tema central)

**Problema:** si guardaramos la contrasena tal cual en la base de datos
("*texto plano*"), cualquiera con acceso a la tabla `usuarios` (un backup,
un empleado, un atacante) veria las contrasenas de todos. Y como mucha
gente reutiliza contrasenas, se pondrian en riesgo otras cuentas.

**Solucion:** guardar un **hash**. Un hash es el resultado de aplicar una
funcion matematica de un solo sentido: se puede calcular el hash a partir
de la contrasena, pero **no se puede recuperar la contrasena a partir del
hash**. En la base se guarda el hash; la contrasena real nunca se
almacena.

**Nota sobre el lenguaje:** el hashing como *concepto* es el mismo en
cualquier backend, pero existen dos matices:

1. El *algoritmo* (bcrypt, Argon2, scrypt...) puede satisfacerse con
   librerias nativas de cada lenguaje.
2. La *libreria* concreta cambia segun el lenguaje del backend:

   | Lenguaje   | Libreria / funcion recomendada                       |
   | ---------- | ---------------------------------------------------- |
   | PHP        | `password_hash()` / `password_verify()` (usa bcrypt) |
   | Java       | `BCryptPasswordEncoder` (Spring Security)            |
   | Python     | `bcrypt` o `passlib`                                 |
   | Node.js/JS | `bcrypt` (paquete de npm)                            |

   Como nuestro backend esta hecho en **Node.js (JavaScript)**, la
   libreria correspondiente es **`bcrypt`** de npm. No se usa otro
   lenguaje; el proyecto tiene un solo backend en JavaScript.

Se usa la libreria **`bcrypt`**. El codigo (en `src/services/auth.service.js`):

```js
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

// Al registrar:
const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
// se guarda passwordHash en usuarios.password_hash
```

```js
// Al iniciar sesion:
const coincide = await bcrypt.compare(password, usuario.password_hash);
// compara la contrasena escrita contra el hash guardado
```

**Conceptos clave:**

- **Salt (sal):** un valor aleatorio que bcrypt genera **automaticamente**
  y mezcla con la contrasena antes de calcular el hash. Gracias al salt,
  dos usuarios con la *misma* contrasena terminan con hashes *distintos*.
  Esto impide ataques de "tablas precalculadas" (rainbow tables). No hay
  que generar ni guardar el salt aparte: **bcrypt lo incrusta dentro del
  propio string del hash**.

- **SALT_ROUNDS = 10 (costo):** es cuantas veces se repite internamente el
  algoritmo. A mayor numero, mas lento (mas seguro contra fuerza bruta)
  pero mas costo de CPU. `10` es un equilibrio razonable para desarrollo
  y proyectos academicos. Un hash de bcrypt luce asi:

  ```
  $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
   ^  ^  ^--------------------- salt + hash ----------------------^
   |  |
   |  +-- costo (10 rondas)
   +----- version del algoritmo ($2b$)
  ```

  Como el costo y el salt van dentro del hash, `bcrypt.compare` sabe
  exactamente como volver a calcularlo y comparar.

- **`bcrypt.compare` es seguro por diseño:** vuelve a hashear la contrasena
  recibida usando el salt que viene en el hash guardado y compara. No es
  una simple comparacion de strings.

- **Nunca se devuelve el hash al cliente.** En el repositorio de usuarios,
  las consultas publicas seleccionan solo `id, nombre, correo, creado_en`.
  El `password_hash` solo se lee internamente para el login, y en el
  servicio se elimina del objeto antes de responder:

  ```js
  const { password_hash, ...usuarioPublico } = usuario;
  ```

- **Mensaje de error generico en login:** si el correo no existe o la
  contrasena es incorrecta, se responde siempre
  `"Correo o contrasena incorrectos"`. Asi un atacante no puede averiguar
  que correos existen.

- **Validacion previa:** `zod` exige que la contrasena tenga entre 8 y 72
  caracteres. El limite de 72 no es arbitrario: bcrypt solo considera los
  primeros 72 bytes.

### 6.2 JWT (JSON Web Token)

Tras un registro o login exitoso, el backend firma un **token JWT** que el
cliente guarda y envia en cada peticion privada.

```js
import jwt from 'jsonwebtoken';

jwt.sign({ sub: String(usuario.id), correo: usuario.correo }, env.jwt.secret, {
  expiresIn: env.jwt.expiresIn // "2h"
});
```

El token va firmado con `JWT_SECRET`. Si alguien lo modifica, la firma deja
de coincidir y el token se rechaza. Ademas **expira** a las 2 horas.

El cliente lo envia en el encabezado:

```
Authorization: Bearer <token>
```

### 6.3 Middleware de autenticacion

`src/middlewares/auth.middleware.js`:

1. Lee el encabezado `Authorization`.
2. Comprueba que empiece con `Bearer `.
3. Verifica el token con `jwt.verify`.
4. Deja la identidad validada en `req.usuario`.
5. Si expiro o es invalido, responde `401`.

Detalle importante: el `id` se convierte a numero:

```js
req.usuario = { id: Number(payload.sub), correo: payload.correo };
```

**El backend nunca confia en un `usuario_id` enviado por el frontend.**
La identidad sale unicamente del token. Esto evita que un usuario se haga
pasar por otro cambiando un numero en la peticion (una vulnerabilidad muy
tipica llamada IDOR).

---

## 7. Modulos funcionales

### 7.1 Validacion de entrada (zod)

Antes de llegar al controlador, un middleware valida los datos. El
middleware `validate` recibe esquemas para `body`, `params` y `query`:

```js
router.post('/', validate({ body: crearTareaSchema }), controller.crear);
```

Si los datos no cumplen, responde `400` con el detalle de cada campo
invalido. Ejemplo real de respuesta:

```json
{
  "error": "Datos invalidos",
  "detalles": [
    { "campo": "correo", "mensaje": "El correo no tiene un formato valido" },
    { "campo": "password", "mensaje": "La contrasena debe tener al menos 8 caracteres" }
  ]
}
```

Los validadores tambien **transforman** datos: por ejemplo, la fecha de
entrega se convierte a formato ISO, el `id` de la URL a numero, y el correo
a minusculas (para que `Ana@Correo.com` y `ana@correo.com` sean el mismo).

### 7.2 Autenticacion (`/api/auth`)

| Metodo | Endpoint            | Descripcion                    |
| ------ | ------------------- | ------------------------------ |
| POST   | `/api/auth/register`| Registra usuario, devuelve token |
| POST   | `/api/auth/login`   | Inicia sesion, devuelve token  |
| GET    | `/api/auth/me`      | Datos del usuario autenticado  |

El servicio `auth.service.js`:

- `registrar`: verifica que el correo no exista (si existe, `409`);
  hashea la contrasena; crea el usuario; devuelve usuario publico + token.
- `login`: busca por correo; compara con `bcrypt.compare`; si algo falla,
  `401` generico; devuelve usuario publico + token.
- `perfil`: devuelve los datos publicos del usuario.

### 7.3 Cursos (`/api/cursos`)

CRUD completo. Todas las rutas pasan por el middleware `authenticate`.

**Regla de negocio clave:** cada operacion primero verifica la **propiedad**.
En `cursos.service.js`:

```js
export async function obtener(usuarioId, cursoId) {
  const curso = await cursosRepo.buscarPorId(cursoId);
  if (!curso || curso.usuario_id !== usuarioId) {
    throw ApiError.notFound('Curso no encontrado');
  }
  return curso;
}
```

Si el curso no existe **o es de otro usuario**, se responde `404`. Se usa
`404` (y no `403`) a proposito: asi el atacante no puede distinguir entre
"no existe" y "existe pero no es tuyo", lo que evita filtrar informacion.

### 7.4 Tareas (`/api/tareas`)

CRUD completo mas filtros. Aqui esta la logica mas interesante del backend.

**Verificacion en dos niveles:**

1. Para acceder a una tarea, se comprueba que el curso de esa tarea
   pertenezca al usuario (el repositorio hace `JOIN` con `cursos` y trae
   `c.usuario_id`, comparado en el servicio).
2. Al **crear o mover** una tarea a otro curso, se verifica que ese curso
   destino sea del usuario (`verificarCursoPropio`).

**Filtros y ordenamiento con SQL dinamico seguro.** En
`tareas.repository.js` se construye la consulta segun los filtros, pero
**siempre con parametros** (`$1`, `$2`, ...), nunca concatenando valores
del usuario. Ademas el nombre de la columna de ordenamiento se elige de una
**lista blanca** (`ORDEN_VALIDO`), porque los nombres de columna no se
pueden parametrizar:

```js
const ORDEN_VALIDO = {
  fecha_entrega: 't.fecha_entrega',
  creado_en: 't.creado_en',
  prioridad: "CASE t.prioridad WHEN 'alta' THEN 1 WHEN 'media' THEN 2 ELSE 3 END"
};
```

Filtros soportados (todos definidos en `tareas.validator.js`):

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

- `busqueda` usa `ILIKE` (busqueda de texto que ignora mayusculas).
- `vencidas` = `fecha_entrega < NOW()` **y** estado distinto de
  `completada`. Esto respeta la seccion 9.2 del plan: una tarea puede estar
  pendiente y vencida a la vez; el vencimiento se **calcula**, no es un
  estado almacenado. Esa distincion es clave y viene del plan.
- `proximas` = entre hoy y los siguientes 7 dias.
- Cada tarea incluye un campo calculado `vencida` (booleano) para que el
  frontend lo muestre sin repetir la logica.

Tambien existe `PATCH /api/tareas/:id/estado` para cambiar solo el estado,
que es mas comodo para el boton rapido "marcar como completada" de la UI.

### 7.5 Panel / Dashboard (`/api/dashboard/resumen`)

Devuelve estadisticas **solo del usuario autenticado** (nunca de otros):

- `total`, `pendientes`, `en_progreso`, `completadas`, `vencidas`,
  `proximas`.
- Desglose por curso (`porCurso`).
- Las 5 proximas entregas ordenadas por fecha (`proximasEntregas`).

Se resuelve en **una sola consulta** usando `COUNT(*) FILTER (WHERE ...)`,
que cuenta varias condiciones a la vez de forma eficiente:

```sql
SELECT
  COUNT(*) FILTER (WHERE t.estado = 'pendiente')::int   AS pendientes,
  COUNT(*) FILTER (WHERE t.estado = 'en_progreso')::int AS en_progreso,
  ...
FROM tareas t
JOIN cursos c ON c.id = t.curso_id
WHERE c.usuario_id = $1
```

---

## 8. Manejo de errores

Todo error de la API pasa por **un solo** middleware central
(`error.middleware.js`). Esto evita repetir `try/catch` en cada
controlador y garantiza respuestas consistentes.

Para que el error llegue ahi sin escribir `try/catch`, los controladores se
envuelven con `asyncHandler`:

```js
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
```

Errores controlados: se lanzan con la clase `ApiError`, que tiene helpers:

```js
ApiError.badRequest('Datos invalidos', detalles); // 400
ApiError.unauthorized();                          // 401
ApiError.forbidden();                             // 403
ApiError.notFound('Curso no encontrado');         // 404
ApiError.conflict('El correo ya esta registrado'); // 409
```

El middleware tambien **traduce errores nativos de PostgreSQL** a codigos
HTTP correctos:

| Codigo PostgreSQL | Significado               | Respuesta |
| ----------------- | ------------------------- | --------- |
| `23505`           | Valor unico duplicado     | `409`     |
| `23503`           | Clave foranea invalida    | `400`     |
| `23514`           | Restriccion CHECK violada | `400`     |

Y como red de seguridad, cualquier error no esperado responde `500` con un
mensaje generico. **Nunca se expone la traza interna, ni el SQL, ni el
hash** al cliente.

---

## 9. Codigos HTTP usados

| Codigo | Cuando                                          |
| ------ | ----------------------------------------------- |
| `200`  | Consulta o modificacion exitosa                 |
| `201`  | Recurso creado (registro, curso, tarea)         |
| `204`  | Eliminacion exitosa (sin cuerpo)                |
| `400`  | Datos o parametros invalidos                    |
| `401`  | Falta token, token invalido o expirado, o login incorrecto |
| `403`  | Reservado para cuando haya roles                 |
| `404`  | Recurso inexistente o ajeno (no accesible)      |
| `409`  | Conflicto (correo duplicado)                    |
| `500`  | Error inesperado del servidor                   |

---

## 10. Conexion a la base de datos y usuario

La conexion usa **usuario `postgres`** en **`localhost:5432`** y la base
`gestion_tareas_academicas`. La contrasena va en `.env` (no en el codigo).

Prueba de conexion implementada como endpoint:

```
GET /api/health
```

Respuesta:

```json
{
  "estado": "ok",
  "baseDeDatos": "conectada",
  "ahora": "2026-10-13T15:15:52.154Z"
}
```

Eso cumple el "primer entregable recomendado" del plan (seccion 15): la
base creada, el esquema versionado y una conexion funcional que ejecuta
`SELECT NOW()`.

---

## 11. Datos de prueba y ejecucion

### Insertar datos de prueba

```
npm run db:seed
```

Crea un usuario demo y varios cursos y tareas (una vencida, una en
progreso, etc.):

- Correo: `demo@taskedu.com`
- Contrasena: `Demo1234`

### Arrancar

```
npm start      # normal
npm run dev    # con recarga automatica (node --watch)
```

La API queda en `http://localhost:3000/api`.

---

## 12. Pruebas realizadas (evidencia)

Se probaron los endpoints y estos fueron los resultados:

- Registro correcto → `201`.
- Registro con correo duplicado → `409`.
- Registro con datos invalidos (correo malo, contrasena corta) → `400` con
  detalle por campo.
- Login correcto → `200` con token.
- Login con contrasena incorrecta → `401`.
- Ruta privada sin token → `401`.
- Crear curso y tarea → `201`.
- Cambiar estado de tarea (`PATCH`) → `200`.
- Filtros (`vencidas`, prioridad, busqueda) → resultados correctos.
- Un usuario intentando ver una tarea o curso de otro → `404`.
- Recurso inexistente → `404`.
- Eliminar → `204` y luego el recurso ya no existe.

**Hallazgo y correccion:** al principio el `id` del usuario en el token
JWT llegaba como *texto*, y una comparacion estricta
(`curso.usuario_id !== usuarioId`) fallaba aunque el duenio fuera el mismo.
Se corrigio convirtiendo el id a numero en el middleware de autenticacion
(`Number(payload.sub)`). Esto demuestra por que conviene tipar bien los
datos que vienen del token.

---

## 13. Decisiones de seguridad aplicadas (resumen)

1. Contrasenas con **hash bcrypt** (nunca texto plano).
2. **Sal** automatica por contrasena (evita rainbow tables).
3. `password_hash` **nunca** se devuelve al cliente.
4. **JWT** firmado y con expiracion.
5. La identidad sale **solo del token**, no de un `usuario_id` del cliente.
6. **SQL siempre parametrizado** → evita inyeccion SQL.
7. Lista blanca para nombres de columna en el ordenamiento.
8. Mensajes de error **genericos** en login (no revela si el correo existe).
9. `404` para recursos ajenos (no revela su existencia).
10. Credenciales fuera del repositorio (`.env` en `.gitignore`).
11. Manejo central de errores sin exponer detalles internos.

---

## 14. Proximos pasos sugeridos

- **Roles** (admin / estudiante): columna `rol` con `CHECK`, incluir el rol
  en el JWT y un middleware `authorize('admin')` para endpoints de
  administracion (gestion de usuarios y estadisticas globales).
- **Recordatorios** (RF-05): avisos de entregas proximas y destacado de
  vencidas.
- Frontend en **React + Vite** e integracion con estos endpoints.
- Coleccion de **Postman** con los casos de prueba.
- Cambiar `JWT_SECRET` por un valor seguro y rotar credenciales antes de
  cualquier despliegue.

---

## 15. Mapa rapido de archivos importantes

| Necesito...                                | Archivo                                              |
| ------------------------------------------ | ---------------------------------------------------- |
| Ver la estructura de la base de datos      | `backend/sql/schema.sql`                             |
| Entender la configuracion de conexion      | `backend/src/config/database.js`                     |
| Ver como se hashean contrasenas            | `backend/src/services/auth.service.js`               |
| Ver como se verifica el token              | `backend/src/middlewares/auth.middleware.js`         |
| Ver como se valida la entrada              | `backend/src/validators/*.validator.js`              |
| Ver las consultas SQL de tareas y filtros  | `backend/src/repositories/tareas.repository.js`      |
| Ver el manejo de errores                   | `backend/src/middlewares/error.middleware.js`        |
| Ver todas las rutas                        | `backend/src/routes/*.routes.js`                     |
```
