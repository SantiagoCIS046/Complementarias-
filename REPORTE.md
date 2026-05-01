# 🚀 REPFORA - SISTEMA DE GESTIÓN DE ETAPA PRODUCTIVA

Este documento constituye la guía maestra de arquitectura, responsabilidades y estructura técnica del proyecto REPFORA.

---

## 🛡️ REGLA DE ORO: ORGANIZACIÓN POR ROLES

Esta es la estructura maestra para que el equipo trabaje organizado y no se pise el código. Cada desarrollador es dueño absoluto de su universo y de su respectiva rama en GitHub:

### 🛡️ Dev 1 (Tú - Arquitecto): Páginas del Administrador
*   **Alcance:** Seguridad, roles, creación masiva y gestión de usuarios.
*   **Responsabilidades:** Arquitectura Base del Backend, Dashboard del Administrador, Seguridad y Middlewares.

### 🟢 Dev 2: Páginas del Aprendiz
*   **Alcance:** Todo el flujo del aprendiz (empresa, modalidad y documentos).
*   **Responsabilidades:** Registro de empresa, documentos iniciales y Dashboard del Aprendiz.

### 🔵 Dev 3: Páginas del Instructor
*   **Alcance:** Control de bitácoras, seguimiento y graduación.
*   **Responsabilidades:** Semáforo de horas, validación de bitácoras y cierre académico.

> [!IMPORTANT]
> **BAJO ESTA ESTRUCTURA:** Cada quien opera de forma autónoma. Si necesitas cambios fuera de tu zona, solicita apoyo al Arquitecto (Dev 1).

---

## 📂 ESTRUCTURA TÉCNICA DEL PROYECTO

### 💻 BACKEND (`/backend`)
Estructura modular por responsabilidades:
```text
backend/
├── src/
│   ├── core/              # Lógica compartida (Utils, Middlewares de Auth, Enums)
│   ├── modules/
│   │   ├── auth-dev1/     # Login, JWT, Registro
│   │   ├── users-dev1/    # Gestión de usuarios del Admin
│   │   ├── companies-dev2/ # Modelos y rutas de Empresas
│   │   ├── documents-dev2/ # Gestión de archivos y Google Drive
│   │   └── productive-stages-dev2/ # Lógica de inicio de etapa
│   │   └── tracking-dev3/  # Bitácoras y Novedades (Instructor)
│   ├── app.js             # Configuración de Express
│   └── server.js          # Punto de entrada y conexión a MongoDB
├── seed.js                # Script de población de datos de prueba
└── .env                   # Variables de entorno (DB_URI, JWT_SECRET)
```

### 🎨 FRONTEND (`/frontend/e_p`)
Estructura basada en módulos de Vue 3:
```text
frontend/e_p/
├── src/
│   ├── core/
│   │   ├── router/        # Navegación y Guards de acceso (Login Redirect)
│   │   ├── store/         # Pinia (AuthStore, UserStore)
│   │   └── api/           # Configuración de Axios
│   ├── modules/
│   │   ├── admin-auth-dev1/      # Vistas y componentes del Admin
│   │   ├── ep-management-dev2/   # Vistas del Aprendiz (Registro Empresa)
│   │   └── operation-tracking-dev3/ # Dashboard del Instructor, Novedades
│   ├── components/        # Componentes UI globales (Botones, Inputs)
│   ├── assets/            # Imágenes, logos y recursos estáticos
│   └── App.vue            # Componente raíz
├── postcss.config.js      # Configuración de Tailwind v4
└── package.json           # Dependencias (Vue 3, Vite, Pinia, Axios)
```

---

## 🎨 ESTÁNDARES DE DISEÑO (ESTILO PREMIUM)

Para mantener la calidad visual institucional, todo nuevo desarrollo debe seguir:
*   **Tipografía:** `Inter` (Google Fonts).
*   **Paleta:**
    *   `SENA Green`: `#39A900` (Acento principal).
    *   `Dark SENA`: `#1A4D2E` (Sidebar, Headers).
    *   `Background`: `#F4F7F6` (Limpio y minimalista).
*   **Componentes:** Uso de `Material Symbols Outlined` para iconos y bordes redondeados de `24px` a `28px` en tarjetas.
*   **CSS:** Se prioriza el uso de **CSS Scoped** en los componentes para evitar colisiones de estilos entre desarrolladores.

---

## 🔄 FLUJO DE TRABAJO (GIT)

1.  **Main:** Solo código estable y funcional.
2.  **Ramas:** Cada Dev trabaja en su rama de módulo (ej: `feat/admin-auth`, `feat/tracking-instructor`).
3.  **Sync:** Antes de subir cambios, realizar `git pull origin main` para resolver conflictos locales.

---

> [!IMPORTANT]
> **REGLA DE ORO:** Ningún archivo debe ser modificado fuera del área asignada. Si un Dev necesita cambios en el núcleo (Core), debe solicitarlo al Arquitecto (Dev 1).
