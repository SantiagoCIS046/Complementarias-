# 📋 REPORTE DEL PROYECTO — RepFora Backend

> **Proyecto:** Sistema de seguimiento de Etapas Productivas — SENA  
> **Stack:** Node.js + Express + Mongoose (MongoDB Atlas)  
> **Última actualización:** 2026-04-18

---

## 📦 INSTALACIONES

### Dependencias de Producción (`dependencies`)

| Paquete | Versión | Para qué sirve |
|---|---|---|
| `express` | ^4.18.2 | Framework HTTP principal del servidor |
| `cors` | ^2.8.5 | Permite peticiones cross-origin desde el frontend |
| `dotenv` | ^16.6.1 | Lee las variables de entorno del archivo `.env` |
| `jsonwebtoken` | ^9.0.0 | Genera y verifica tokens JWT para autenticación |
| `bcryptjs` | ^2.4.3 | Encripta y compara contraseñas de usuarios |
| `mongoose` | ^9.4.1 | ODM para modelado y conexión a MongoDB |
| `mongodb` | ^7.1.1 | Driver oficial de MongoDB |
| `pdfkit` | ^0.13.0 | Generación de archivos PDF |

> **Nota:** Se migró de Prisma/PostgreSQL a Mongoose/MongoDB Atlas para mayor flexibilidad en los datos.

---

## ⚙️ NÚCLEO DE SEGURIDAD (AUTH) - FINALIZADO

### 📁 `src/modules/auth-dev1/`
> Gestión de acceso, seguridad y sesiones.

| Característica | Detalle |
|---|---|
| **Cifrado** | Las contraseñas se guardan de forma ilegible usando `bcryptjs` con 10 salt rounds. |
| **Bloqueo** | Si un usuario falla la contraseña **5 veces**, la cuenta cambia a `status: blocked`. |
| **Primer Ingreso** | El sistema detecta si es el primer login (`isFirstLogin: true`) para obligar al cambio de clave. |
| **Auditoría** | Cada login exitoso, fallido o bloqueo se registra con **IP y Navegador**. |

---

## 🗂️ MODELOS ACTIVOS

### 📁 `src/modules/users-dev1/models/user.model.js`
> Molde principal de los usuarios del sistema.

| Campo | Tipo | Privacidad | Descripción |
|---|---|---|---|
| `nationalId` | String | Único | Cédula del aprendiz o funcionario |
| `email` | String | Único | Correo electrónico de contacto |
| `password` | String | Cifrado | Clave de acceso (no visible en consultas) |
| `role` | Enum | admin... | `admin`, `aprendiz`, `instructor`, `coordinador` |
| `status` | Enum | active... | `active`, `inactive`, `blocked` |

### 📁 `src/modules/bitacoras-dev3/models/audit-log.model.js`
> Registro de auditoría (quién hizo qué y desde dónde).

- **Registra**: Acciones (`LOGIN_SUCCESS`, `ACCOUNT_LOCKED`), Módulo, Detalles, **Dirección IP** y **UserAgent**.

---

## 🛠️ UTILIDADES Y MIDDLEWARES

### 📁 `src/core/utils/`
- **`jwt.js`**: Generación y verificación de tokens de sesión.
- **`logger.js`**: Función centralizada para grabar logs en la base de datos de auditoría.

### 📁 `src/core/middlewares/`
- **`auth.middleware.js`**: Middleware `protect` que verifica el token en cada petición privada.
- **`roles.middleware.js`**: Middleware `checkRole` para restringir acceso según el rol del usuario.

---

## 📝 HISTORIAL DE CAMBIOS

| Fecha | Acción | Detalle |
|---|---|---|
| 2026-04-18 | ✅ **Auth Finalizado** | Login, Bloqueo de 5 intentos, Cambio de contraseña y JWT listos |
| 2026-04-18 | ✅ **Bitácora Activa** | Sistema de auditoría grabando IP y Navegador en cada acción crítica |
| 2026-04-17 | ✅ **Migración BD** | Se cambió a MongoDB Atlas con Mongoose |
| 2026-04-16 | ✅ **Estructura** | Organización modular del proyecto por desarrolladores |

---

> 📌 **Nota:** Este archivo se actualiza con cada hito alcanzado por el equipo de desarrollo.
arpetas del backend según la arquitectura modular |
| 2026-04-16 | ✅ Archivos base generados | Cada módulo tiene su `routes.js`, `controller.js` y `service.js` con el dueño marcado |
| 2026-04-16 | ✅ Carpetas renombradas | Se agregó el sufijo `-dev1 / -dev2 / -dev3` a cada carpeta de módulo |
| 2026-04-16 | ✅ `npm install` ejecutado | 180 paquetes instalados, 0 vulnerabilidades |

---

> 📌 **Nota:** Este archivo se actualiza con cada cambio significativo del proyecto.
