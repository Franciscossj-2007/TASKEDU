# Documentacion del Frontend - TASKEDU

**Proyecto:** Sistema de Gestion de Tareas Academicas
**Componente:** Interfaz web (React + Vite) integrada con la API REST del backend
**Fecha:** Octubre 2026
**Ubicacion del codigo:** `C:\Users\francisco\Desktop\TASKEDU\TASKEDU\frontend`

> Este documento explica **que** se construyo en el frontend y **como** se
> conecta con el backend ya existente. Se hace especial enfasis en la
> integracion entre ambas partes, que es la pregunta clave de esta etapa.

---

## 1. Vision general

El frontend es una **aplicacion de una sola pagina (SPA)** hecha con **React** y
**Vite**. No vuelve a implementar ninguna regla de negocio ni escribe consultas:
**todo lo que es datos vive en el backend**. El navegador solo pide, muestra y
actualiza informacion.

El flujo de una peticion en el frontend es:

```
Pagina (React)
    |
    v
 Componente de negocio  (ej. TareaFormulario, Dashboard)
    |
    v
  Servicio  (auth.service, tareas.service, ...)
    |
    v
 api.js  (axios: agrega el token, normaliza errores)
    |
    v
 Proxy de Vite  (/api  ->  http://localhost:3000)
    |
    v
 Backend (Express + PostgreSQL)  ->  responde JSON
    |
    v
 El componente actualiza el estado y la interfaz se redibuja
```

Regla de arquitectura aplicada: **los componentes visuales nunca hacen peticiones
HTTP directamente**. Siempre pasan por el directorio `services/`, tal como pide la
seccion 11.3 del plan. Asi, si un dia cambia la URL o el formato de la API, solo
se toca un archivo.

---

## 2. Tecnologias utilizadas

| Paquete              | Para que se uso                                            |
| -------------------- | ---------------------------------------------------------- |
| `react`              | Construir la interfaz (componentes, estado, contexto)      |
| `vite`               | Servidor de desarrollo y compilacion a produccion          |
| `react-router-dom`   | Navegacion entre paginas y rutas protegidas                |
| `axios`              | Cliente HTTP para hablar con el backend                    |
| CSS puro             | Estilos y diseno responsive (sin libreria externa)         |

Se decidio **NO usar librerias de componentes ni de estado externas** (como
Material UI, Tailwind, Redux o React Query). La interfaz se construyo con
componentes propios y CSS a mano, y el estado se maneja con `useState` y
Context de React. Esto mantiene el proyecto simple y facil de entender para un
proyecto academico.

El proyecto usa **modulos ES** (`"type": "module"` en `package.json`).

---

## 3. Estructura de carpetas

```
frontend/
├── public/
│   └── favicon.svg                 Icono de la pestana
├── src/
│   ├── services/                   Toda la comunicacion con el backend
│   │   ├── api.js                  Instancia de axios, token y errores
│   │   ├── auth.service.js         Registro, login y perfil
│   │   ├── cursos.service.js       CRUD de cursos
│   │   ├── tareas.service.js       CRUD y filtros de tareas
│   │   └── dashboard.service.js    Estadisticas del panel
│   ├── context/
│   │   ├── AuthContext.jsx         Sesion del usuario (token + usuario)
│   │   └── ToastContext.jsx        Avisos flotantes (exito/error)
│   ├── hooks/
│   │   └── useAuth.js              Acceso comodo al contexto de sesion
│   ├── layouts/
│   │   ├── AuthLayout.jsx          Marco de login y registro
│   │   └── AppLayout.jsx           Marco con sidebar para las paginas privadas
│   ├── components/
│   │   ├── RutaProtegida.jsx       Protege las rutas privadas
│   │   ├── RutaPublica.jsx         Redirige al panel si ya hay sesion
│   │   ├── Sidebar.jsx             Menu lateral
│   │   ├── Topbar.jsx              Barra superior (movil)
│   │   ├── TareaCard.jsx           Tarjeta de una tarea
│   │   ├── TareaFormulario.jsx     Formulario crear/editar tarea
│   │   ├── CursoCard.jsx           Tarjeta de un curso
│   │   ├── CursoFormulario.jsx     Formulario crear/editar curso
│   │   ├── FiltrosTareas.jsx       Barra de filtros y busqueda
│   │   ├── EstadisticaCard.jsx     Tarjeta de un numero del panel
│   │   └── ui/                     Componentes genericos reutilizables
│   │       ├── Button.jsx  Input.jsx  Select.jsx  Textarea.jsx
│   │       ├── Campo.jsx   Modal.jsx  Alerta.jsx  Badge.jsx
│   │       ├── Spinner.jsx Tarjeta.jsx Progreso.jsx
│   │       ├── EstadoVacio.jsx
│   │       └── ConfirmDialog.jsx
│   ├── pages/
│   │   ├── Login.jsx  Registro.jsx  Dashboard.jsx
│   │   ├── Tareas.jsx  Cursos.jsx  CursoDetalle.jsx
│   │   └── NoEncontrado.jsx
│   ├── utils/
│   │   ├── constantes.js   Estados y prioridades (etiquetas y colores)
│   │   ├── fechas.js       Formato y calculo de vencimientos
│   │   └── errores.js      Convierte errores del backend en campos
│   ├── App.jsx             Definicion de rutas
│   ├── main.jsx            Punto de entrada (BrowserRouter + proveedores)
│   └── index.css           Sistema de diseno completo
├── vite.config.js          Proxy del backend y puerto 5173
├── package.json
└── .env                    Configuracion opcional (NO se sube)
```

---

## 4. Conexion con el backend (lo mas importante)

### 4.1 ¿Esta relacionado el frontend con el backend?

**Si, por completo.** El frontend no tiene datos propios: cada pantalla consume
la API REST del backend. No existe un solo arreglo o lista "inventado" en el
frontend; todo viene de PostgreSQL a traves de la API. Ademas se comparten
los mismos nombres de campos, estados y prioridades.

Lo que los conecta concretamente son cuatro puntos:

1. **Una URL base unica** (`/api`) configurada en `src/services/api.js`.
2. **Un proxy** en `vite.config.js` que reenvia `/api` al backend en el
   puerto 3000.
3. **El token JWT**, que axios agrega automaticamente a cada peticion.
4. **El formato de error**, que el frontend traduce campo por campo.

### 4.2 URL base y proxy

El backend corre en `http://localhost:3000` y el frontend en
`http://localhost:5173`. Para no depender de CORS, `vite.config.js` configura un
**proxy**:

```js
// vite.config.js
server: {
  port: 5173,
  proxy: {
    '/api': { target: 'http://localhost:3000', changeOrigin: true },
  },
},
```

Asi el navegador pide `http://localhost:5173/api/tareas` y Vite lo reenvia por
detrás a `http://localhost:3000/api/tareas`. El frontend y el backend quedan en
el **mismo origen**, por lo que no hay que tocar el CORS.

La URL base se define en un solo lugar:

```js
// src/services/api.js
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});
```

Por defecto usa `/api` (proxy). Si algun dia el backend esta en otro servidor,
basta con crear un `.env` con `VITE_API_URL=https://mi-servidor.com/api`.

### 4.3 Autenticacion: como viaja el token

El backend exige `Authorization: Bearer <token>` en las rutas privadas. El
frontend hace esto automaticamente en `api.js`:

```js
api.interceptors.request.use((config) => {
  const token = getToken();            // se lee de localStorage
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

- El token se guarda en `localStorage` con la clave `taskedu_token`.
- Ningun componente se acuerda de agregar el encabezado: lo hace axios solo.
- **El backend sigue sin confiar en el cliente** (la identidad sale del token),
  tal como explica la documentacion del backend.

### 4.4 Expiracion de sesion

Cuando el backend responde `401` (token vencido o invalido), axios limpia el
token y avisa al contexto:

```js
if (status === 401 && getToken()) {
  guardarToken(null);
  window.dispatchEvent(new Event('auth:unauthorized'));
}
```

`AuthContext` escucha ese evento, borra el usuario y el enrutador redirige a
`/login` automaticamente. Asi nadie queda viendo datos con un token vencido.

### 4.5 Manejo de errores

El backend responde los errores con esta forma (ver documentacion del backend):

```json
{ "error": "Datos invalidos",
  "detalles": [ { "campo": "correo", "mensaje": "..." } ] }
```

El frontend lo traduce en dos pasos:

```js
// api.js  ->  da una forma comun a cualquier error
{ mensaje: 'Correo o contrasena incorrectos', detalles: [...], status: 401 }

// utils/errores.js  ->  mapaErrores() convierte detalles en { correo: '...' }
```

De esa manera cada pagina puede pintar el mensaje general en una alerta y el
error de cada campo debajo de su input. Tambien se manejan los errores de red
(sin respuesta del servidor) con el mensaje "No se pudo conectar con el
servidor".

---

## 5. Mapa de integracion: endpoint <-> servicio <-> pagina

Esta es la prueba concreta de que **todo el frontend usa el backend**. Cada
metodo de un servicio llama exactamente un endpoint:

### 5.1 Autenticacion (`src/services/auth.service.js`)

| Metodo del frontend | Endpoint backend          | Pagina que lo usa |
| ------------------- | ------------------------- | ----------------- |
| `authService.registrar()` | `POST /api/auth/register` | Registro |
| `authService.login()`     | `POST /api/auth/login`    | Login |
| `authService.perfil()`    | `GET /api/auth/me`        | AuthContext (restaurar sesion) |

### 5.2 Cursos (`src/services/cursos.service.js`)

| Metodo del frontend | Endpoint backend          | Pagina que lo usa |
| ------------------- | ------------------------- | ----------------- |
| `cursosService.listar()`    | `GET /api/cursos`         | Cursos, Tareas |
| `cursosService.crear()`     | `POST /api/cursos`        | Cursos |
| `cursosService.obtener()`   | `GET /api/cursos/:id`     | CursoDetalle |
| `cursosService.actualizar()`| `PUT /api/cursos/:id`     | Cursos, CursoDetalle |
| `cursosService.eliminar()`  | `DELETE /api/cursos/:id`  | Cursos, CursoDetalle |
| `cursosService.tareas()`    | `GET /api/cursos/:id/tareas` | CursoDetalle |

### 5.3 Tareas (`src/services/tareas.service.js`)

| Metodo del frontend | Endpoint backend              | Pagina que lo usa |
| ------------------- | ----------------------------- | ----------------- |
| `tareasService.listar()`      | `GET /api/tareas` (+ filtros) | Tareas |
| `tareasService.crear()`       | `POST /api/tareas`            | Tareas, CursoDetalle |
| `tareasService.obtener()`     | `GET /api/tareas/:id`         | (disponible) |
| `tareasService.actualizar()`  | `PUT /api/tareas/:id`         | Tareas, CursoDetalle |
| `tareasService.cambiarEstado()` | `PATCH /api/tareas/:id/estado` | Tareas, CursoDetalle |
| `tareasService.eliminar()`    | `DELETE /api/tareas/:id`      | Tareas, CursoDetalle |

### 5.4 Panel (`src/services/dashboard.service.js`)

| Metodo del frontend | Endpoint backend              | Pagina que lo usa |
| ------------------- | ----------------------------- | ----------------- |
| `dashboardService.resumen()` | `GET /api/dashboard/resumen` | Dashboard |

> Nota: el endpoint `GET /api/health` es solo una herramienta de diagnostico del
> backend; el frontend no lo usa. Todas las demas rutas de la API estan
> conectadas.

### 5.5 Filtros del backend usados en la interfaz

La barra de `FiltrosTareas.jsx` permite aplicar exactamente los mismos filtros
que documenta el backend:

```
estado      ->  GET /api/tareas?estado=pendiente
prioridad   ->  GET /api/tareas?prioridad=alta
curso_id    ->  GET /api/tareas?curso_id=2
vencimiento ->  GET /api/tareas?vencimiento=proximas | vencidas
busqueda    ->  GET /api/tareas?busqueda=parcial
orden + dir ->  GET /api/tareas?orden=fecha_entrega&dir=asc
page + limit->  paginacion (9 por pagina en la interfaz)
```

El servicio limpia las opciones vacias antes de enviarlas y usa un **debounce**
de 400 ms en la busqueda para no saturar al backend.

---

## 6. Autenticacion y sesion en el cliente

### 6.1 AuthContext

`src/context/AuthContext.jsx` centraliza el estado de sesion y expone:

| Valor            | Significado                                     |
| ---------------- | ----------------------------------------------- |
| `usuario`        | Datos publicos del usuario (o `null`)           |
| `autenticado`    | `true` si hay un usuario valido                 |
| `cargando`       | Mientras se valida la sesion al abrir la pagina |
| `iniciarSesion()`| Llama al login y guarda el token                |
| `registrar()`    | Llama al registro y guarda el token             |
| `cerrarSesion()` | Borra token y usuario                           |

Al cargar la app, si existe un token en `localStorage`, se llama a
`GET /api/auth/me` para validar que siga vigente. Si falla, se cierra la sesion
silenciosamente. Asi el usuario no tiene que volver a entrar cada vez que
recarga la pagina.

### 6.2 Rutas protegidas y publicas

| Componente         | Funcion                                                         |
| ------------------ | --------------------------------------------------------------- |
| `RutaProtegida.jsx`| Solo deja pasar si hay sesion; si no, redirige a `/login`.      |
| `RutaPublica.jsx`  | Solo deja pasar a login/registro si NO hay sesion; si la hay, manda al panel. |

---

## 7. Rutas y paginas

| Ruta              | Pagina              | Acceso     | Contenido                          |
| ----------------- | ------------------- | ---------- | ---------------------------------- |
| `/login`          | Login               | Publica    | Iniciar sesion                     |
| `/registro`       | Registro            | Publica    | Crear cuenta                       |
| `/`               | Dashboard           | Privada    | Estadisticas y proximas entregas   |
| `/tareas`         | Tareas              | Privada    | Lista, filtros y CRUD de tareas    |
| `/cursos`         | Cursos              | Privada    | Lista y CRUD de cursos             |
| `/cursos/:id`     | CursoDetalle        | Privada    | Un curso y sus tareas              |
| `*`               | NoEncontrado (404)  | Publica    | Pagina inexistente                 |

---

## 8. Componentes

### 8.1 Componentes de dominio (de TASKEDU)

| Componente          | Responsabilidad                                                    |
| ------------------- | ------------------------------------------------------------------ |
| `TareaCard`         | Muestra una tarea: titulo, curso, fecha, badges y acciones. Marca las vencidas con un borde rojo. |
| `TareaFormulario`   | Formulario crear/editar tarea; valida en el cliente y envia al backend. |
| `CursoCard`         | Tarjeta de un curso con enlace a su detalle.                       |
| `CursoFormulario`   | Formulario crear/editar curso.                                     |
| `FiltrosTareas`     | Controles de busqueda, filtro y ordenamiento.                      |
| `EstadisticaCard`   | Un numero del panel con su etiqueta y color.                       |
| `Sidebar` / `Topbar`| Navegacion y datos del usuario.                                    |

### 8.2 Componentes genericos (`components/ui/`)

`Button`, `Input`, `Select`, `Textarea`, `Campo`, `Badge`, `Modal`,
`ConfirmDialog`, `Alerta`, `Spinner`, `Tarjeta`, `Progreso`, `EstadoVacio`.

Son reutilizables y no dependen del negocio. Reciben errores y etiquetas por
props, por eso todos los formularios se ven y se comportan igual.

### 8.3 Estados de interfaz

Cada pantalla que carga datos implementa los cuatro estados que pide el plan:
**carga** (spinner), **error** (alerta), **lista vacia** (`EstadoVacio`) y
**con datos**. Ademas hay confirmacion antes de borrar (`ConfirmDialog`) y
avisos de exito/error con `ToastContext`.

---

## 9. Formato de datos (coincide con el backend)

Los campos usan los **mismos nombres en snake_case** que devuelve la API, para
que no haga falta transformar nada:

**Tarea** (`tareas.service` y `TareaCard`):
`id, curso_id, curso_nombre, titulo, descripcion, fecha_entrega, prioridad,
estado, creado_en, actualizado_en, vencida`.

- `vencida` lo **calcula el backend** y el frontend solo lo muestra. No se
  recalcula en el cliente (coincide con la seccion 9.2 del plan: el vencimiento
  se calcula, no es un estado guardado).
- `curso_nombre` viene en la respuesta gracias al `JOIN` del backend.

**Prioridades y estados** son identicos a los de la base de datos y estan
centralizados en `utils/constantes.js`:

- `prioridad`: `baja | media | alta`
- `estado`: `pendiente | en_progreso | completada`

**Fechas:** los inputs usan `datetime-local`; antes de enviar, el frontend
convierte a ISO 8601 (`new Date(valor).toISOString()`) y al editar la vuelve a
formatear con `utils/fechas.js`.

---

## 10. Diseno y responsive

Todos los estilos estan en `src/index.css` usando variables CSS (paleta de
colores, radios, sombras). No se uso ningun framework de CSS.

- **Escritorio:** sidebar fijo a la izquierda y contenido en rejilla.
- **Movil (<= 820px):** el sidebar se vuelve una bandeja lateral que se abre con
  el boton de la barra superior; los formularios pasan a una sola columna.
- **Accesibilidad:** etiquetas visibles en todos los inputs, `aria-invalid`
  cuando hay error, contraste suficiente y navegacion con teclado (el modal se
  cierra con `Escape`).

---

## 11. Ejecucion

Necesita **dos terminales** (el backend debe estar corriendo):

```bash
# Terminal 1 — Backend (puerto 3000)
cd backend
npm start

# Terminal 2 — Frontend (puerto 5173)
cd frontend
npm run dev
```

Luego abrir **http://localhost:5173** y usar la cuenta de prueba:

```
Correo:     demo@taskedu.com
Contrasena: Demo1234
```

Otros comandos del frontend:

```bash
npm run build     # Compila a produccion en frontend/dist
npm run preview   # Sirve la version compilada
```

> Importante: si la pantalla muestra "No se pudo conectar con el servidor",
> significa que **el backend no esta corriendo** (puerto 3000). El frontend
> (5173) es solo la interfaz; los datos vienen del backend.

---

## 12. Decisiones de integracion (resumen)

1. **Proxy en Vite** en lugar de configurar CORS a mano -> mismo origen, cero
   fallos misteriosos.
2. **Toda la HTTP centralizada en `services/`** -> los componentes no repiten
   conexion.
3. **Token en un interceptor** -> ningun componente se acuerda del
   `Authorization`.
4. **Errores normalizados** -> el mensaje del backend se muestra tal cual, y los
   errores por campo aparecen debajo de cada input.
5. **`401` global** -> si vence el token, se cierra la sesion y se redirige.
6. **Mismos nombres de campo** (snake_case) que la API -> sin capas de
   transformacion innecesarias.
7. **`vencida` y `curso_nombre`** se muestran tal como los calcula el backend, sin
   duplicar logica.

---

## 13. Mapa rapido de archivos importantes

| Necesito...                                   | Archivo                                             |
| --------------------------------------------- | --------------------------------------------------- |
| Ver la URL base y el token                    | `frontend/src/services/api.js`                      |
| Ver como se pide el login                     | `frontend/src/services/auth.service.js`             |
| Ver todos los filtros de tareas                | `frontend/src/services/tareas.service.js`           |
| Entender la sesion y la proteccion de rutas   | `frontend/src/context/AuthContext.jsx`              |
| Ver las rutas de la aplicacion                | `frontend/src/App.jsx`                              |
| Ver el proxy del backend                      | `frontend/vite.config.js`                           |
| Ver los estados y prioridades                 | `frontend/src/utils/constantes.js`                  |
| Ver el calculo de vencimientos                 | `frontend/src/utils/fechas.js`                      |
| Ver el mapa de errores del backend            | `frontend/src/utils/errores.js`                     |
| Ver la pantalla de tareas (filtros + CRUD)    | `frontend/src/pages/Tareas.jsx`                     |
| Ver todos los estilos                         | `frontend/src/index.css`                            |
