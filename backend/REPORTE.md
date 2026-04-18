# 📋 REPORTE DEL PROYECTO — RepFora Backend

> **Proyecto:** Sistema de seguimiento de Etapas Productivas — SENA  
> **Stack de Desarrollo:** Node.js + Express + Mongoose (MongoDB Atlas)  
> **Evolución Tecnológica:** Migrado de Prisma/PostgreSQL a MongoDB el 17/04/2026.  
> **Última actualización:** 2026-04-18

---

## 📦 INSTALACIONES Y DEPENDENCIAS

### 🛠️ Tecnologías Base
| Paquete | Versión | Función |
|---|---|---|
| `express` | ^4.18.2 | Framework principal para el servidor HTTP |
| `dotenv` | ^16.6.1 | Manejo de variables de entorno y secretos (.env) |
| `cors` | ^2.8.5 | Seguridad para permitir conexiones desde el Frontend |

### 🔐 Seguridad y Autenticación
| Paquete | Función |
|---|---|
| `jsonwebtoken` | Generación y validación de tokens de sesión segura (JWT) |
| `bcryptjs` | Cifrado de alto nivel para contraseñas (Hashing) |

### 💾 Almacenamiento (Base de Datos)
- **Original:** `prisma` + `@prisma/client` + `PostgreSQL` (Infraestructura inicial).
- **Actual:** `mongoose` + `mongodb` (Implementación en la nube con Atlas).

---

## 📁 ESTRUCTURA DEL EXPLORER (Arquitectura Modular)

El proyecto está organizado para que cada desarrollador tenga su propio espacio de trabajo sin causar conflictos en el código de los demás.

### 🌳 Mapa de Carpetas
```
backend/
├── src/
│   ├── core/                       # 🤝 ZONA COMPARTIDA (Utilidades globales)
│   │   ├── config/                 # Conexión a DB y Variables de Entorno
│   │   ├── middlewares/            # Seguros de puerta (Auth y Roles)
│   │   └── utils/                  # Herramientas (PDF, Fechas, JWT, Logger)
│   ├── modules/                    # 🚧 ZONA DE DESARROLLO (Módulos por Dev)
│   │   ├── auth-dev1/              # Núcleo de Seguridad
│   │   ├── users-dev1/             # Gestión de Usuarios
│   │   ├── system-config-dev1/     # Parámetros Globales
│   │   ├── productive-stages-dev2/ # Etapas Productivas
│   │   ├── companies-dev2/         # Gestión de Empresas
│   │   ├── bitacoras-dev3/         # Auditoría y Bitácoras
│   │   └── ...                     # Otros módulos de Dev 2 y Dev 3
│   ├── app.js                      # Centralizador de Rutas
│   └── server.js                   # Motor de arranque del sistema
├── .env                            # Archivo de secretos (NO COMPARTIR)
└── REPORTE.md                      # Diario y Manual del Proyecto
```

### 📂 ¿Para qué sirve cada zona?
- **`core/config`**: Aquí se define cómo el sistema se comunica con MongoDB Atlas.
- **`core/middlewares`**: Aquí reside el "guardián" del sistema. Revisa que el usuario tenga un token válido.
- **`core/utils`**: Funciones que todos usamos, como el `configHelper` para leer parámetros rápidos de la memoria RAM.

---

## 👥 ROLES Y RESPONSABILIDADES

Cada carpeta de módulo tiene un sufijo que indica quién es el dueño del código:

| Desarrollador | Color sugerido | Módulos a su cargo |
|---|---|---|
| **DESARROLLADOR 1** | 🟢 Verde | `auth-dev1`, `users-dev1`, `system-config-dev1` |
| **DESARROLLADOR 2** | 🔵 Azul | `productive-stages-dev2`, `companies-dev2`, `documents-dev2` |
| **DESARROLLADOR 3** | 🟡 Amarillo | `bitacoras-dev3`, `trackings-dev3`, `hours-dev3`, `novelties-dev3` |

---

## ⚙️ CONFIGURACIÓN GLOBAL (SYSTEMCONFIG) - FINALIZADO

### 📁 `src/core/utils/configHelper.js`
> Optimización mediante caché en memoria.

- **Caché (RAM)**: Guarda los parámetros (ej: intentos permitidos) para respuesta instantánea.
- **Preload**: El servidor carga toda la configuración al encenderse para no molestar a la base de datos después.

### 📁 `src/core/scripts/seed.js`
> El "Génesis" del sistema (Semilla).

- **Propósito**: Permite que el sistema inicie con un administrador real.
- **Admin**: Crea a `admin@gmail.com` (Clave inicial: `admin123456`).
- **Configuración**: Define los **5 intentos de login** y tiempos de bloqueo del sistema.

---

## 🔒 NÚCLEO DE SEGURIDAD (AUTH) - FINALIZADO

| Característica | Detalle |
|---|---|
| **Protección** | Toda ruta privada exige un Token JWT válido. |
| **Bloqueo Inteligente**| Si un usuario falla 5 veces (valor configurable), su cuenta se bloquea. |
| **Primer Ingreso** | El sistema obliga al cambio de clave en la primera entrada. |
| **Bitácora (IP/Nav)** | Se registra la **IP y el Navegador** en cada inicio de sesión por seguridad. |

---

## 📝 HISTORIAL DE CAMBIOS (Bitácora de Avances)

| Fecha | Acción | Detalle |
|---|---|---|
| 2026-04-18 | ✅ **Gestión Usuarios** | Importación masiva desde Excel y Lógica de Reasignación Inteligente por carga. |
| 2026-04-18 | ✅ **SystemConfig** | Implementado Script de Seed y ConfigHelper con caché. |
| 2026-04-18 | ✅ **Auth Finalizado** | Se terminaron las rutas, servicios y protección por token. |
| 2026-04-18 | ✅ **Auditoría IP** | Se integró el seguimiento de IP y Navegador en las bitácoras. |
| 2026-04-17 | ✅ **Migración Atlas** | El proyecto ahora funciona nativamente con MongoDB Atlas. |
| 2026-04-16 | ✅ **Estructura Modular** | Se organizaron las carpetas para los 3 desarrolladores. |
| 2026-04-16 | ✅ **Capa de Base** | Inicialización del proyecto con Express y Nodemon. |

---

## 🛡️ PROTOCOLO DE INTEGRIDAD DEL REPORTE

Para garantizar la trazabilidad exigida por el SENA, este documento sigue un protocolo de **SOLO ADICIÓN**:

1.  **Inmutabilidad**: Está prohibido eliminar o simplificar secciones de hitos ya alcanzados.
2.  **Crecimiento Vertical**: Los nuevos desarrollos se anexan como nuevas secciones o filas en las tablas de historial.
3.  **Trazabilidad**: Si una tecnología es reemplazada (ej. Prisma por Mongoose), se debe mantener la documentación de la tecnología anterior con una nota explicativa del cambio.

---

> 📌 **Nota Final:** Este documento es el cerebro del proyecto RepFora. Su integridad es responsabilidad de todos los desarrolladores.
