# Plataforma de Eventos e Inscripciones

API REST para publicar eventos, gestionar permisos por rol y manejar inscripciones con control de cupos y confirmación por email.

## 1. Temática

Plataforma de Eventos e Inscripciones: organizadores publican eventos (con cupo, precio y fecha), y los usuarios se inscriben hasta agotar el cupo disponible. Incluye autenticación, autorización por rol, control de cupos y notificación por email.

## 2. Tecnologías

- Node.js (>= 20) + Express
- MongoDB + Mongoose
- Passport.js (`passport-local` para registro/login, `passport-jwt` para validar sesión) + JWT en cookie `httpOnly`
- bcrypt (hash de contraseñas)
- Nodemailer (email de confirmación de inscripción)
- dotenv
- Módulos ESM (`import`/`export`)

## 3. Instalación

```bash
npm install
cp .env.example .env   # completar con tus propios valores
```

## 4. Variables de entorno

| Variable         | Descripción                                                              | Ejemplo                                   |
|------------------|---------------------------------------------------------------------------|--------------------------------------------|
| `PORT`           | Puerto donde escucha el servidor HTTP.                                   | `8080`                                     |
| `MONGO_URL`      | Cadena de conexión a MongoDB.                                            | `mongodb://localhost:27017/proyecto-eventos` |
| `JWT_SECRET`     | Clave secreta para firmar y verificar los JWT de sesión.                 | un string largo y aleatorio                |
| `JWT_EXPIRES_IN` | Duración del JWT y de la cookie de sesión.                               | `1h`                                       |
| `NODE_ENV`       | Entorno de ejecución. Afecta el flag `secure` de la cookie y bloquea el seed. | `development`                          |
| `MAIL_HOST`      | Host del servidor SMTP para el email de confirmación.                    | `sandbox.smtp.mailtrap.io`                 |
| `MAIL_PORT`      | Puerto del servidor SMTP.                                                | `2525`                                     |
| `MAIL_USER`      | Usuario SMTP.                                                            | provisto por tu proveedor de SMTP          |
| `MAIL_PASS`      | Contraseña SMTP.                                                         | provisto por tu proveedor de SMTP          |
| `MAIL_FROM`      | Dirección remitente de los emails de confirmación.                      | `no-reply@proyecto-eventos.com`            |

`MONGO_URL` y `JWT_SECRET` son obligatorias: si falta alguna, el servidor no arranca (`process.exit(1)` con un mensaje claro). Las variables `MAIL_*` son opcionales — si faltan, el servidor arranca igual con un `console.warn`, y la inscripción a eventos sigue funcionando; simplemente no se podrá enviar el email de confirmación.

## 5. Comandos

```bash
npm run dev    # desarrollo, con recarga automática (node --watch)
npm start      # producción
npm run seed   # vacía la base y la puebla con usuarios y eventos de prueba (bloqueado si NODE_ENV=production)
```

## 6. Roles y matriz de permisos

Tres roles: `user` (default al registrarse), `organizer` y `admin`. El registro público nunca permite elegir rol desde el body — todo usuario nuevo nace `user`.

| Acción                                | user | organizer (propio) | organizer (ajeno) | admin |
|-----------------------------------------|:----:|:-------------------:|:------------------:|:-----:|
| Ver eventos (listado y detalle)         | ✅   | ✅                  | ✅                 | ✅    |
| Crear eventos                           | ❌   | ✅                  | —                  | ✅    |
| Modificar / cambiar estado de un evento | ❌   | ✅                  | ❌                 | ✅    |
| Inscribirse a un evento                 | ✅   | ✅                  | ✅                 | ✅    |
| Ver inscriptos de un evento             | ❌   | ✅                  | ❌                 | ✅    |
| Cancelar una inscripción propia         | ✅   | ✅                  | ✅                 | ✅    |
| Cancelar una inscripción ajena          | ❌   | ❌                  | ❌                 | ✅    |
| Ver todos los usuarios                  | ❌   | ❌                  | ❌                 | ✅    |

## 7. Usuarios de prueba

`npm run seed` crea estos usuarios (todos con password `Password123`):

| Email                     | Rol         |
|----------------------------|-------------|
| `admin@eventos.com`        | `admin`     |
| `organizer1@eventos.com`   | `organizer` |
| `organizer2@eventos.com`   | `organizer` |
| `user1@eventos.com`        | `user`      |
| `user2@eventos.com`        | `user`      |

`organizer1` queda con 15 eventos (12 publicados con categorías/locations variadas para probar paginación, 2 en borrador, y uno publicado con `capacity: 1` llamado "Workshop cupo único" para probar el rechazo por falta de cupo). `organizer2` queda con 2 eventos publicados, para probar que un organizer no puede tocar eventos ajenos.

El registro público (`POST /api/sessions/register`) siempre crea usuarios con rol `user`. No hay un endpoint para crear `organizer` o `admin` desde la API — se crean vía el seed, o manualmente en la base.

## 8. Endpoints

| Método | Ruta                          | Auth            | Rol                              | Descripción                                   |
|--------|-------------------------------|------------------|-----------------------------------|-------------------------------------------------|
| GET    | `/api/health`                 | No               | —                                 | Verifica que el servidor está activo.           |
| POST   | `/api/sessions/register`      | No               | —                                 | Registra un usuario nuevo (siempre `user`).     |
| POST   | `/api/sessions/login`         | No               | —                                 | Inicia sesión, setea la cookie `currentUser`.   |
| GET    | `/api/sessions/current`       | Sí               | cualquiera                        | Devuelve el usuario autenticado.                |
| POST   | `/api/sessions/logout`        | No               | —                                 | Limpia la cookie de sesión.                     |
| GET    | `/api/users`                  | Sí               | `admin`                           | Lista todos los usuarios.                       |
| GET    | `/api/events`                 | No               | —                                 | Lista eventos con filtros, paginación y orden.  |
| GET    | `/api/events/:id`             | No               | —                                 | Devuelve un evento por id.                      |
| POST   | `/api/events`                 | Sí               | `organizer`, `admin`               | Crea un evento (nace en `draft`).               |
| PUT    | `/api/events/:id`              | Sí               | dueño `organizer`, `admin`         | Modifica campos del evento (no el `status`).    |
| PATCH  | `/api/events/:id/status`       | Sí               | dueño `organizer`, `admin`         | Cambia el estado del evento.                    |
| POST   | `/api/events/:eid/tickets`     | Sí               | cualquier autenticado              | Se inscribe a un evento.                        |
| GET    | `/api/events/:eid/tickets`     | Sí               | dueño `organizer` del evento, `admin` | Lista los inscriptos a ese evento.          |
| GET    | `/api/tickets/my-tickets`      | Sí               | cualquier autenticado              | Lista las inscripciones propias.                |
| PATCH  | `/api/tickets/:tid/cancel`     | Sí               | dueño del ticket, `admin`          | Cancela una inscripción (libera el cupo).       |

## 9. Ejemplos de uso

### Registro

```bash
curl -X POST http://localhost:8080/api/sessions/register \
  -H "Content-Type: application/json" \
  -d '{ "first_name": "Ada", "last_name": "Lovelace", "email": "ada@example.com", "password": "supersecreta" }'
```
`201 Created`:
```json
{ "status": "success", "payload": { "id": "...", "first_name": "Ada", "last_name": "Lovelace", "email": "ada@example.com", "role": "user" } }
```

### Login

```bash
curl -c cookies.txt -X POST http://localhost:8080/api/sessions/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "ada@example.com", "password": "supersecreta" }'
```
`200 OK`, setea la cookie `currentUser` (JWT, `httpOnly`, expira junto con el token).

### Current

```bash
curl -b cookies.txt http://localhost:8080/api/sessions/current
```
`200 OK`:
```json
{ "status": "success", "payload": { "id": "...", "first_name": "Ada", "last_name": "Lovelace", "email": "ada@example.com", "role": "user" } }
```

### Crear un evento (organizer o admin)

```bash
curl -b cookies.txt -X POST http://localhost:8080/api/events \
  -H "Content-Type: application/json" \
  -d '{ "title": "Congreso Tech", "description": "Charlas de backend", "category": "Workshop", "location": "CABA", "date": "2026-12-10", "capacity": 50, "price": 0 }'
```
`201 Created`, con `organizer` tomado del JWT y `status: "draft"` sin importar lo que venga en el body.

### Listado paginado

```bash
curl "http://localhost:8080/api/events?status=published&category=workshop&page=2&limit=5&sort=-date"
```
`200 OK`:
```json
{ "status": "success", "data": [ /* 5 eventos */ ], "page": 2, "limit": 5, "total": 15, "totalPages": 3 }
```

### Inscribirse a un evento

```bash
curl -b cookies.txt -X POST http://localhost:8080/api/events/<eventId>/tickets \
  -H "Content-Type: application/json" \
  -d '{ "quantity": 2 }'
```
`201 Created`:
```json
{ "status": "success", "payload": { "id": "...", "status": "active", "quantity": 2, "reservationCode": "EVT-7K9H2M", "user": "...", "event": "...", "cancelledAt": null } }
```

### Inscripción duplicada

Si el mismo usuario ya tiene una inscripción activa en ese evento, la misma request devuelve:
```json
{ "status": "error", "message": "Ya tenés una inscripción activa a este evento" }
```
con `409 Conflict`.

### Cancelar una inscripción

```bash
curl -b cookies.txt -X PATCH http://localhost:8080/api/tickets/<ticketId>/cancel
```
`200 OK`, el ticket pasa a `status: "cancelled"` y el cupo queda libre para otra inscripción.

## 10. Flujo de autenticación

1. `POST /api/sessions/register` crea el usuario (siempre `user`, contraseña hasheada con bcrypt).
2. `POST /api/sessions/login` valida credenciales (estrategia `passport-local`) y devuelve un JWT (`{ id, email, role }`) en una cookie `currentUser` `httpOnly`, con la misma expiración que el token.
3. Cada request a una ruta protegida pasa por `authMiddleware`, que valida el JWT de la cookie (estrategia `passport-jwt`) y busca el usuario real en la base para `GET /api/sessions/current` (no confía ciegamente en el payload del token).
4. Si no hay cookie o el token es inválido/expiró → `401`. Si hay sesión válida pero el rol no alcanza (`authorize` a nivel de ruta, o una validación de propiedad del recurso en el service) → `403`.
5. `POST /api/sessions/logout` limpia la cookie. Importante: el JWT es stateless — no hay invalidación server-side, así que un token ya emitido sigue siendo técnicamente válido hasta su expiración si alguien lo capturó y lo reenvía manualmente después del logout (ver [Limitaciones conocidas](#14-limitaciones-conocidas)).

## 11. Flujo de inscripción

`POST /api/events/:eid/tickets`, validado en este orden exacto (corta en la primera que falla):

1. `quantity` es un número `> 0` → si no, `400`.
2. El evento existe (un `id` con formato inválido también cuenta como "no existe") → `404`.
3. El evento está `published` → si no (`draft`, `cancelled`, `finished`), `409`.
4. El evento todavía no ocurrió (`date` no puede estar en el pasado) → si ya pasó, `409`.
5. El usuario no tiene ya una inscripción activa (`active`) en ese evento → `409`.
6. Hay cupo suficiente: se suma la `quantity` de todas las inscripciones activas del evento, se le suma la `quantity` pedida, y se compara contra `capacity`. Si no entra, `409` con cuántos cupos quedan.

Si todo pasa: se crea el ticket en `status: "active"` con un `reservationCode` único (formato `EVT-XXXXXX`, generado en el server, nunca aceptado del body), y se intenta mandar el email de confirmación. Si el envío falla, se loguea el error pero la inscripción queda creada igual — el email nunca hace fallar la inscripción.

**Cancelación** (`PATCH /api/tickets/:tid/cancel`): requiere ser el dueño del ticket o `admin`, y que no esté ya `cancelled`. Cambia `status` a `cancelled` y completa `cancelledAt`; el documento nunca se borra. Como el cálculo de cupo solo cuenta tickets no-`cancelled`, cancelar libera el cupo automáticamente para la próxima inscripción.

## 12. Arquitectura en capas

```
routes → controllers → services → repositories → dao → modelos de Mongoose
                                        ↑
                                      dto (en la respuesta, controller → dto)
```

- **`dao/`** — único lugar del proyecto que importa modelos de Mongoose. Mapeo delgado: `find`, `findById`, `create`, `update`, `deleteMany`, sin lógica de negocio.
- **`repositories/`** — usan el DAO correspondiente, nunca un modelo directo. Exponen operaciones con nombres de dominio (`findByEmail`, `searchEvents`, `countActiveQuantityForEvent`, `cancelTicket`).
- **`services/`** — toda la lógica de negocio: validaciones, permisos sobre recursos propios, transición de estados, cálculo de cupos, disparo del email. Consumen solo repositories (nunca DAO ni modelos). El service de eventos consume el **repository** de tickets (no su service) para no generar una dependencia circular entre ambos services.
- **`controllers/`** — coordinan request/response: leen `body`/`params`/`query`, llaman al service, devuelven el status code y el DTO correspondiente. Sin lógica de negocio ni imports de Mongoose.
- **`dto/`** — `UserDTO`, `EventDTO`, `TicketDTO`. Cada uno mapea los campos públicos de su entidad (siempre `id`, nunca `_id` ni `password`). `TicketDTO` reutiliza `EventDTO`/`UserDTO` para el `event`/`user` poblados, en vez de dejar pasar el sub-documento crudo de Mongoose.
- **`middlewares/`** — `auth.middleware.js` (autenticación vía JWT), `authorize.middleware.js` (autorización por rol fijo) y `errorHandler.middleware.js` (traduce cualquier error a `{ status: "error", message }` con el código correspondiente).
- **`utils/`** — `hash.js` (bcrypt), `jwt.js` (firmar/verificar/decodificar tokens), `mailer.js` (Nodemailer), `errors.js` (`AppError` y helpers `badRequest`/`unauthorized`/`forbidden`/`notFound`/`conflict`), `catchAsync.js` (evita el try/catch repetido en cada controller), `reservationCode.js`.

## 13. Manejo de errores

Todo error de la API responde `{ "status": "error", "message": "..." }` con uno de estos códigos:

| Código | Significado                                                                    |
|--------|----------------------------------------------------------------------------------|
| `400`  | Datos inválidos: body mal formado, campos faltantes, formato o tipo incorrecto, `sort`/`capacity`/`price` fuera de rango. |
| `401`  | No autenticado: falta la cookie, el JWT es inválido/expiró, o el usuario del token ya no existe. |
| `403`  | Autenticado, pero sin permiso sobre este recurso puntual (rol insuficiente, o no sos el dueño). |
| `404`  | El recurso no existe (incluye un `id` con formato inválido).                     |
| `409`  | Conflicto de estado: evento cancelado, cupo agotado, inscripción duplicada, email ya registrado, código duplicado. |
| `500`  | Error interno no controlado. Se loguea en el server; nunca se expone el detalle interno al cliente. |

Centralizado en `src/middlewares/errorHandler.middleware.js`, que además traduce automáticamente: `SyntaxError` de `express.json` (body mal formado) → `400`, `ValidationError`/`CastError` de Mongoose → `400`, clave duplicada de Mongo (`code 11000`) → `409`.

## 14. Limitaciones conocidas

- **El control de cupo no es atómico.** Dos inscripciones concurrentes al último cupo disponible podrían, en una condición de carrera, superar la `capacity` del evento — la validación lee el conteo de tickets activos y luego escribe, sin una transacción que las una. Resolverlo de forma robusta requiere transacciones de MongoDB (necesitan un replica set) o un `findOneAndUpdate` atómico con un contador de cupo en el propio evento.
- **El JWT es stateless y el logout no lo invalida.** `logout` solo le dice al cliente que borre la cookie (`clearCookie`); no existe una blacklist de tokens revocados en el servidor. Un token copiado antes del logout sigue siendo válido hasta su expiración natural (`JWT_EXPIRES_IN`) si alguien lo reenvía manualmente — un cliente real (browser, Postman) no lo hace porque ya no tiene la cookie, pero un token capturado sí podría reutilizarse.
- **Los listados públicos muestran todos los estados si no se filtra por `status`.** `GET /api/events` sin `?status=` devuelve eventos en cualquier estado (incluidos `draft`, `cancelled`, `finished`), no solo los publicados.

## 15. Colección de Postman

`docs/postman_collection.json` (formato Postman v2.1). **Antes de ejecutarla, corré `npm run seed`** — la colección depende de los usuarios del seed (`organizer1@eventos.com`, `organizer2@eventos.com`, `user1@eventos.com`, `user2@eventos.com`, `admin@eventos.com`, todos con password `Password123`) y del evento "Workshop cupo único" para el caso de cupo agotado; sin el seed, los logins y esa búsqueda fallan.

Para importarla: Postman → **Import** → seleccionar el archivo. Define la variable de colección `baseUrl` (default `http://localhost:8080`); las requests de login dejan la cookie de sesión en el cookie jar de Postman automáticamente. Las carpetas siguen el orden del flujo: Sesiones → Eventos → Tickets → Cierre de sesión, y está pensada para correrse **en ese orden, de punta a punta, con Run Collection** (no para disparar requests sueltos fuera de orden) — cada bloque que necesita un rol distinto incluye su propio "Login - <rol>" inmediatamente antes de la request que lo requiere, así no depende de qué sesión haya quedado activa al final del bloque anterior (el `Logout` vive en su propia carpeta, al final de todo, para no pisar la sesión que necesitan los bloques siguientes).

**Si corrés la colección con el Collection Runner**, configurá un **Delay de 1000 ms** entre requests: el plan gratuito de Mailtrap limita la cantidad de emails que acepta por segundo, y la inscripción exitosa dispara un envío — sin ese delay, correr todo el flujo de golpe puede hacer que Mailtrap rechace o retrase algún envío (no afecta el resultado de los tests, que no dependen del email, pero sí lo que vas a ver en el inbox).

Variables de colección que se setean solas durante la corrida: `newEmail` (pre-request script en "Register", `nuevo+<timestamp>@eventos.com`, para no chocar con un registro previo), `futureDate` (pre-request script en cada request que crea un evento, `Date.now() + 30 días`, para que la fecha nunca quede en el pasado sin importar cuándo se corra la colección), `eventId` / `otherEventId` (en "Crear evento"/"Crear evento ajeno"), `soldOutEventId` (buscando "Workshop cupo único" por categoría — si no lo encuentra, el test falla pidiendo correr `npm run seed`) y `ticketId` (en "Inscribirse"). El bloque de Tickets cubre, en este orden: inscripción simple, inscripción duplicada (`409`), ocupar el único cupo de "Workshop cupo único" con User1 (`201`) y confirmar que User2 recibe `409` al intentar inscribirse después, listado de inscriptos del evento, y que tras cancelar el ticket de User1 en `{{eventId}}` (y verificar que cancelarlo de nuevo da `409`) una nueva inscripción al mismo evento vuelve a dar `201` con un `reservationCode` válido (el cupo quedó libre).

---

**Evolución del proyecto:** este repo se construyó en entregas incrementales — arquitectura base, registro de usuarios, JWT, Passport.js, autorización por roles, CRUD de eventos con estados y filtros, tickets con control de cupos y email, y finalmente este refactor en capas (DAO/Repository/Service/Controller/DTO) con manejo de errores centralizado, seed de datos y colección de Postman.
