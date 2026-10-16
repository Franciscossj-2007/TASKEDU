# Plan de desarrollo: Sistema de Gestión de Tareas Académicas

**Versión:** 1.0\
**Enfoque principal:** Backend\
**Base de datos:** PostgreSQL, administrada mediante pgAdmin\
**Arquitectura:** Aplicación web con frontend React y backend REST
modular

------------------------------------------------------------------------

## 1. Descripción del proyecto

El Sistema de Gestión de Tareas Académicas será una aplicación web que
permitirá a los estudiantes registrar sus cursos, organizar tareas,
controlar fechas de entrega, establecer prioridades y consultar su
progreso desde una plataforma centralizada.

El desarrollo priorizará el backend: diseño de datos, lógica de negocio,
API REST, seguridad, validaciones y pruebas. El frontend se integrará
una vez que los endpoints principales estén probados.

### 1.1 Objetivo general

Desarrollar un sistema web que facilite la organización y el seguimiento
de actividades académicas mediante una API REST conectada a PostgreSQL,
con gestión de usuarios, cursos y tareas, control de fechas y
visualización del progreso.

### 1.2 Objetivos específicos

-   Diseñar una base de datos relacional consistente en PostgreSQL.
-   Implementar registro, inicio de sesión y protección de rutas.
-   Desarrollar operaciones CRUD para cursos y tareas.
-   Validar los datos recibidos y aplicar reglas de negocio.
-   Garantizar que cada estudiante acceda únicamente a sus propios
    datos.
-   Crear filtros, búsquedas y estadísticas de tareas.
-   Probar los endpoints antes de integrarlos con React.
-   Diseñar una interfaz clara, accesible y adaptable a distintos
    dispositivos.
-   Documentar la instalación, la API y el funcionamiento del sistema.

### 1.3 Alcance de la primera versión

La versión inicial incluirá:

-   Registro e inicio de sesión.
-   Gestión de cursos o asignaturas.
-   Creación, consulta, edición y eliminación de tareas.
-   Estados de tarea: pendiente, en progreso y completada.
-   Prioridades: baja, media y alta.
-   Fechas de entrega y detección de tareas vencidas.
-   Búsqueda, filtros y ordenamiento.
-   Panel de estadísticas.
-   Validaciones y manejo de errores.
-   Protección de datos por usuario.
-   Interfaz web adaptable a computadoras y celulares.

No se implementarán microservicios en esta etapa. Se utilizará un
**monolito modular**, más sencillo de construir, probar, mantener y
explicar en un proyecto académico.

------------------------------------------------------------------------

## 2. Herramientas y tecnologías

El entorno de desarrollo ya está preparado, por lo que el plan no
contempla dedicar una fase a instalarlo desde cero.

  -----------------------------------------------------------------------
  Herramienta o tecnología            Uso dentro del proyecto
  ----------------------------------- -----------------------------------
  Node.js                             Ejecutar JavaScript en el servidor

  Express.js                          Crear el servidor HTTP, las rutas y
                                      la API REST

  PostgreSQL                          Sistema gestor de base de datos
                                      relacional

  pgAdmin                             Administrar la base de datos,
                                      ejecutar SQL y revisar tablas

  `pg` (node-postgres)                Conectar Node.js con PostgreSQL y
                                      ejecutar consultas

  React                               Construir la interfaz de usuario

  Vite                                Herramienta de desarrollo y
                                      compilación del frontend

  Postman                             Probar solicitudes, endpoints,
                                      respuestas y errores

  Visual Studio Code                  Editar el código

  Git y GitHub                        Control de versiones y respaldo del
                                      trabajo

  npm                                 Administrar dependencias

  `.env`                              Guardar configuraciones y secretos
                                      fuera del código
  -----------------------------------------------------------------------

### 2.1 Dependencias previstas para el backend

  Paquete          Finalidad
  ---------------- ---------------------------------------------------
  `express`        Servidor y rutas HTTP
  `pg`             Pool de conexiones y consultas a PostgreSQL
  `dotenv`         Cargar variables de entorno
  `cors`           Autorizar solicitudes desde el frontend permitido
  `bcrypt`         Generar hashes seguros de contraseñas
  `jsonwebtoken`   Crear y verificar tokens JWT
  `zod`            Validar datos de entrada

Se recomienda comenzar con SQL parametrizado mediante `pg` en lugar de
añadir un ORM desde el primer día. Esto facilita comprender las
consultas, las relaciones y las restricciones de PostgreSQL.

------------------------------------------------------------------------

## 3. Requisitos funcionales

### RF-01. Gestión de usuarios

-   Registrar una cuenta con nombre, correo y contraseña.
-   Impedir el registro de correos duplicados.
-   Iniciar sesión con correo y contraseña.
-   Consultar los datos básicos del usuario autenticado.
-   Proteger los recursos privados.
-   Cerrar sesión en el cliente y eliminar el token almacenado.

### RF-02. Gestión de cursos

-   Crear cursos o asignaturas.
-   Listar los cursos del usuario autenticado.
-   Consultar un curso específico.
-   Editar nombre, docente y descripción.
-   Eliminar o desactivar un curso.
-   Consultar las tareas asociadas al curso.

### RF-03. Gestión de tareas

-   Crear tareas con título, descripción, curso y fecha de entrega.
-   Asignar una prioridad baja, media o alta.
-   Asignar un estado pendiente, en progreso o completada.
-   Listar y consultar tareas.
-   Editar y eliminar tareas.
-   Cambiar el estado de una tarea.
-   Buscar por título.
-   Filtrar por curso, estado, prioridad y vencimiento.
-   Ordenar por fecha de entrega o prioridad.

### RF-04. Panel de resumen

-   Mostrar el total de tareas del usuario.
-   Contar tareas pendientes, en progreso y completadas.
-   Identificar tareas vencidas.
-   Mostrar próximas entregas ordenadas por fecha.
-   Calcular estadísticas usando exclusivamente los datos del usuario
    autenticado.

### RF-05. Recordatorios opcionales

Para una versión posterior:

-   Mostrar avisos de entregas próximas.
-   Destacar tareas vencidas.
-   Añadir notificaciones internas.
-   Evaluar notificaciones por correo o push.

------------------------------------------------------------------------

## 4. Requisitos no funcionales

-   **Seguridad:** contraseñas cifradas mediante hash, autenticación y
    control de acceso.
-   **Integridad:** claves primarias, claves foráneas y restricciones en
    PostgreSQL.
-   **Mantenibilidad:** separar rutas, controladores, servicios y acceso
    a datos.
-   **Usabilidad:** interfaz clara, mensajes comprensibles y formularios
    sencillos.
-   **Accesibilidad:** etiquetas visibles, contraste adecuado y
    navegación por teclado.
-   **Compatibilidad:** funcionamiento en navegadores modernos y
    pantallas pequeñas.
-   **Confiabilidad:** manejo centralizado de errores y pruebas de
    endpoints.
-   **Configuración segura:** secretos y credenciales fuera del
    repositorio.
-   **Rendimiento razonable:** índices y consultas eficientes para las
    operaciones más frecuentes.

------------------------------------------------------------------------

## 5. Diseño de la base de datos PostgreSQL

La base de datos se llamará `gestion_tareas_academicas`.

### 5.1 Tabla `usuarios`

Almacena las cuentas de los estudiantes.

  ----------------------------------------------------------------------------------------
  Campo                   Tipo sugerido                            Descripción
  ----------------------- ---------------------------------------- -----------------------
  `id`                    `INTEGER GENERATED ALWAYS AS IDENTITY`   Clave primaria

  `nombre`                `VARCHAR(100)`                           Nombre del usuario

  `correo`                `VARCHAR(150) UNIQUE NOT NULL`           Correo único

  `password_hash`         `VARCHAR(255) NOT NULL`                  Hash de la contraseña

  `creado_en`             `TIMESTAMPTZ NOT NULL DEFAULT NOW()`     Fecha de creación
  ----------------------------------------------------------------------------------------

### 5.2 Tabla `cursos`

Cada curso pertenece a un usuario.

  --------------------------------------------------------------------------------------------
  Campo                   Tipo sugerido                                Descripción
  ----------------------- -------------------------------------------- -----------------------
  `id`                    `INTEGER GENERATED ALWAYS AS IDENTITY`       Clave primaria

  `usuario_id`            `INTEGER NOT NULL REFERENCES usuarios(id)`   Propietario del curso

  `nombre`                `VARCHAR(100) NOT NULL`                      Nombre de la asignatura

  `docente`               `VARCHAR(100)`                               Docente, opcional

  `descripcion`           `TEXT`                                       Descripción, opcional

  `creado_en`             `TIMESTAMPTZ NOT NULL DEFAULT NOW()`         Fecha de creación
  --------------------------------------------------------------------------------------------

### 5.3 Tabla `tareas`

Cada tarea pertenece a un curso.

  --------------------------------------------------------------------------------------------
  Campo                   Tipo sugerido                                Descripción
  ----------------------- -------------------------------------------- -----------------------
  `id`                    `INTEGER GENERATED ALWAYS AS IDENTITY`       Clave primaria

  `curso_id`              `INTEGER NOT NULL REFERENCES cursos(id)`     Curso asociado

  `titulo`                `VARCHAR(150) NOT NULL`                      Título de la tarea

  `descripcion`           `TEXT`                                       Descripción, opcional

  `fecha_entrega`         `TIMESTAMPTZ NOT NULL`                       Fecha y hora límite

  `prioridad`             `VARCHAR(10) NOT NULL`                       Baja, media o alta

  `estado`                `VARCHAR(20) NOT NULL DEFAULT 'pendiente'`   Estado de la tarea

  `creado_en`             `TIMESTAMPTZ NOT NULL DEFAULT NOW()`         Fecha de creación

  `actualizado_en`        `TIMESTAMPTZ NOT NULL DEFAULT NOW()`         Última modificación
  --------------------------------------------------------------------------------------------

### 5.4 Relaciones

-   Un usuario puede tener muchos cursos.
-   Un curso pertenece a un usuario.
-   Un curso puede tener muchas tareas.
-   Una tarea pertenece a un curso.
-   El backend debe verificar que el curso asociado a una tarea
    pertenezca al usuario autenticado. Una clave foránea por sí sola no
    garantiza esta autorización.

### 5.5 Restricciones e índices

Se deben implementar:

-   Claves primarias en todas las tablas.
-   Claves foráneas para mantener la integridad referencial.
-   `UNIQUE` para el correo.
-   `NOT NULL` en los campos obligatorios.
-   `CHECK` para limitar los estados a `pendiente`, `en_progreso` y
    `completada`.
-   `CHECK` para limitar las prioridades a `baja`, `media` y `alta`.
-   Índices para consultas frecuentes por usuario, curso, estado y fecha
    de entrega.
-   Transacciones cuando una operación requiera ejecutar varias
    consultas como una unidad.

### 5.6 Trabajo en pgAdmin

1.  Crear la base de datos `gestion_tareas_academicas`.
2.  Crear un archivo versionado `backend/sql/schema.sql`.
3.  Ejecutar el esquema desde el Query Tool de pgAdmin.
4.  Verificar tablas, claves foráneas, restricciones e índices.
5.  Insertar registros de prueba.
6.  Ejecutar consultas para comprobar filtros y estadísticas.
7.  Registrar cambios del esquema en Git.

El esquema SQL debe mantenerse en el proyecto para poder reconstruir la
base de datos en otro entorno.

------------------------------------------------------------------------

## 6. Arquitectura del backend

Se utilizará una arquitectura modular por capas.

### 6.1 Flujo de una petición

1.  React envía una solicitud HTTP.
2.  Express recibe la petición y ejecuta los middlewares.
3.  Se verifica la autenticación cuando la ruta es privada.
4.  Se validan los parámetros y el cuerpo de la solicitud.
5.  El controlador recibe la petición y llama al servicio.
6.  El servicio aplica las reglas de negocio.
7.  La capa de datos ejecuta SQL parametrizado mediante `pg`.
8.  PostgreSQL procesa la consulta.
9.  Express devuelve una respuesta JSON con el código HTTP
    correspondiente.
10. React actualiza la interfaz y muestra el resultado.

### 6.2 Responsabilidad de cada capa

-   **Rutas:** definen URL, métodos HTTP y middlewares.
-   **Controladores:** coordinan la petición y preparan la respuesta.
-   **Servicios:** implementan reglas de negocio y autorizaciones
    específicas del dominio.
-   **Repositorios:** centralizan las consultas SQL y el acceso a datos.
-   **Middlewares:** gestionan autenticación, permisos transversales y
    errores.
-   **Validadores:** comprueban formatos, campos y valores permitidos.
-   **Configuración:** administra el pool de conexiones y las variables
    de entorno.

### 6.3 Estructura de carpetas

``` text
sistema-tareas/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── cursos.routes.js
│   │   │   ├── tareas.routes.js
│   │   │   └── dashboard.routes.js
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── middlewares/
│   │   ├── validators/
│   │   ├── app.js
│   │   └── server.js
│   ├── sql/
│   │   └── schema.sql
│   ├── .env
│   ├── .env.example
│   └── package.json
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       └── layouts/
└── README.md
```

No es obligatorio crear todos los archivos desde el primer día. La
estructura se puede completar a medida que se implementen los módulos.

------------------------------------------------------------------------

## 7. Conexión entre Node.js y PostgreSQL

La conexión se realizará con `pg` y un pool de conexiones.

### 7.1 Variables de entorno

El archivo `.env` contendrá la configuración del servidor y la base de
datos, por ejemplo:

``` env
PORT=3000
DATABASE_URL=postgresql://USUARIO:CONTRASENA@HOST:PUERTO/gestion_tareas_academicas
JWT_SECRET=CAMBIAR_POR_UN_SECRETO_SEGURO
```

Los valores son ilustrativos y deben reemplazarse por los de la
instalación propia. Si la contraseña contiene caracteres especiales, la
URL debe codificarse correctamente o se pueden utilizar variables
separadas para host, puerto, usuario, contraseña y nombre de la base de
datos.

El archivo `.env` no debe subirse a GitHub. El archivo `.env.example`
contendrá nombres de variables y valores de ejemplo, nunca secretos
reales.

### 7.2 Prueba inicial de conexión

La primera prueba debe ejecutar una consulta como `SELECT NOW()` desde
Node.js y devolver el resultado sin errores. También se debe comprobar
que el servidor gestione correctamente un fallo de conexión.

------------------------------------------------------------------------

## 8. Endpoints de la API REST

La API tendrá como prefijo `/api`.

  Método     Endpoint                   Función
  ---------- -------------------------- ------------------------------
  `POST`     `/api/auth/register`       Registrar usuario
  `POST`     `/api/auth/login`          Iniciar sesión
  `GET`      `/api/auth/me`             Obtener usuario autenticado
  `GET`      `/api/cursos`              Listar cursos propios
  `POST`     `/api/cursos`              Crear curso
  `GET`      `/api/cursos/:id`          Consultar un curso propio
  `PUT`      `/api/cursos/:id`          Actualizar curso
  `DELETE`   `/api/cursos/:id`          Eliminar curso
  `GET`      `/api/tareas`              Listar y filtrar tareas
  `POST`     `/api/tareas`              Crear tarea
  `GET`      `/api/tareas/:id`          Consultar una tarea propia
  `PUT`      `/api/tareas/:id`          Actualizar tarea
  `PATCH`    `/api/tareas/:id/estado`   Cambiar estado
  `DELETE`   `/api/tareas/:id`          Eliminar tarea
  `GET`      `/api/dashboard/resumen`   Obtener estadísticas propias

### 8.1 Filtros previstos

Ejemplos:

``` http
GET /api/tareas?estado=pendiente
GET /api/tareas?prioridad=alta
GET /api/tareas?curso_id=2
GET /api/tareas?vencimiento=proximas
```

Los filtros se validarán antes de construir la consulta. El valor
`proximas` tendrá una definición explícita, por ejemplo, tareas que
vencen durante los siguientes siete días.

### 8.2 Respuestas HTTP

Se utilizarán códigos coherentes:

-   `200 OK`: consulta o modificación exitosa.
-   `201 Created`: registro creado.
-   `400 Bad Request`: datos o parámetros inválidos.
-   `401 Unauthorized`: falta autenticación válida.
-   `403 Forbidden`: usuario autenticado sin permiso, cuando
    corresponda.
-   `404 Not Found`: recurso inexistente o no accesible según la
    política de la API.
-   `409 Conflict`: conflicto con una restricción, como un correo
    duplicado.
-   `500 Internal Server Error`: error inesperado del servidor.

Los mensajes no deben exponer contraseñas, tokens, consultas SQL ni
trazas internas.

------------------------------------------------------------------------

## 9. Reglas de negocio y seguridad

  -----------------------------------------------------------------------
  Área                                Regla
  ----------------------------------- -----------------------------------
  Usuarios                            El correo debe ser único y la
                                      contraseña debe almacenarse como
                                      hash

  Autenticación                       Las rutas privadas requieren
                                      autenticación válida

  Cursos                              Solo el propietario puede
                                      administrar sus cursos

  Tareas                              Solo el propietario del curso
                                      asociado puede acceder a sus tareas

  Datos                               Los campos obligatorios no pueden
                                      estar vacíos

  Estados                             Solo se permiten los estados
                                      definidos

  Prioridades                         Solo se permiten baja, media y alta

  Fechas                              Se valida el formato y se establece
                                      una política de zona horaria

  SQL                                 Todas las consultas que incorporen
                                      datos del usuario deben ser
                                      parametrizadas

  Secretos                            Las credenciales se mantienen fuera
                                      del código y del repositorio

  Errores                             Se utiliza un middleware
                                      centralizado de errores

  Estadísticas                        Las consultas siempre se limitan al
                                      usuario autenticado
  -----------------------------------------------------------------------

### 9.1 Política de autenticación

Se utilizará bcrypt para almacenar hashes de contraseñas y JWT para
autenticar solicitudes. El backend no confiará en un `usuario_id`
enviado por el frontend para determinar la identidad; utilizará la
identidad validada del token.

Si el token se almacena en el navegador, se evaluarán los riesgos de
XSS. Si se opta por cookies `HttpOnly` y `Secure`, se implementará
también una estrategia adecuada de protección CSRF.

### 9.2 Tratamiento del vencimiento

Una tarea puede estar pendiente y vencida al mismo tiempo. El
vencimiento se calculará comparando `fecha_entrega` con la fecha y hora
actuales. No se necesita crear un estado permanente adicional para las
tareas vencidas.

------------------------------------------------------------------------

## 10. Pruebas con Postman

Antes de integrar React, se probarán los endpoints individualmente.

### 10.1 Pruebas de autenticación

-   Registro válido.
-   Registro con correo duplicado.
-   Registro con campos incompletos.
-   Login correcto.
-   Login con contraseña incorrecta.
-   Acceso a una ruta privada sin token.
-   Acceso con token inválido o vencido.

### 10.2 Pruebas de cursos

-   Crear un curso.
-   Consultar y listar cursos propios.
-   Actualizar un curso.
-   Eliminar un curso.
-   Consultar un identificador inexistente.
-   Intentar acceder al curso de otro usuario.

### 10.3 Pruebas de tareas

-   Crear una tarea válida.
-   Rechazar título vacío o fecha inválida.
-   Rechazar estados y prioridades desconocidos.
-   Editar y eliminar una tarea.
-   Cambiar su estado.
-   Filtrar por curso, estado y prioridad.
-   Verificar el orden por fecha de entrega.
-   Intentar consultar o modificar una tarea ajena.

### 10.4 Pruebas del panel

-   Comparar las estadísticas con los registros reales.
-   Verificar que las tareas de otros usuarios no se incluyan.
-   Comprobar el cálculo de tareas vencidas y próximas.

Se guardará una colección de Postman con ejemplos de solicitudes y
resultados esperados.

------------------------------------------------------------------------

## 11. Diseño de UI y UX

La interfaz se desarrollará después de validar los módulos principales
del backend. Durante el análisis se prepararán wireframes para evitar
rediseños posteriores.

### 11.1 Pantallas principales

1.  **Inicio de sesión:** correo, contraseña, validación y mensajes de
    error.
2.  **Registro:** nombre, correo, contraseña y confirmación del
    registro.
3.  **Panel principal:** resumen de tareas y próximas entregas.
4.  **Lista de tareas:** filtros, búsqueda, ordenamiento y acciones
    rápidas.
5.  **Formulario de tarea:** título, descripción, curso, fecha,
    prioridad y estado.
6.  **Gestión de cursos:** listado, creación, edición y eliminación.
7.  **Detalle de curso:** información del curso y tareas relacionadas.

### 11.2 Principios de UX

-   Formularios sencillos con etiquetas visibles.
-   Mensajes que indiquen cómo corregir un error.
-   Confirmación antes de eliminar registros.
-   Acción rápida para marcar una tarea como completada.
-   Estados de carga, error, lista vacía y ausencia de resultados.
-   Diseño adaptable a escritorio y móvil.
-   Contraste suficiente y navegación accesible.
-   Consistencia visual entre botones, formularios y tarjetas.

### 11.3 Integración con la API

El frontend tendrá un directorio `services/` para centralizar las
solicitudes HTTP. Los componentes visuales no deben repetir la lógica de
conexión.

El flujo de integración será:

1.  Configurar la URL base de la API.
2.  Implementar el servicio de autenticación.
3.  Conectar el formulario de login y registro.
4.  Conectar la gestión de cursos.
5.  Conectar la gestión de tareas.
6.  Conectar el panel de estadísticas.
7.  Gestionar errores, cargas y expiración de sesión.
8.  Verificar la experiencia en distintos tamaños de pantalla.

------------------------------------------------------------------------

## 12. Plan de trabajo por fases

Las duraciones son estimaciones para una persona con conocimientos
básicos y dedicación regular.

### Fase 1. Diseño de datos y requisitos --- 1 a 2 días

-   Definir requisitos funcionales y no funcionales.
-   Crear el diagrama entidad-relación.
-   Diseñar las tablas y relaciones.
-   Preparar `schema.sql`.
-   Ejecutar el esquema en pgAdmin.
-   Insertar datos de prueba.

**Entregable:** requisitos documentados y base de datos comprobada.

### Fase 2. Configuración del backend --- 1 día

-   Configurar Express.
-   Crear el pool de conexiones con `pg`.
-   Configurar variables de entorno.
-   Crear `app.js` y `server.js`.
-   Probar una consulta a PostgreSQL.
-   Implementar el manejo inicial de errores.

**Entregable:** API en ejecución y conectada a PostgreSQL.

### Fase 3. Autenticación --- 2 a 3 días

-   Implementar registro y login.
-   Aplicar hash de contraseñas.
-   Generar y verificar JWT.
-   Crear middleware de autenticación.
-   Probar accesos autorizados y no autorizados.

**Entregable:** módulo de autenticación funcional.

### Fase 4. CRUD de cursos --- 1 a 2 días

-   Crear endpoints y consultas.
-   Implementar validaciones.
-   Comprobar propiedad de los cursos.
-   Gestionar errores de registros inexistentes.

**Entregable:** módulo de cursos terminado.

### Fase 5. CRUD de tareas --- 3 a 4 días

-   Crear, listar, consultar, actualizar y eliminar tareas.
-   Implementar estados y prioridades.
-   Validar fechas y cursos.
-   Añadir filtros y ordenamiento.
-   Aplicar controles de acceso.

**Entregable:** módulo de tareas funcional.

### Fase 6. Pruebas de API --- 2 días

-   Probar todos los endpoints con Postman.
-   Verificar códigos HTTP y respuestas.
-   Probar validaciones y restricciones.
-   Revisar intentos de acceso a datos ajenos.
-   Documentar los casos de prueba.

**Entregable:** colección de pruebas y API validada.

### Fase 7. UI/UX e integración --- 3 a 5 días

-   Preparar los componentes y las pantallas React.
-   Implementar navegación y formularios.
-   Conectar el frontend con la API.
-   Mostrar errores, confirmaciones y estados de carga.
-   Adaptar la interfaz a dispositivos móviles.

**Entregable:** aplicación web integrada.

### Fase 8. Panel, documentación y entrega --- 2 a 3 días

-   Crear consultas de estadísticas.
-   Validar los cálculos del panel.
-   Revisar seguridad y manejo de errores.
-   Documentar instalación, variables de entorno y endpoints.
-   Preparar el manual de usuario y la demostración.

**Entregable:** versión inicial lista para presentar.

**Duración total estimada: 15 a 22 días de trabajo.** El plazo puede
variar según la dedicación y los problemas encontrados.

------------------------------------------------------------------------

## 13. Lista de verificación del proyecto

### Base de datos

-   [ ] Base de datos creada en PostgreSQL.
-   [ ] Tablas y relaciones verificadas en pgAdmin.
-   [ ] Restricciones e índices implementados.
-   [ ] Datos de prueba insertados.
-   [ ] Esquema guardado en `schema.sql`.

### Backend

-   [ ] Express inicia correctamente.
-   [ ] Conexión con PostgreSQL comprobada.
-   [ ] Variables de entorno configuradas.
-   [ ] Registro y login funcionales.
-   [ ] Contraseñas almacenadas mediante hash.
-   [ ] JWT y rutas privadas implementados.
-   [ ] CRUD de cursos terminado.
-   [ ] CRUD de tareas terminado.
-   [ ] Filtros y ordenamiento funcionales.
-   [ ] Validaciones y manejo de errores implementados.
-   [ ] Control de acceso por usuario comprobado.

### Pruebas

-   [ ] Endpoints probados en Postman.
-   [ ] Códigos HTTP verificados.
-   [ ] Casos inválidos probados.
-   [ ] Acceso a datos ajenos rechazado.
-   [ ] Estadísticas comparadas con los datos reales.

### Frontend y UX

-   [ ] Inicio de sesión y registro conectados.
-   [ ] Panel principal funcional.
-   [ ] Gestión de cursos conectada.
-   [ ] Gestión de tareas conectada.
-   [ ] Mensajes de error y confirmación.
-   [ ] Estados de carga y listas vacías.
-   [ ] Diseño adaptable a móvil y escritorio.

### Entrega

-   [ ] README con instrucciones de ejecución.
-   [ ] Archivo `.env.example` sin secretos.
-   [ ] `.env` excluido de Git.
-   [ ] Documentación de endpoints.
-   [ ] Capturas de pantalla.
-   [ ] Demostración final preparada.

------------------------------------------------------------------------

## 14. Funcionalidades para una segunda versión

Una vez que la versión inicial esté estable, se podrán incorporar:

-   Calendario semanal y mensual.
-   Recordatorios automáticos.
-   Notificaciones por correo o push.
-   Archivos adjuntos.
-   Categorías personalizadas.
-   Historial de modificaciones.
-   Paginación para grandes cantidades de tareas.
-   Roles para estudiantes, docentes y administradores.
-   Exportación de reportes.
-   Aplicación móvil independiente.

Estas mejoras no son necesarias para completar la primera versión.

------------------------------------------------------------------------

## 15. Orden concreto para comenzar

El desarrollo debe seguir este orden para reducir errores y evitar
construir la interfaz sobre una API incompleta:

1.  Diseñar las tablas y relaciones en PostgreSQL.
2.  Crear y comprobar `schema.sql` desde pgAdmin.
3.  Conectar Express con PostgreSQL mediante `pg`.
4.  Implementar y probar registro e inicio de sesión.
5.  Implementar el CRUD de cursos.
6.  Implementar el CRUD de tareas.
7.  Añadir filtros, reglas de negocio y estadísticas.
8.  Probar los endpoints con Postman.
9.  Diseñar e implementar la interfaz con React.
10. Integrar frontend y backend.
11. Ejecutar pruebas completas.
12. Documentar y preparar la demostración.

### Primer entregable recomendado

La primera meta será tener **la base de datos PostgreSQL creada, el
esquema SQL versionado y una conexión funcional desde Node.js**. Para
considerar esta fase terminada, una ruta de prueba deberá ejecutar
`SELECT NOW()` y devolver una respuesta correcta.

A partir de ahí se construirá el módulo de autenticación y se continuará
con cursos, tareas, pruebas e interfaz.

------------------------------------------------------------------------

## 16. Resultado esperado

Al finalizar el proyecto se tendrá una aplicación web donde cada
estudiante podrá:

-   Crear una cuenta e iniciar sesión.
-   Registrar sus cursos.
-   Crear y organizar tareas académicas.
-   Definir fechas de entrega, prioridades y estados.
-   Filtrar y buscar actividades.
-   Identificar tareas vencidas y próximas.
-   Consultar estadísticas personales.
-   Acceder a sus datos de forma controlada y segura.

El resultado no se evaluará únicamente por la apariencia de la interfaz,
sino también por la integridad de la base de datos, la organización del
backend, la seguridad, el correcto funcionamiento de la API y las
pruebas documentadas.
