# 🛠️ Stack Tecnológico — RepFora (PROYECTOEP-PRELIMINAR)

Documento de referencia rápida con todas las tecnologías, librerías y servicios usados en este proyecto, para replicar el stack en futuros proyectos.

---

## 🖥️ Frontend

| Categoría | Tecnología | Versión |
|---|---|---|
| Framework JS | **Vue 3** (Composition API) | `^3.5.32` |
| Build tool | **Vite** | `^8.0.4` |
| Enrutamiento | **Vue Router** | `^4.6.4` |
| Estado global | **Pinia** | `^3.0.4` |
| HTTP client | **Axios** | `^1.15.2` |
| Iconos | **Lucide Vue Next** | `^1.0.0` |
| CSS utility | **Tailwind CSS v4** | `^4.2.4` |
| PostCSS | autoprefixer + postcss | `^8.5.12` |
| PDF client | **jsPDF** + **jspdf-autotable** | `^4.2.1 / ^5.0.7` |

### Estructura del frontend
```
frontend/e_p/
├── src/
│   ├── modules/          # Módulos por funcionalidad (feature-based)
│   ├── style.css         # Estilos globales (Tailwind base)
│   └── main.js
├── vite.config.js
└── index.html
```

---

## ⚙️ Backend

| Categoría | Tecnología | Versión |
|---|---|---|
| Runtime | **Node.js** | LTS |
| Framework HTTP | **Express** | `^4.18.2` |
| ORM / ODM | **Prisma Client** | `^5.0.0` |
| Base de datos | **MongoDB** (via Mongoose) | `^9.4.1` |
| Driver nativo | **mongodb** | `^7.1.1` |
| Autenticación | **JWT** (`jsonwebtoken`) | `^9.0.0` |
| Hash contraseñas | **bcryptjs** | `^2.4.3` |
| Variables de entorno | **dotenv** | `^16.6.1` |
| CORS | **cors** | `^2.8.5` |
| Email | **Nodemailer** (SMTP Gmail) | `^8.0.7` |
| Archivos | **Multer** (subida de archivos) | `^2.1.1` |
| Google APIs | **googleapis** | `^171.4.0` |
| Generación PDF | **PDFKit** | `^0.13.0` |
| Excel | **xlsx** | `^0.18.5` |
| Tareas programadas | **node-cron** | `^3.0.3` |
| Dev server | **nodemon** | `^3.0.0` |
| Tests | **Vitest** | `^4.1.5` |

### Estructura del backend
```
backend/
├── src/
│   ├── modules/          # Módulos por funcionalidad (feature-based)
│   │   ├── auth-dev1/
│   │   ├── users-dev1/
│   │   └── ...
│   ├── app.js            # Configuración de Express
│   └── server.js         # Punto de entrada
├── prisma/
│   └── schema.prisma     # Esquema de base de datos
├── credentials/          # Credenciales de Google (en .gitignore)
└── .env                  # Variables de entorno (en .gitignore)
```

---

## 🗄️ Base de Datos

- **Motor:** MongoDB Atlas (cloud)
- **ORM:** Prisma v5 con provider `mongodb`
- **Conexión:** mediante `MONGO_URI` en variables de entorno
- **Modelos base:** `User`, `Company`, `ProductiveStage`, `Bitacora`

---

## ☁️ Servicios Externos

| Servicio | Uso |
|---|---|
| **MongoDB Atlas** | Base de datos en la nube |
| **Google Drive API** | Almacenamiento de documentos (cuenta de servicio) |
| **Gmail SMTP** | Envío de correos (recuperación de contraseña, notificaciones) |

---

## 🚀 Despliegue

- **Frontend:** [Vercel](https://vercel.com) — desplegado desde `frontend/e_p/dist`
- **Backend:** Vercel (funciones serverless) — con `vercel.json` en `/backend`
- **CI/CD:** GitHub (directorio `.github/` configurado)

### Variables de entorno requeridas (backend)

```env
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb+srv://...
JWT_SECRET=...
JWT_EXPIRES_IN=8h
FRONTEND_URL=http://localhost:5173
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=...
GOOGLE_CREDENTIALS_PATH=./credentials/google-service-account.json
GOOGLE_DRIVE_FOLDER_ID=...
```

---

## 🏗️ Arquitectura General

```
Monorepo
├── frontend/   → Vue 3 + Vite + Tailwind CSS v4
├── backend/    → Node.js + Express + Prisma + MongoDB
└── vercel.json → Configuración de despliegue raíz
```

**Patrón:** Arquitectura modular por funcionalidad (feature-based modules) tanto en frontend como en backend.  
**Comunicación:** REST API → Axios (frontend) ↔ Express (backend).  
**Auth:** JWT con bcryptjs para hash de contraseñas.

---

*Generado el 2026-06-11 — Proyecto RepFora SENA*
