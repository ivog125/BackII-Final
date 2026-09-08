# Proyecto Eventos

Plataforma de Eventos e Inscripciones — backend base construido con Node.js y Express.

Este proyecto se desarrolla de forma incremental, en entregas sucesivas. La primera entrega cubrió la base arquitectónica (configuración del servidor, estructura de carpetas por capas y rutas mínimas de verificación). La segunda entrega sumó el registro seguro de usuarios: validación de datos, normalización de email, hash de contraseñas con bcrypt y persistencia en MongoDB. La tercera entrega agregó autenticación completa: login con JWT, cookie httpOnly, una ruta protegida (`/current`) y logout. La cuarta entrega centralizó esa autenticación en **Passport.js**: el registro, el login y la verificación de `/current` viven como estrategias de Passport en lugar de lógica manual repartida entre servicio y middleware. La quinta entrega agregó **autorización por roles**: el recurso de eventos ya tenía lógica real (antes devolvía una lista vacía hardcodeada), protegido por dos middlewares reutilizables que diferencian explícitamente "no estás autenticado" (`401`) de "estás autenticado pero no tenés permiso" (`403`), sumando una validación de propiedad para que un `organizer` solo pueda modificar sus propios eventos. Esta sexta entrega reescribe por completo el recurso `events` con el modelo de negocio real (`title`, `description`, `category`, `date`, `location`, `capacity`, `price`, `status`, `organizer`), agrega el ciclo de vida de estados (`draft` → `published` → `finished`, con `cancelled` como estado terminal), validaciones de negocio en la capa de `services`, y un listado con filtros, paginación y ordenamiento. **Todavía no incluye** lógica de tickets ni inscripciones; eso se desarrollará en entregas posteriores.

## Temática elegida

Plataforma de Eventos e Inscripciones.

## Tecnologías usadas

- Node.js
- Express
- Mongoose (MongoDB)
- bcrypt
- jsonwebtoken
- passport
- passport-local
- passport-jwt
- cookie-parser
- dotenv
- Módulos ESM (`import`/`export`)

## Instalación

```bash
npm install
```

## Variables de entorno

Copiar `.env.example` a `.env` y completar los valores:

| Variable          | Descripción                                                        |
|--------------------|---------------------------------------------------------------------|
| `PORT`             | Puerto en el que escucha el servidor (fallback a `8080` si no se define). |
| `NODE_ENV`         | Entorno de ejecución (`development`, `production`, etc.). Determina si la cookie de sesión se marca como `secure`. |
| `MONGO_URL`        | Cadena de conexión a MongoDB. Necesaria para registro, login y persistencia de eventos/usuarios. |
| `JWT_SECRET`       | Clave para firmar y verificar los JWT de sesión. También la usa la estrategia `current` de Passport para validar el token. |
| `JWT_EXPIRES_IN`   | Tiempo de expiración del JWT (por ejemplo `1h`), alineado con el `maxAge` de la cookie de sesión. |

No se agregaron variables de entorno nuevas en esta entrega: la autorización por roles no necesita configuración adicional, solo lee `role` del JWT que ya viaja en la cookie.

## Cómo ejecutar el proyecto

Modo desarrollo (con recarga automática usando `node --watch`):

```bash
npm run dev
```

Modo producción:

```bash
npm start
```

## Estructura de carpetas

```
├── src/
│   ├── app.js # Configuración de Express (middlewares, passport.initialize(), routers, error handler)
│ ├── server.js # Punto de entrada: carga env, conecta DB y levanta el servidor
│ ├── config/ # Configuración centralizada: env, conexión a MongoDB y passport.config.js (estrategias)
│ ├── routes/ # Definición de rutas por recurso (events, sessions, users)
│ ├── controllers/ # Controladores asociados a cada ruta
│ ├── services/ # Lógica de negocio (eventos: creación, listado, validación de propiedad)
│ ├── repositories/ # Acceso a datos desacoplado
│ ├── dao/ # Data Access Objects (interacción directa con Mongoose)
│ ├── models/ # Modelos de Mongoose (User, Event)
│ ├── middlewares/ # auth.middleware.js (autenticación) y authorize.middleware.js (autorización por rol)
│ └── utils/ # hash.js (bcrypt) y jwt.js (firmar/verificar tokens)
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

Nota sobre `auth.middleware.js`: en la entrega anterior se había eliminado (su función la cumplía una estrategia de Passport llamada directamente desde el router de sesiones). En esta entrega se recreó como un archivo propio en `middlewares/` para que también lo pueda usar `events.router.js` y `users.router.js` — por dentro sigue llamando a la misma estrategia `current` de Passport, no se duplicó lógica de verificación de JWT.

## Autenticación con Passport.js

`src/config/passport.config.js` define tres estrategias, inicializadas en `app.js` antes de montar las rutas:

- **`register`** (`passport-local`, con `usernameField: 'email'` y `passReqToCallback: true`): valida los campos obligatorios, formato de email, longitud mínima de contraseña y que el email no esté ya registrado; si todo es correcto, hashea la contraseña con bcrypt y crea el usuario. El rol siempre queda en `user` por default del modelo — el body de registro no puede forzar `organizer` ni `admin`.
- **`login`** (`passport-local`, misma configuración de campo): busca el usuario por email y compara la contraseña con bcrypt. Devuelve el mismo mensaje genérico de error tanto si el email no existe como si la contraseña es incorrecta, para no revelar cuál de los dos falló.
- **`current`** (`passport-jwt`): extrae el JWT desde la cookie `currentUser` (no desde el header `Authorization`, que es lo que usa por defecto) mediante un extractor custom, y lo valida contra `JWT_SECRET`.

Las tres estrategias se usan con `{ session: false }`, porque la autenticación es completamente stateless vía JWT — no hay `express-session` ni sesión de servidor.

**Extensibilidad:** agregar un proveedor externo (por ejemplo, login con Google o GitHub) implicaría sumar una nueva estrategia en `passport.config.js` y una ruta que la use, sin tocar `app.js` ni el resto de las rutas existentes.

## Roles y autorización

### Roles disponibles

El modelo `User` tiene un campo `role` con tres valores posibles: `user` (default), `organizer` y `admin`. El registro público (`POST /api/sessions/register`) nunca permite elegir `organizer` ni `admin` desde el body — el rol de un usuario nuevo siempre es `user`, y cambiarlo requeriría una acción administrativa que esta entrega no implementa.

### Matriz de permisos

| Acción                              | user | organizer | admin |
|--------------------------------------|:----:|:---------:|:-----:|
| Consultar eventos                    | ✅   | ✅        | ✅    |
| Crear eventos                        | ❌   | ✅        | ✅    |
| Modificar/cancelar eventos propios   | ❌   | ✅        | ✅    |
| Modificar cualquier evento           | ❌   | ❌        | ✅    |
| Ver todos los usuarios               | ❌   | ❌        | ✅    |

### Los dos middlewares

- **`middlewares/auth.middleware.js`** — autenticación. Verifica el JWT de la cookie `currentUser` (vía la estrategia `current` de Passport). Si no hay sesión válida, corta con `401`. Si es válida, puebla `req.user` con el payload del token (`id`, `email`, `role`) y deja pasar.
- **`middlewares/authorize.middleware.js`** — autorización. Recibe como parámetro los roles permitidos (`authorize('organizer', 'admin')`) y compara contra `req.user.role`. Si no coincide, corta con `403`. Se usa siempre **después** de `auth.middleware.js` en la cadena de una ruta, nunca solo.

Ambos son funciones genéricas y reutilizables — ninguna ruta hardcodea un rol o una comparación propia; todas delegan en estos dos archivos.

### La diferencia entre 401 y 403

Son dos preguntas distintas y este proyecto nunca las mezcla en el mismo código de estado:

- **`401` — "no sé quién sos"**: no hay cookie, el token es inválido o expiró. `auth.middleware.js` corta acá, antes de que la petición llegue a saber qué rol tiene nadie.
- **`403` — "sé quién sos, pero no podés hacer esto"**: hay una sesión válida (`req.user` está poblado), pero el rol no alcanza para la acción pedida — ya sea porque `authorize.middleware.js` rechazó el rol, o porque el `service` de eventos detectó que un `organizer` intenta tocar un evento que no le pertenece.

Ninguno de los dos casos devuelve `500` — un `500` significaría un error real del servidor, no una cuestión de permisos.

Desde esta entrega hay un tercer código que tampoco se mezcla con los otros dos: **`409` — "el recurso existe y sos vos, pero su estado actual no permite esta operación"**. Se usa para conflictos de estado (evento cancelado, intento de publicar un evento ya finalizado), nunca para errores de formato de datos (`400`) ni de permisos (`403`). Ver [Eventos: modelo y reglas de negocio](#eventos-modelo-y-reglas-de-negocio) para el detalle.

### Validación de propiedad de eventos

Además del chequeo de rol a nivel de ruta, `src/services/events.service.js` valida — para actualizar o cambiar el estado de un evento — que `event.organizer` coincida con `req.user.id`, salvo que el rol sea `admin` (que puede modificar cualquier evento). Esta validación vive en el service, no en el middleware, porque depende del recurso puntual que se está pidiendo (no alcanza con saber el rol, hay que ir a buscar el evento primero).

## Eventos: modelo y reglas de negocio

### Campos del modelo (`src/models/Event.js`)

| Campo         | Tipo                        | Obligatorio | Notas                                                                 |
|---------------|-----------------------------|:-----------:|------------------------------------------------------------------------|
| `title`       | String                      | sí          |                                                                          |
| `description` | String                      | sí          |                                                                          |
| `category`    | String                      | sí          | Se filtra por coincidencia exacta, sin distinguir mayúsculas/minúsculas. |
| `date`        | Date                        | sí          | No puede ser una fecha pasada al crear el evento.                      |
| `location`    | String                      | sí          | Mismo criterio de filtrado que `category`.                             |
| `capacity`    | Number                      | sí          | Debe ser mayor a `0`.                                                  |
| `price`       | Number                      | sí          | Debe ser mayor o igual a `0`.                                          |
| `status`      | String (enum)               | —           | `draft` (default), `published`, `cancelled`, `finished`.               |
| `organizer`   | ObjectId (ref `User`)       | sí          | Se asigna automáticamente desde `req.user`; nunca viene del body.       |

**Nota sobre "obligatorio":** la consigna nombra explícitamente `title`, `description`, `category` y `location` como obligatorios. Esta implementación trata también `date`, `capacity` y `price` como obligatorios al crear un evento, porque las reglas de negocio de esta misma entrega (fecha no pasada, capacidad > 0, precio ≥ 0) no tienen ningún sentido aplicadas sobre un valor ausente — no hay forma de "no permitir fecha pasada" si `date` es opcional y puede no venir. Es una decisión de diseño, no una lectura literal del enunciado.

### Reglas de negocio (en `src/services/events.service.js`, no en rutas ni controllers)

- **Al crear un evento:**
  - `title`, `description`, `category`, `location`, `date`, `capacity` y `price` son obligatorios (`400` si falta alguno).
  - `date` no puede ser una fecha pasada (`400`).
  - `capacity` debe ser mayor a `0` (`400`).
  - `price` no puede ser negativo (`400`).
  - `organizer` se asigna siempre desde `req.user.id` (el JWT de la cookie) — si el body trae `organizer`, se ignora sin error.
  - `status` se ignora si viene en el body — todo evento nace en `draft`, sin excepción.
- **Al modificar un evento (`PUT /api/events/:id`):**
  - `organizer` es inmutable: si viene en el body, se ignora silenciosamente (no es un error, simplemente no se aplica).
  - Si el body trae `status`, la request se rechaza con `400` y el mensaje `"usá PATCH /api/events/:id/status"`. Decisión de diseño: los cambios de estado viven en un único lugar (`PATCH /:id/status`) para no duplicar la lógica de transición en dos endpoints.
  - Si se actualiza `date`, se revalida que no sea pasada; si se actualiza `capacity` o `price`, se revalidan las mismas reglas que al crear.
- **Al cambiar el estado (`PATCH /api/events/:id/status`):**
  - El nuevo `status` debe ser uno de los valores del enum (`400` si no lo es).
  - No se puede publicar (`published`) un evento que ya está `finished` (`409`).
- **Un evento `cancelled` queda completamente congelado**, sin excepciones: ni `PUT /api/events/:id` ni `PATCH /api/events/:id/status` pueden volver a tocarlo — **ni siquiera un `admin` puede revertir una cancelación** en esta entrega. Cualquier intento devuelve `409`. Esta es la interpretación elegida para la cláusula "salvo justificación documentada" de la consigna: la justificación es esta misma nota, no hay una excepción implementada en el código.
- Un `id` de evento con formato inválido (no es un `ObjectId` de Mongoose) en `GET/PUT/PATCH` responde `404` — se valida con `mongoose.Types.ObjectId.isValid` antes de consultar la base, para no dejar que Mongoose tire una excepción de cast que terminaría en un `500`.

### Sin endpoint DELETE

No existe `DELETE /api/events/:id`. Cancelar un evento es un cambio de estado como cualquier otro (`PATCH /api/events/:id/status` con `{ "status": "cancelled" }`), no un borrado físico — los eventos cancelados siguen existiendo y son consultables por `GET`, simplemente quedan congelados.

## Rutas disponibles

| Método | Ruta                     | Quién puede                    | Descripción                                                  |
|--------|--------------------------|---------------------------------|---------------------------------------------------------------|
| GET    | `/api/health`            | Cualquiera                      | Verifica que el servidor está activo.                         |
| GET    | `/api/events`            | Cualquiera                      | Lista eventos con filtros, paginación y orden (ver más abajo). |
| GET    | `/api/events/:id`        | Cualquiera                      | Devuelve un evento por id.                                     |
| POST   | `/api/events`            | `organizer`, `admin`            | Crea un evento (el `organizer` se toma del JWT, no del body).  |
| PUT    | `/api/events/:id`        | `organizer` (propio), `admin` (cualquiera) | Modifica campos del evento (no el `status`).   |
| PATCH  | `/api/events/:id/status` | `organizer` (propio), `admin` (cualquiera) | Cambia el estado del evento (incluida la cancelación). |
| GET    | `/api/sessions`          | Cualquiera                      | Estructura base del recurso sesiones (placeholder).            |
| POST   | `/api/sessions/register` | Cualquiera                      | Registra un nuevo usuario (siempre con rol `user`).            |
| POST   | `/api/sessions/login`    | Cualquiera                      | Inicia sesión y setea la cookie `currentUser` (JWT, httpOnly). |
| GET    | `/api/sessions/current`  | Autenticado                     | Devuelve el usuario autenticado según la cookie.               |
| POST   | `/api/sessions/logout`   | Cualquiera                      | Cierra la sesión, eliminando la cookie `currentUser`.          |
| GET    | `/api/users`             | `admin`                         | Lista todos los usuarios (sin el campo `password`).            |

### Registro de usuarios (`POST /api/sessions/register`)

Body esperado (JSON):

| Campo        | Tipo   | Requerido | Descripción                                  |
|--------------|--------|-----------|-----------------------------------------------|
| `first_name` | string | sí        | Nombre del usuario.                            |
| `last_name`  | string | sí        | Apellido del usuario.                          |
| `email`      | string | sí        | Email del usuario (se normaliza a minúsculas). |
| `password`   | string | sí        | Contraseña (mínimo 8 caracteres).              |

```bash
curl -X POST http://localhost:8080/api/sessions/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Ada",
    "last_name": "Lovelace",
    "email": "ada@example.com",
    "password": "supersecreta"
  }'
```

Respuesta exitosa (`201 Created`):

```json
{
  "status": "success",
  "payload": {
    "id": "65123abc...",
    "first_name": "Ada",
    "last_name": "Lovelace",
    "email": "ada@example.com",
    "role": "user"
  }
}
```

Errores posibles: `400` (campos faltantes, email inválido o contraseña corta) y `409` (email ya registrado).

### Login (`POST /api/sessions/login`) y ruta protegida (`GET /api/sessions/current`)

```bash
curl -c cookies.txt -X POST http://localhost:8080/api/sessions/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "ada@example.com", "password": "supersecreta" }'

curl -b cookies.txt http://localhost:8080/api/sessions/current
```

`/current` responde `200` con `{ id, email, role }` si la cookie es válida, o `401 "No autenticado"` sin cookie o con un token inválido/expirado.

### Crear un evento (`POST /api/events`) — requiere `organizer` o `admin`

```bash
curl -b cookies.txt -X POST http://localhost:8080/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Congreso Tech 2026",
    "description": "Charlas de backend",
    "category": "tecnología",
    "date": "2026-11-10",
    "location": "Buenos Aires",
    "capacity": 200,
    "price": 1500
  }'
```

Con un usuario de rol `organizer` o `admin` (`201 Created`); `organizer` sale del JWT y `status` siempre nace en `draft`, sin importar lo que venga en el body:

```json
{
  "status": "success",
  "payload": {
    "_id": "6690...",
    "title": "Congreso Tech 2026",
    "description": "Charlas de backend",
    "category": "tecnología",
    "date": "2026-11-10T00:00:00.000Z",
    "location": "Buenos Aires",
    "capacity": 200,
    "price": 1500,
    "status": "draft",
    "organizer": "665f2a..."
  }
}
```

Con un usuario de rol `user` (`403 Forbidden` — está autenticado, pero el rol no alcanza):

```json
{ "status": "error", "message": "No tenés permisos para realizar esta acción" }
```

Sin cookie (`401 Unauthorized`):

```json
{ "status": "error", "message": "No autenticado" }
```

Errores de validación de negocio (`400`, lanzados desde `events.service.js`): campos obligatorios faltantes, `date` en el pasado, `capacity <= 0` o `price < 0`.

### Modificar un evento (`PUT /api/events/:id`)

Un `organizer` solo puede tocar sus propios eventos; un `admin` puede tocar cualquiera. `organizer` es inmutable (se ignora si viene en el body) y `status` no se puede tocar acá:

```bash
curl -b cookies.txt -X PUT http://localhost:8080/api/events/6690... \
  -H "Content-Type: application/json" \
  -d '{ "capacity": 250, "price": 1800 }'
```

- Evento ajeno (`403`): `{ "status": "error", "message": "No podés modificar un evento que no te pertenece" }`
- Body con `status` (`400`): `{ "status": "error", "message": "usá PATCH /api/events/:id/status" }`
- Evento `cancelled` (`409`, sin excepción ni para `admin`): `{ "status": "error", "message": "El evento está cancelado y no puede modificarse" }`

### Cambiar el estado de un evento (`PATCH /api/events/:id/status`)

Único endpoint para transicionar `draft` → `published` → `finished`, o cancelar en cualquier momento (`cancelled`):

```bash
curl -b cookies.txt -X PATCH http://localhost:8080/api/events/6690.../status \
  -H "Content-Type: application/json" \
  -d '{ "status": "cancelled" }'
```

- `status` fuera del enum (`400`): `{ "status": "error", "message": "Estado inválido. Valores permitidos: draft, published, cancelled, finished" }`
- Publicar un evento `finished` (`409`): `{ "status": "error", "message": "No se puede publicar un evento ya finalizado" }`
- Evento ya `cancelled` (`409`, sin excepción ni para `admin`): `{ "status": "error", "message": "El evento está cancelado y no puede modificarse" }`

### Listar eventos (`GET /api/events`) — filtros, paginación y orden

**Esta es la única ruta de toda la API que no usa el sobre `{ status, payload }`.** Es una desviación intencional: la consigna de esta entrega pide explícitamente esta forma de respuesta para el listado paginado, así que se documenta acá para que no se lea como una inconsistencia accidental con el resto del proyecto.

Query params soportados (todos opcionales):

| Param      | Efecto                                                                                     |
|------------|-----------------------------------------------------------------------------------------------|
| `status`   | Filtra por estado exacto (`draft`, `published`, `cancelled`, `finished`).                     |
| `category` | Coincidencia **exacta**, sin distinguir mayúsculas/minúsculas (no es un `LIKE` parcial).       |
| `location` | Mismo criterio que `category`.                                                                 |
| `dateFrom` | Eventos con `date >=` este valor.                                                              |
| `dateTo`   | Eventos con `date <=` este valor.                                                              |
| `page`     | Página (default `1`).                                                                          |
| `limit`    | Tamaño de página (default `10`).                                                               |
| `sort`     | Campo de orden, ej. `date` (ascendente) o `-date` (descendente). Default: `createdAt` descendente. |

```bash
curl "http://localhost:8080/api/events?status=published&category=workshop&page=2&limit=5&sort=date"
```

```json
{
  "data": [ { "_id": "...", "title": "...", "status": "published" } ],
  "page": 2,
  "limit": 5,
  "total": 7,
  "totalPages": 2
}
```

### Ruta administrativa (`GET /api/users`) — requiere `admin`

```bash
curl -b cookies_admin.txt http://localhost:8080/api/users
```

Con un usuario `admin` (`200`, sin el campo `password` en ningún usuario):

```json
{
  "status": "success",
  "payload": [
    { "id": "665f2a...", "first_name": "Ada", "last_name": "Lovelace", "email": "ada@example.com", "role": "user" }
  ]
}
```

Con `organizer` (`403`) o sin cookie (`401`) — mismos mensajes que en el resto del proyecto.

### Logout (`POST /api/sessions/logout`)

```bash
curl -b cookies.txt -X POST http://localhost:8080/api/sessions/logout
```

Respuesta (`200`, elimina la cookie `currentUser`).