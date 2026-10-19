# Documentacion del Frontend - TASKEDU

**Proyecto:** Sistema de Gestion de Tareas Academicas
**Componente:** Interfaces de cliente (app movil Expo + app web React/Vite) que
consumen la API REST del backend
**Fecha:** Octubre 2026 (revisado tras integrar los cambios hechos en `main`)
**Ubicacion del codigo:** `C:\Users\francisco\Desktop\TASKEDU\TASKEDU\frontend`

> Este documento explica **que** hay hoy en el frontend y **como** se conecta
> con el backend. Incluye el estado real de la carpeta `frontend/` despues de
> fusionar en `main` la app movil (Expo) y la app web (React + Vite), y las
> diferencias/pendientes detectadas en la revision.

---

## 1. Estado actual: dos frontends en una sola carpeta

Tras integrar los cambios directos en `main` (commit "frontend,expo" de
Dayana) con la rama local (app web de Francisco), **`frontend/` contiene las dos
aplicaciones mezcladas en el mismo directorio**:

| Frontend                      | Tecnologia                          | Entrada                | Estado hoy                                            |
| ----------------------------- | ----------------------------------- | ---------------------- | ----------------------------------------------------- |
| **App movil** (la activa)     | React Native + **Expo SDK 57**      | `frontend/index.js`    | **Activa:** es la que `package.json` apunta y describe el README raiz |
| **App web** (legada)          | React 19 + **Vite** + React Router  | `frontend/index.html`  | **Huérfana:** sus archivos siguen aqui, pero `package.json` ya no tiene sus dependencias ni scripts |

Consecuencias concretas de la fusion:

- `frontend/package.json` y `package-lock.json` son los de **Expo** (scripts
  `start`, `android`, `ios`, `web`; dependencias `expo`, `react-native`,
  `expo-secure-store`, ...). **Ya no existen los scripts `dev` y `build` de
  Vite** ni las dependencias `vite`, `axios` y `react-router-dom` que usa la
  app web, asi que `npm run dev` hoy no funciona.
- La app web conserva todos sus archivos (`index.html`, `vite.config.js`,
  `src/pages/`, `src/services/`, `src/components/*.jsx`, `src/index.css`) pero
  **no puede ejecutarse sin restaurar sus dependencias**.
- El README raiz dice que "la version web anterior se conserva en
  `frontend-web/`", pero **esa carpeta no existe**; la web sigue dentro de
  `frontend/`.
- Hay archivos **duplicados por nombre base** en `src/`, uno de cada app:

  | App movil (Expo)              | App web (Vite)                              |
  | ----------------------------- | ------------------------------------------- |
  | `src/api.js`                  | `src/services/api.js`                       |
  | `src/auth.js`                 | `src/context/AuthContext.jsx`               |
  | `src/ui.js`                   | `src/components/ui/*.jsx`                   |
  | `src/components/TareaCard.js` | `src/components/TareaCard.jsx`              |
  | `src/components/TareaForm.js` | `src/components/TareaFormulario.jsx`        |
  | `src/screens/*.js`            | `src/pages/*.jsx`                           |

  No hay colision de rutas de import (`.js` vs `.jsx`, `screens/` vs `pages/`),
  pero si ambas app comparten carpeta, Metro/Vite pueden compilar archivos que
  no les pertenecen.

> Pendiente de decision: separar la web en `frontend-web/` (como dice el
> README) o eliminar la app movil. Este documento describe **ambas** tal como
> estan hoy.

---

## 2. Vision general (ambas apps)

Ninguno de los dos frontends vuelve a implementar reglas de negocio ni escribe
consultas: **todo lo que es datos vive en el backend**. El cliente solo pide,
muestra y actualiza informacion.

Flujo de una peticion en la **app movil (la activa)**:

```
Pantalla (React Native)
    |
    v
  src/api.js  (fetch: agrega el token, arma la URL, traduce errores)
    |
    v
  Backend (Express + PostgreSQL, puerto 3000)  ->  responde JSON
    |
    v
  La pantalla actualiza su estado y React Native redibuja
```

Flujo de una peticion en la **app web (legada)**:

```
Pagina (React + Vite, puerto 5173)
    |
    v
  Servicio  (auth.service, tareas.service, ...)
    |
    v
  services/api.js  (axios: token + errores normalizados)
    |
    v
  Proxy de Vite  (/api  ->  http://localhost:3000)
    |
    v
  Backend (Express + PostgreSQL)  ->  responde JSON
```

Regla comun aplicada en ambas: **los componentes/pantallas nunca arman
peticiones HTTP a mano**; siempre pasan por un unico modulo de red
(`src/api.js` en movil, `src/services/` en web). Asi, si cambia la URL o el
formato de la API, solo se toca un archivo.

---

## 3. App movil (Expo) - la activa

> **Diseno:** esta app fue re-estilizada para **usar el mismo modelo visual del
> frontend web** (panel de marca en login/registro, cabecera con marca y
> usuario, tarjetas, badges de estado/prioridad, alertas y modales con los
> mismos colores y textos). La web original **no se modifico**; solo se adapto
> su diseno a React Native.

### 3.1 Tecnologias

| Paquete                     | Para que se uso                                        |
| --------------------------- | ------------------------------------------------------ |
| `expo` (~57)                | Toolchain, arranque y configuracion del proyecto       |
| `react` 19 + `react-native` | Construir la interfaz (pantallas, vistas, estilos)     |
| `expo-secure-store`         | Guardar el token JWT de forma cifrada en el dispositivo|
| `expo-constants`            | Deducir la IP del PC donde corre el backend            |
| `expo-status-bar`           | Barra de estado del sistema                            |
| `react-native-safe-area-context` | Respetar areas seguras (notch, etc.)              |
| CSS via `StyleSheet.create` | Estilos (sin librerias de UI externas)                 |

Sin Expo Router: la navegacion es **propia, por estado** (ver 3.3). Sin libreria
de peticiones (`fetch` nativo), sin Redux, sin libreria de componentes.

### 3.2 Estructura de carpetas (archivos de la app movil)

```
frontend/
├── index.js                 Punto de entrada (registerRootComponent)
├── App.js                   Raiz: sesion + barra superior + pestañas inferiores
├── app.json                 Config de Expo (nombre, iconos, plugins)
├── assets/                  Iconos, splash y favicon
├── src/
│   ├── api.js               TODA la red: URL base, token, errores, endpoints
│   ├── auth.js              AuthContext: sesion, login, registro, logout
│   ├── ui.js                Design system: colores, estilos y componentes basicos
│   ├── screens/
│   │   ├── AuthScreen.js        Login y registro (una sola pantalla con modo)
│   │   ├── DashboardScreen.js   Panel: estadisticas, proximas entregas, progreso
│   │   ├── TareasScreen.js      Lista de tareas + filtros + buscar + CRUD
│   │   ├── CursosScreen.js      Lista de cursos + CRUD (modal)
│   │   └── CursoDetalleScreen.js Detalle de curso y sus tareas (modal)
│   └── components/
│       ├── TareaCard.js         Tarjeta de tarea con acciones rapidas
│       ├── TareaForm.js         Formulario modal crear/editar tarea
│       └── CursoForm.js         Formulario modal crear/editar curso
├── package.json             Solo dependencias/scripts de Expo
└── app.json
```

### 3.3 Punto de entrada y navegacion

`index.js` registra `App.js`. La raiz hace:

1. `SafeAreaProvider` + `AuthProvider` (sesion) + `StatusBar`.
2. Mientras `cargando` -> spinner (`Loading`).
3. Si **no hay sesion** -> `AuthScreen` (login/registro).
4. Si **hay sesion** -> barra superior con nombre de usuario y "Salir", tres
   **pestañas inferiores** (`Panel`, `Tareas`, `Cursos`) y el contenido.

No hay react-navigation ni Expo Router: `App.js` mantiene las tres pantallas
**siempre montadas** y alterna visibilidad con `display: none` /
`flex` segun la pestaña activa (`tab`). Cada pantalla recibe la prop
`focused` y **solo recarga sus datos cuando se vuelve activa**
(`useEffect(() => { if (focused) cargar(); }, [focused, cargar])`).

El detalle de curso (`CursoDetalleScreen`) y los formularios se abren como
`Modal` encima de la pestaña, no como rutas; por eso no hay barra de
navegacion ni boton "atras" del sistema (siempre hay un boton visible
"< Volver a cursos").

### 3.4 Conexion con el backend

#### 3.4.1 URL base

El backend corre en el **puerto 3000**. En movil no hay proxy ni mismo origen
(el telefono es otro dispositivo), asi que `src/api.js` resuelve la URL asi:

```js
// Prioridad 1: variable de entorno
process.env.EXPO_PUBLIC_API_URL          // ej. http://192.168.1.10:3000/api

// Prioridad 2: IP del PC que sirve Expo (Constants.expoConfig.hostUri)
const host = hostUri.split(':')[0];
return `http://${host}:3000/api`;
```

- Por defecto **deduce la IP del PC automaticamente**, asi que el movil y el
  PC deben estar en la **misma red WiFi**.
- Para forzar una URL: crear `frontend/.env` con
  `EXPO_PUBLIC_API_URL=http://IP_DEL_PC:3000/api`.
- Si la conexion falla, el error dice explicitamente:
  "Verifique que el backend este activo y que el movil este en la misma red
  WiFi" (y revisar el firewall de Windows para el puerto 3000).

#### 3.4.2 Token

- Se guarda con **`expo-secure-store`** (cifrado en el keystore del telefono),
  con la clave `taskedu_token` (misma clave que usaba la version web).
- `request()` lo lee en cada peticion y agrega
  `Authorization: Bearer <token>` automaticamente; **ninguna pantalla se
  acuerda del encabezado**.
- El backend sigue sin confiar en el cliente: la identidad sale del token.

#### 3.4.3 Expiracion de sesion (401)

`src/api.js` expone `setUnauthorizedHandler(fn)`. `src/auth.js` registra
`logout` como handler: cuando una respuesta llega con `401` y habia token, se
borra el token y el usuario, y la raiz vuelve a mostrar `AuthScreen`. Nadie
queda viendo datos con un token vencido.

#### 3.4.4 Manejo de errores

El backend responde con `{ error, detalles: [{campo, mensaje}] }`. El frontend
movil lo convierte en una clase `ApiError` con `status` y `detalles`, y
`mensajeError(e)` une los mensajes de `detalles` (o usa `error`). Cada
pantalla muestra el resultado en `<ErrorMsg>`. Los errores de red (sin
respuesta) tienen mensaje propio de conexion.

### 3.5 Mapa de integracion: endpoint <-> funcion <-> pantalla

Toda la red vive en **`src/api.js`** (un unico archivo). Cada metodo llama
exactamente un endpoint:

| Objeto y metodo                      | Endpoint backend              | Pantalla que lo usa                     |
| ------------------------------------ | ----------------------------- | --------------------------------------- |
| `authApi.login()`                    | `POST /api/auth/login`        | AuthScreen                               |
| `authApi.register()`                 | `POST /api/auth/register`     | AuthScreen                               |
| `authApi.me()`                       | `GET /api/auth/me`            | auth.js (restaurar sesion al abrir)      |
| `cursosApi.listar()`                 | `GET /api/cursos`             | TareasScreen, CursosScreen               |
| `cursosApi.obtener(id)`              | `GET /api/cursos/:id`         | CursoDetalleScreen                       |
| `cursosApi.tareas(id)`               | `GET /api/cursos/:id/tareas`  | CursoDetalleScreen                       |
| `cursosApi.crear()`                  | `POST /api/cursos`            | CursosScreen (modal)                     |
| `cursosApi.actualizar(id)`           | `PUT /api/cursos/:id`         | CursosScreen (modal)                     |
| `cursosApi.eliminar(id)`             | `DELETE /api/cursos/:id`      | CursosScreen (confirmacion)              |
| `tareasApi.listar(params)`           | `GET /api/tareas` (+ filtros) | TareasScreen                             |
| `tareasApi.crear()`                  | `POST /api/tareas`            | TareaForm (desde Tareas y CursoDetalle)  |
| `tareasApi.actualizar(id)`           | `PUT /api/tareas/:id`         | TareaForm (edicion)                      |
| `tareasApi.cambiarEstado(id, estado)`| `PATCH /api/tareas/:id/estado`| TareaCard (completar / en progreso)      |
| `tareasApi.eliminar(id)`             | `DELETE /api/tareas/:id`      | TareaCard (con confirmacion)             |
| `dashboardApi.resumen()`             | `GET /api/dashboard/resumen`  | DashboardScreen                          |

> No se usan: `GET /api/tareas/:id` (disponible pero sin pantalla que la
> llame) y `GET /api/health` (solo diagnostico del backend). Todas las demas
> rutas de la API estan conectadas.

#### Filtros usados en `TareasScreen`

La pantalla envia exactamente los mismos filtros que documenta el backend:

```
estado      ->  ?estado=pendiente
prioridad   ->  ?prioridad=alta
curso_id    ->  ?curso_id=2
vencimiento ->  ?vencimiento=proximas | vencidas
busqueda    ->  ?busqueda=parcial        (debounce de 400 ms)
orden/dir   ->  ?orden=fecha_entrega&dir=asc
page/limit  ->  ?page=1&limit=9          (paginacion Anterior/Siguiente)
```

- El filtro vacio (`''`) se **limpia antes de enviar** (`request()` descarta
  `undefined`, `null` y `''`), asi "Todos" no manda nada.
- La busqueda espera **400 ms** despues de dejar de escribir (igual que el web).
- Paginacion por paginas de 9 con botones Anterior/Siguiente y el texto
  "Pagina X de Y" (misma mecanica que la app web).
- Hay `RefreshControl` (pull-to-refresh) en Panel, Tareas, Cursos y detalle.

### 3.6 Autenticacion y sesion (`src/auth.js`)

`AuthProvider` expone:

| Valor            | Significado                                          |
| ---------------- | ---------------------------------------------------- |
| `usuario`        | Datos publicos del usuario (o `null`)                |
| `cargando`       | Mientras se valida la sesion al abrir la app         |
| `login(datos)`   | Llama al login y guarda token                        |
| `register(datos)`| Llama al registro y guarda token                     |
| `logout()`       | Borra token (SecureStore) y usuario                  |

Al abrir la app, si existe token, se llama `GET /api/auth/me` para validar que
siga vigente; si falla, se borra el token silenciosamente. El usuario no tiene
que volver a entrar cada vez que abre la app.

`AuthScreen` maneja login y registro en la misma pantalla (flag `registro`),
con validacion local de confirmacion de contrasena y estado `enviando` para
deshabilitar el boton.

### 3.7 Pantallas

| Pantalla              | Contenido                                                        |
| --------------------- | ---------------------------------------------------------------- |
| `AuthScreen`          | Login y registro                                                 |
| `DashboardScreen`     | 6 tarjetas de estadisticas, proximas entregas y progreso por curso |
| `TareasScreen`        | Buscador, filtros desplegables, lista paginada y CRUD de tareas  |
| `CursosScreen`        | Lista de cursos con total de tareas, crear/editar/eliminar       |
| `CursoDetalleScreen`  | Informacion del curso y sus tareas (abre desde Cursos)           |

Estados de interfaz implementados en cada pantalla: **carga** (`Loading`),
**error** (`ErrorMsg`), **lista vacia** (`Empty`, con texto distinto si hay
filtros aplicados) y **con datos**. Las eliminaciones piden confirmacion
(`Alert.alert` con botones Cancelar/Eliminar).

### 3.8 Componentes y `src/ui.js`

`ui.js` es el design system de la app movil y **es un port del diseno del
frontend web** (mismos colores indigo, radios, badges, tarjetas, alertas y
modales de `index.css`), adaptado a React Native:

- **Colores:** `bg, surface, text, muted, border, primary, danger, ok, warn`.
- **Etiquetas compartidas con el backend:** `ESTADOS`
  (`pendiente | en_progreso | completada`) y `PRIORIDADES`
  (`baja | media | alta`), con su color por prioridad.
- **Componentes basicos:** `Button` (kinds `primario`/`secundario`/`peligro`/
  `fantasma`, tamano `small`, `bloque`, `cargando`), `Field` (label + requerido
  + ayuda + error), `SelectCampo`/`SelectValor` (equivalente al `<select>` del
  web, en modal), `Chip`, `Badge` (con punto opcional), `Alerta`/`ErrorMsg`
  (error o info), `Vacio` (icono + titulo + mensaje + accion), `Progreso`,
  `Marca` y `Avatar`.
- **Estilos:** un unico `StyleSheet.create` (`s`) con `tarjeta`, `paginaTitulo`,
  `paginaSubtitulo`, `header`, `tabbar`, `modal*`, etc. Todas las pantallas
  comparten estos estilos, por eso se ven consistentes con la version web.
- **Fechas:** `formatearFecha(iso)` ("19 oct 2026", igual que el web),
  `formatearFechaHora()`, `etiquetaVencimiento()` ("Vence hoy", "Vencio hace
  N d"), y `isoATexto()` / `textoAIso()` para el formulario (entrada
  `AAAA-MM-DD HH:MM`, validacion y conversion a ISO 8601 antes de enviar).

Componentes de dominio:

| Componente   | Responsabilidad                                                       |
| ------------ | --------------------------------------------------------------------- |
| `TareaCard`  | Titulo + badge de prioridad, meta (curso/fecha), descripcion, badges de
estado/vencida/aviso y acciones: selector de estado + Editar + Eliminar
(con confirmacion); borde izquierdo rojo si esta vencida            |
| `TareaForm`  | Modal crear/editar tarea; Titulo, Descripcion, Curso, Fecha, Prioridad
y Estado, con las mismas validaciones y textos que el web            |
| `CursoForm`  | Modal crear/editar curso (Nombre, Docente, Descripcion)                |


### 3.9 Formato de datos (coincide con el backend)

Los campos usan los **mismos nombres en snake_case** que devuelve la API, sin
capas de transformacion:

- **Tarea:** `id, curso_id, curso_nombre, titulo, descripcion, fecha_entrega,
  prioridad, estado, creado_en, actualizado_en, vencida`.
  - `vencida` lo **calcula el backend**; la app solo lo muestra (borde rojo,
    texto "Vencida").
  - `curso_nombre` viene del `JOIN` del backend.
- **Respuestas usadas:** login/registro `{ usuario, token }`,
  `GET /auth/me` `{ usuario }`, cursos `{ cursos }` (incluye `total_tareas`),
  detalle `{ curso }`, tareas del curso `{ tareas }`, listar tareas
  `{ tareas, total, ... }`, resumen `{ resumen, proximasEntregas, porCurso }`.
- **Fechas:** se envian en ISO 8601; el input del formulario usa el formato
  local `AAAA-MM-DD HH:MM` y `textoAIso()` lo convierte (devuelve `null` si es
  invalido y se muestra "La fecha debe tener el formato AAAA-MM-DD HH:MM").

---

## 4. App web (React + Vite) - legada, conservada en la misma carpeta

### 4.1 Que es

La primera version del frontend: **SPA en React 19 + Vite**, con
`react-router-dom` (rutas protegidas), `axios` (token en interceptor) y CSS a
mano (`src/index.css`, responsive con sidebar). Es la version que describe la
seccion anterior de este documento en su primera edicion; sigue completa en
`frontend/` pero **ya no es la que arranca**.

### 4.2 Estructura (archivos de la app web)

```
frontend/
├── index.html               Carga /src/main.jsx
├── vite.config.js           Puerto 5173 + proxy /api -> :3000
├── public/favicon.svg
└── src/
    ├── main.jsx             BrowserRouter + AuthProvider + ToastProvider
    ├── App.jsx              Definicion de rutas
    ├── index.css            Sistema de diseno completo
    ├── services/            api.js (axios) + auth/cursos/tareas/dashboard
    ├── context/             AuthContext.jsx, ToastContext.jsx
    ├── hooks/useAuth.js
    ├── layouts/             AuthLayout.jsx, AppLayout.jsx
    ├── components/          RutaProtegida, RutaPublica, Sidebar, Topbar,
    │                        TareaCard.jsx, TareaFormulario.jsx,
    │                        CursoCard.jsx, CursoFormulario.jsx,
    │                        FiltrosTareas.jsx, EstadisticaCard.jsx, ui/*.jsx
    ├── pages/               Login, Registro, Dashboard, Tareas, Cursos,
    │                        CursoDetalle, NoEncontrado
    └── utils/               constantes.js, fechas.js, errores.js
```

### 4.3 Como se conectaba al backend

- **Proxy en Vite** para vivir en el mismo origen (sin tocar CORS):
  `vite.config.js` reenvia `/api` a `http://localhost:3000`.
- **`services/api.js`:** instancia de axios con
  `baseURL: import.meta.env.VITE_API_URL || '/api'`, interceptor que agrega
  `Authorization: Bearer <token>` (token en `localStorage`,
  clave `taskedu_token`) y normaliza cualquier error a
  `{ mensaje, detalles, status }`; un `401` limpia la sesion y despacha el
  evento `auth:unauthorized` que escucha `AuthContext`.
- **`utils/errores.js`:** `mapaErrores()` convierte `detalles` en
  `{ correo: '...' }` para pintar errores debajo de cada input.
- Mismos endpoints, mismos nombres de campo (snake_case), mismos estados y
  prioridades (`utils/constantes.js`), debounce de 400 ms en la busqueda y
  paginacion de 9 por pagina.
- Rutas: `/login`, `/registro` (publicas) y `/`, `/tareas`, `/cursos`,
  `/cursos/:id` (protegidas con `RutaProtegida`), `*` -> 404.

### 4.4 Estado actual: no ejecutable tal como esta

Para que la app web vuelva a correr hay que **restaurar su `package.json`**
(scripts `dev`/`build`/`preview` y dependencias `vite`,
`@vitejs/plugin-react`, `react-router-dom`, `axios`). Ademas, su
`package-lock.json` actual es el de Expo, asi que hay que regenerarlo.

Mientras existan las dos apps en la misma carpeta conviene **separarlas**
(carpeta `frontend-web/`, como ya indica el README raiz) para que Expo no
compile archivos `.jsx` ajenos y viceversa.

---

## 5. Diferencias entre las dos versiones

| Aspecto            | App movil (Expo, activa)                       | App web (Vite, legada)                    |
| ------------------ | ---------------------------------------------- | ----------------------------------------- |
| Rutas/navegacion   | Pestañas + modales (estado local)              | React Router con rutas protegidas        |
| Cliente HTTP       | `fetch` nativo (en `src/api.js`)               | `axios` con interceptores                 |
| Almacenar token    | `expo-secure-store` (cifrado en el dispositivo)| `localStorage`                            |
| URL del backend    | Deduce la IP del PC / `EXPO_PUBLIC_API_URL`    | Proxy de Vite `/api` (mismo origen)       |
| Errores por campo  | Mensajes unidos en una alerta (`ErrorMsg`)     | Mensaje general + error bajo cada input   |
| Toasts             | No (solo `ErrorMsg` inline)                    | Si (`ToastContext`)                       |
| Confirmar borrar   | `Alert.alert` nativo                           | `ConfirmDialog` personalizado             |
| Busqueda (debounce)| 400 ms                                         | 400 ms                                    |
| Paginacion         | 9 por pagina, Anterior/Siguiente               | 9 por pagina, Anterior/Siguiente          |
| Estilos            | `StyleSheet` en `src/ui.js`, port del diseno web | CSS variables en `src/index.css`        |
| Sesion extra       | Restaurar sesion con `GET /auth/me`            | Restaurar sesion + evento global `401`    |
| Sin uso de         | `GET /tareas/:id`, `GET /health`               | `GET /health`                             |

Ambas comparten: mismos endpoints, mismos campos snake_case, mismos estados y
prioridades, token en `Authorization: Bearer`, caja de mensajes para errores
del backend, logica de vencimiento calculada solo en el backend y **el mismo
lenguaje visual** (colores indigo, tarjetas, badges, alertas y modales). La
diferencia es que la app movil usa pestañas inferiores en lugar del sidebar,
porque es una interfaz tactil.

---

## 6. Conflictos y puntos pendientes detectados en la revision

1. **`frontend/` mezcla dos aplicaciones** con entradas distintas
   (`index.js` de Expo y `index.html` de Vite) y archivos duplicados
   (`TareaCard.js`/`.jsx`, `api.js` en dos rutas, `auth.js`/`AuthContext.jsx`).
2. **`package.json` y `package-lock.json` son solo de Expo:** se perdieron los
   scripts y dependencias de la app web (`npm run dev` ya no existe).
3. **El README raiz menciona `frontend-web/` pero esa carpeta no existe**; la
   web sigue dentro de `frontend/`.
4. **Archivos de configuracion de herramientas subidos al repo:**
   `frontend/.claude/settings.json` y `frontend/AGENTS.md` (instrucciones para
   Expo) aparecieron con la integracion; revisar si deben versionarse.
5. `frontend/README.md` sigue siendo el template por defecto de Vite, aunque
   la carpeta ahora arranca con Expo (el README raiz es el que documenta
   Expo).
6. La navegacion movil **no usa Expo Router** (recomendacion del `AGENTS.md`
   del proyecto) sino pestañas propias; es intencional para una app de tres
   pantallas, pero conviene dejarlo escrito (queda anotado aqui).

---

## 7. Ejecucion

### 7.1 Backend (obligatorio en ambos casos)

```bash
cd backend
npm install
npm run db:setup     # crea la base de datos y aplica el esquema
npm run db:seed      # datos de prueba (opcional)
npm start            # puerto 3000
```

### 7.2 App movil (Expo) - la activa

```bash
cd frontend
npm install          # dependencias de Expo
npx expo start       # levanta Metro y muestra un QR
```

Escaneare el QR con **Expo Go** (Android/iOS). Requisitos:

1. El movil y el PC en la **misma red WiFi**.
2. El backend activo en el puerto 3000.
3. El firewall de Windows debe permitir el puerto 3000 (red privada).
4. URL forzada (opcional): `frontend/.env` con
   `EXPO_PUBLIC_API_URL=http://IP_DEL_PC:3000/api`.

Cuenta de prueba (tras `npm run db:seed`):

```
Correo:     demo@taskedu.com
Contrasena: Demo1234
```

Otros comandos: `npx expo start --android`, `--ios`, `--web`;
`npx expo lint`; `npx expo-doctor`.

### 7.3 App web (legada) - requiere restaurar dependencias

Hoy no arranca porque `package.json` ya no incluye Vite. Pasos cuando se
decida reactivarla (o al moverla a `frontend-web/`): restaurar scripts y
dependencias (`vite`, `@vitejs/plugin-react`, `react-router-dom`, `axios`),
regenerar el lockfile y luego `npm run dev` (puerto 5173, abre
**http://localhost:5173**).

> Si la pantalla muestra "No se pudo conectar con el servidor" (web) o
> "Verifique que el backend este activo..." (movil), **el backend no esta
> corriendo** en el puerto 3000: los dos clientes son solo interfaz, los
> datos vienen del backend.

---

## 8. Decisiones de integracion (resumen)

1. **Un solo modulo de red por app** (`src/api.js` en movil, `services/` en
   web) -> los componentes no repiten conexion ni token.
2. **Token automatico** en cada peticion -> ningun componente se acuerda del
   `Authorization`.
3. **401 global** -> si vence el token se cierra la sesion y se vuelve a la
   pantalla de acceso.
4. **Mismos nombres de campo (snake_case)** que la API -> sin capas de
   transformacion innecesarias.
5. **`vencida` y `curso_nombre`** se muestran tal como los calcula el backend,
   sin duplicar logica en el cliente.
6. **Movil sin proxy, web con proxy de Vite** -> cada plataforma resuelve el
   mismo problema (cross-origin) con la mecanica que le corresponde.
7. **Los datos solo se recargan cuando la pantalla esta activa** (prop
   `focused`) -> no se llaman endpoints de pestañas ocultas.
8. **Mismo modelo visual que la web** -> la app movil reutiliza el diseno
   (colores, tarjetas, badges, textos y validaciones) para que se sienta como
   el mismo producto; solo cambia la navegacion por pestañas tactiles.

---

## 9. Mapa rapido de archivos importantes

| Necesito...                                     | Archivo                                            |
| ----------------------------------------------- | -------------------------------------------------- |
| Ver la URL del backend y el token (movil)       | `frontend/src/api.js`                              |
| Ver todos los endpoints (movil)                 | `frontend/src/api.js`                              |
| Ver la sesion de la app movil                   | `frontend/src/auth.js`                             |
| Ver la raiz, pestañas y salida de sesion        | `frontend/App.js`                                  |
| Ver colores, estilos y componentes base movil   | `frontend/src/ui.js`                               |
| Ver la pantalla de tareas con filtros (movil)   | `frontend/src/screens/TareasScreen.js`             |
| Ver el formulario de tareas (movil)             | `frontend/src/components/TareaForm.js`             |
| Ver el formulario de cursos (movil)             | `frontend/src/components/CursoForm.js`             |
| Config de Expo (iconos, nombre, plugins)        | `frontend/app.json`                                |
| Ver la URL base y el token (web)                | `frontend/src/services/api.js`                     |
| Ver como se pide el login (web)                 | `frontend/src/services/auth.service.js`            |
| Ver la sesion y proteccion de rutas (web)       | `frontend/src/context/AuthContext.jsx`             |
| Ver las rutas de la app web                     | `frontend/src/App.jsx`                             |
| Ver el proxy del backend (web)                  | `frontend/vite.config.js`                          |
| Ver todos los estilos (web)                     | `frontend/src/index.css`                           |
| Ver endpoints y filtros del backend             | `README.md` y `documentacion_backend_taskedu.md`   |
