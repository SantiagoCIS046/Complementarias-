# 📋 REPORTE DEL PROYECTO — RepFora Backend

> **Proyecto:** Sistema de seguimiento de Etapas Productivas — SENA  
> **Stack:** Node.js + Express + Prisma + PostgreSQL  
> **Última actualización:** 2026-04-16

---

## 📦 INSTALACIONES

### Dependencias de Producción (`dependencies`)

| Paquete | Versión | Para qué sirve |
|---|---|---|
| `express` | ^4.18.2 | Framework HTTP principal del servidor |
| `cors` | ^2.8.5 | Permite peticiones cross-origin desde el frontend (localhost:5173) |
| `dotenv` | ^16.0.3 | Lee las variables de entorno del archivo `.env` |
| `jsonwebtoken` | ^9.0.0 | Genera y verifica tokens JWT para autenticación |
| `bcryptjs` | ^2.4.3 | Encripta y compara contraseñas de usuarios |
| `@prisma/client` | ^5.0.0 | Cliente ORM para consultar la base de datos PostgreSQL |
| `pdfkit` | ^0.13.0 | Generación de archivos PDF (certificados, reportes) |

### Dependencias de Desarrollo (`devDependencies`)

| Paquete | Versión | Para qué sirve |
|---|---|---|
| `nodemon` | ^3.0.0 | Reinicia el servidor automáticamente al modificar archivos |
| `prisma` | ^5.0.0 | CLI para crear migraciones y gestionar el schema de BD |

> **Comando usado:** `npm install` — 180 paquetes instalados, 0 vulnerabilidades.

---

## 🗂️ ESTRUCTURA DEL PROYECTO

```
repfora-backend/
├── .github/
│   └── CODEOWNERS                  # Propietarios de código por zona (GitHub)
├── src/
│   ├── core/                       # 🤝 ZONA COMPARTIDA (Los 3 devs la usan)
│   │   ├── config/
│   │   │   ├── db.js               # Conexión a la base de datos (Prisma)
│   │   │   └── env.js              # Variables de entorno centralizadas
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js  # Verificación de token JWT
│   │   │   └── roles.middleware.js # Verificación de roles de usuario
│   │   └── utils/
│   │       ├── enums.js            # Enumeraciones globales del sistema
│   │       ├── dateHelper.js       # Funciones utilitarias de fechas
│   │       └── pdfGenerator.js     # Generación de PDFs
│   │
│   ├── modules/                    # 🚧 ZONA DIVIDIDA POR DESARROLLADOR
│   │   ├── auth-dev1/              # 🟢 DEV 1
│   │   ├── users-dev1/             # 🟢 DEV 1
│   │   ├── system-config-dev1/     # 🟢 DEV 1
│   │   ├── productive-stages-dev2/ # 🔵 DEV 2
│   │   ├── companies-dev2/         # 🔵 DEV 2
│   │   ├── documents-dev2/         # 🔵 DEV 2
│   │   ├── bitacoras-dev3/         # 🟡 DEV 3
│   │   ├── trackings-dev3/         # 🟡 DEV 3
│   │   ├── hours-dev3/             # 🟡 DEV 3
│   │   └── novelties-dev3/         # 🟡 DEV 3
│   │
│   ├── app.js                      # Inicialización de Express y rutas
│   └── server.js                   # Arranque del servidor
├── .env                            # Variables de entorno (NO subir a Git)
├── .gitignore
├── package.json
└── REPORTE.md                      # Este archivo
```

> **Cada módulo contiene 3 archivos:** `[modulo].routes.js` → `[modulo].controller.js` → `[modulo].service.js`

---

## ⚙️ FUNCIONES DEL PROYECTO

---

### 📁 `src/core/config/db.js`
> Conexión a la base de datos mediante Prisma Client.

| Exporta | Tipo | Descripción |
|---|---|---|
| `prisma` | Instancia | Cliente de Prisma listo para usar en cualquier service |

---

### 📁 `src/core/config/env.js`
> Centraliza y exporta todas las variables de entorno.

| Exporta | Valor por defecto | Descripción |
|---|---|---|
| `PORT` | `3000` | Puerto en el que corre el servidor |
| `DATABASE_URL` | — | URL de conexión a PostgreSQL |
| `JWT_SECRET` | — | Clave secreta para firmar tokens JWT |
| `JWT_EXPIRES_IN` | `'8h'` | Tiempo de expiración del token |
| `NODE_ENV` | `'development'` | Entorno de ejecución |

---

### 📁 `src/core/middlewares/auth.middleware.js`
> Verifica que las peticiones lleguen con un token JWT válido.

| Función | Parámetros | Retorna | Descripción |
|---|---|---|---|
| `verifyToken` | `(req, res, next)` | `next()` o error `401/403` | Extrae el token del header `Authorization: Bearer <token>`, lo verifica con `JWT_SECRET` y adjunta el payload en `req.user` |

---

### 📁 `src/core/middlewares/roles.middleware.js`
> Controla el acceso a rutas según el rol del usuario autenticado.

| Función | Parámetros | Retorna | Descripción |
|---|---|---|---|
| `checkRole` | `(allowedRoles: string[])` | Middleware `(req, res, next)` | Función de orden superior. Recibe un arreglo de roles permitidos y retorna un middleware que valida si `req.user.role` está en la lista. Si no, responde `403`. |

**Uso:**
```js
router.get('/ruta', verifyToken, checkRole(['ADMIN', 'INSTRUCTOR']), handler);
```

---

### 📁 `src/core/utils/enums.js`
> Enumeraciones globales inmutables del sistema.

| Constante | Valores | Descripción |
|---|---|---|
| `ROLES` | `ADMIN, INSTRUCTOR, APRENDIZ, EMPRESA` | Roles de usuario del sistema |
| `ESTADO_ETAPA` | `POR_INICIAR, EN_CURSO, TERMINADA, CANCELADA` | Estados de una Etapa Productiva |
| `TIPO_NOVEDAD` | `INCAPACIDAD, CALAMIDAD, PERMISO, OTRO` | Tipos de novedades del aprendiz |
| `ESTADO_DOCUMENTO` | `PENDIENTE, APROBADO, RECHAZADO` | Estados de revisión de un documento |

---

### 📁 `src/core/utils/dateHelper.js`
> Utilidades para manejo y formateo de fechas.

| Función | Parámetros | Retorna | Descripción |
|---|---|---|---|
| `formatDate` | `(date: Date\|string)` | `string` `"DD/MM/YYYY"` | Convierte una fecha al formato colombiano estándar |
| `diffInDays` | `(startDate, endDate)` | `number` | Calcula la cantidad de días entre dos fechas |
| `today` | `()` | `string` `"YYYY-MM-DD"` | Retorna la fecha actual en formato ISO |

---

### 📁 `src/core/utils/pdfGenerator.js`
> Generación de archivos PDF con PDFKit.

| Función | Parámetros | Retorna | Descripción |
|---|---|---|---|
| `generatePdf` | `(res, title: string, rows: object[])` | PDF enviado como respuesta HTTP | Crea un PDF con título y lista de datos, lo envía directamente al cliente como descarga |

---

### 📁 `src/app.js`
> Inicialización de Express: middlewares globales y montaje de rutas.

| Ruta API | Módulo que responde |
|---|---|
| `GET /api/health` | Retorna `{ status: 'OK', timestamp }` — verificación de que el servidor está vivo |
| `/api/auth` | `auth-dev1` |
| `/api/users` | `users-dev1` |
| `/api/system-config` | `system-config-dev1` |
| `/api/productive-stages` | `productive-stages-dev2` |
| `/api/companies` | `companies-dev2` |
| `/api/documents` | `documents-dev2` |
| `/api/bitacoras` | `bitacoras-dev3` |
| `/api/trackings` | `trackings-dev3` |
| `/api/hours` | `hours-dev3` |
| `/api/novelties` | `novelties-dev3` |

---

### 📁 `src/server.js`
> Levanta el servidor HTTP en el puerto configurado.

| Acción | Descripción |
|---|---|
| `app.listen(PORT)` | Inicia el servidor y muestra en consola la URL y el entorno activo |

---

### 📁 Módulos — Estructura base (todos los módulos)
> Cada módulo tiene la misma estructura de 3 capas:

| Archivo | Capa | Función base | Descripción |
|---|---|---|---|
| `[mod].routes.js` | Rutas | — | Define los endpoints HTTP del módulo y aplica middlewares de auth/roles |
| `[mod].controller.js` | Controlador | `getAll(req, res)` | Recibe la petición, llama al service y devuelve la respuesta JSON |
| `[mod].service.js` | Servicio | `getAll()` | Contiene la lógica de negocio y consultas a la base de datos con Prisma |

---

## 👥 RESPONSABILIDADES POR DESARROLLADOR

| Dev | Color | Módulos |
|---|---|---|
| **DEV 1** | 🟢 | `auth-dev1`, `users-dev1`, `system-config-dev1` |
| **DEV 2** | 🔵 | `productive-stages-dev2`, `companies-dev2`, `documents-dev2` |
| **DEV 3** | 🟡 | `bitacoras-dev3`, `trackings-dev3`, `hours-dev3`, `novelties-dev3` |

---

## 📝 HISTORIAL DE CAMBIOS

| Fecha | Acción | Detalle |
|---|---|---|
| 2026-04-16 | ✅ Estructura creada | Se organizaron todas las carpetas del backend según la arquitectura modular |
| 2026-04-16 | ✅ Archivos base generados | Cada módulo tiene su `routes.js`, `controller.js` y `service.js` con el dueño marcado |
| 2026-04-16 | ✅ Carpetas renombradas | Se agregó el sufijo `-dev1 / -dev2 / -dev3` a cada carpeta de módulo |
| 2026-04-16 | ✅ `npm install` ejecutado | 180 paquetes instalados, 0 vulnerabilidades |

---

> 📌 **Nota:** Este archivo se actualiza con cada cambio significativo del proyecto.
