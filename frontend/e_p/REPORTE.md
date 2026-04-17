# 📋 REPORTE DEL FRONTEND — RepFora

> **Proyecto:** Sistema de seguimiento de Etapas Productivas — SENA
> **Stack:** Vue 3 + Vite + Vue Router + Pinia + Axios + Tailwind CSS
> **Última actualización:** 2026-04-16

---

## 📦 INSTALACIONES

### Dependencias actuales (`dependencies`)

| Paquete | Versión | Para qué sirve |
|---|---|---|
| `vue` | ^3.5.32 | Framework principal del frontend |

### Dependencias de Desarrollo actuales (`devDependencies`)

| Paquete | Versión | Para qué sirve |
|---|---|---|
| `@vitejs/plugin-vue` | ^6.0.5 | Plugin de Vite para compilar archivos `.vue` |
| `vite` | ^8.0.4 | Bundler y servidor de desarrollo ultrarrápido |

### Pendientes por instalar

| Paquete | Comando | Para qué sirve |
|---|---|---|
| `vue-router` | `npm install vue-router` | Navegación entre páginas (SPA) |
| `pinia` | `npm install pinia` | Manejo de estado global |
| `axios` | `npm install axios` | Peticiones HTTP al backend |
| `tailwindcss` | `npm install -D tailwindcss` | Framework de estilos utilitarios |

---

## 🗂️ ESTRUCTURA DEL PROYECTO

```
frontend/e_p/
├── src/
│   ├── core/                              # ZONA COMPARTIDA (Los 3 devs)
│   │   ├── assets/
│   │   │   └── colors.css                # Paleta de colores SENA
│   │   ├── layouts/
│   │   │   ├── AdminLayout.vue           # Plantilla con sidebar y topbar
│   │   │   └── AuthLayout.vue            # Plantilla centrada (Login)
│   │   ├── router/
│   │   │   └── index.js                  # Vue Router + guard por rol
│   │   └── store/
│   │       └── auth.store.js             # Pinia — Estado del usuario logueado
│   │
│   ├── components/                        # COMPONENTES REUTILIZABLES
│   │   ├── ui/
│   │   │   ├── BaseButton.vue            # Botón con variantes y loading
│   │   │   └── BaseInput.vue             # Input con v-model, label y error
│   │   └── shared/
│   │       └── StatusBadge.vue           # Badge de estados EP y documentos
│   │
│   ├── modules/                           # ZONA DIVIDIDA POR DESARROLLADOR
│   │   ├── admin-auth-dev1/              # DEV 1
│   │   │   ├── views/
│   │   │   │   ├── Login.vue
│   │   │   │   └── UserManagement.vue
│   │   │   ├── components/
│   │   │   └── services/
│   │   │       └── auth.service.js
│   │   │
│   │   ├── ep-management-dev2/           # DEV 2
│   │   │   ├── views/
│   │   │   │   ├── EPRegister.vue
│   │   │   │   └── CompanyList.vue
│   │   │   ├── components/
│   │   │   └── services/
│   │   │       └── ep.service.js
│   │   │
│   │   └── operation-tracking-dev3/      # DEV 3
│   │       ├── views/
│   │       │   ├── BitacorasReview.vue
│   │       │   └── TrackingCalendar.vue
│   │       ├── components/
│   │       └── services/
│   │           └── tracking.service.js
│   │
│   ├── App.vue
│   └── main.js
│
├── tailwind.config.js
├── package.json
└── REPORTE.md
```

---

## ⚙️ FUNCIONES DEL PROYECTO

---

### `src/core/store/auth.store.js` — Pinia

| Elemento | Tipo | Descripción |
|---|---|---|
| `user` | `ref` | Objeto del usuario autenticado |
| `token` | `ref` | JWT guardado en localStorage |
| `isLoggedIn` | `computed` | `true` si hay token activo |
| `userRole` | `computed` | Rol del usuario (`ADMIN`, `INSTRUCTOR`, etc.) |
| `userName` | `computed` | Nombre del usuario actual |
| `login(payload)` | `action` | Guarda `user` y `token` en estado y localStorage |
| `logout()` | `action` | Limpia el estado y elimina datos de localStorage |

---

### `src/core/router/index.js` — Vue Router

| Ruta | Vista | Roles permitidos | DEV |
|---|---|---|---|
| `/login` | `Login.vue` | Público | DEV 1 |
| `/usuarios` | `UserManagement.vue` | `ADMIN` | DEV 1 |
| `/etapas` | `EPRegister.vue` | `ADMIN, INSTRUCTOR` | DEV 2 |
| `/empresas` | `CompanyList.vue` | `ADMIN, INSTRUCTOR` | DEV 2 |
| `/bitacoras` | `BitacorasReview.vue` | `INSTRUCTOR, APRENDIZ` | DEV 3 |
| `/seguimiento` | `TrackingCalendar.vue` | `INSTRUCTOR` | DEV 3 |

> **Guard global:** Si `requiresAuth: true` y el usuario no está logueado, redirige a `/login`.

---

### `src/core/layouts/AdminLayout.vue`

| Slot | Descripción |
|---|---|
| `#sidebar` | Menú lateral |
| `#topbar` | Barra superior |
| `default` | Contenido principal de la vista |

### `src/core/layouts/AuthLayout.vue`

| Slot | Descripción |
|---|---|
| `default` | Tarjeta centrada en pantalla (Login) |

---

### `src/components/ui/BaseButton.vue`

| Prop | Tipo | Default | Descripción |
|---|---|---|---|
| `variant` | `String` | `'primary'` | `primary / secondary / danger / ghost` |
| `loading` | `Boolean` | `false` | Muestra spinner y bloquea el botón |
| `disabled` | `Boolean` | `false` | Deshabilita el botón |

---

### `src/components/ui/BaseInput.vue`

| Prop | Tipo | Descripción |
|---|---|---|
| `id` | `String` | ID único del input (requerido) |
| `label` | `String` | Etiqueta encima del input |
| `type` | `String` | Tipo HTML: `text`, `password`, `email`... |
| `modelValue` | `String` | Valor reactivo (compatible con `v-model`) |
| `error` | `String` | Mensaje de error debajo del input |
| `disabled` | `Boolean` | Deshabilita el input |

---

### `src/components/shared/StatusBadge.vue`

| Prop | Tipo | Descripción |
|---|---|---|
| `status` | `String` | `por_iniciar / en_curso / terminada / cancelada / pendiente / aprobado / rechazado` |
| `label` | `String` | Texto a mostrar dentro del badge |

---

### `admin-auth-dev1/services/auth.service.js` — 🟢 DEV 1

| Función | Método | Endpoint | Descripción |
|---|---|---|---|
| `login(credentials)` | `POST` | `/api/auth/login` | Autenticar usuario |
| `register(data)` | `POST` | `/api/auth/register` | Registrar nuevo usuario |
| `getUsers()` | `GET` | `/api/users` | Listar todos los usuarios |

---

### `ep-management-dev2/services/ep.service.js` — 🔵 DEV 2

| Función | Método | Endpoint | Descripción |
|---|---|---|---|
| `getAll()` | `GET` | `/api/productive-stages` | Listar todas las EPs |
| `getById(id)` | `GET` | `/api/productive-stages/:id` | Obtener EP por ID |
| `create(data)` | `POST` | `/api/productive-stages` | Crear nueva EP |
| `update(id, data)` | `PUT` | `/api/productive-stages/:id` | Actualizar EP |
| `getCompanies()` | `GET` | `/api/companies` | Listar empresas |

---

### `operation-tracking-dev3/services/tracking.service.js` — 🟡 DEV 3

| Función | Método | Endpoint | Descripción |
|---|---|---|---|
| `getBitacoras()` | `GET` | `/api/bitacoras` | Listar bitácoras |
| `createBitacora(data)` | `POST` | `/api/bitacoras` | Crear bitácora |
| `getTrackings()` | `GET` | `/api/trackings` | Listar visitas |
| `createTracking(data)` | `POST` | `/api/trackings` | Registrar visita |
| `getHours(id)` | `GET` | `/api/hours/:id` | Consultar horas de una EP |

---

## 👥 RESPONSABILIDADES POR DESARROLLADOR

| Dev | Módulo | Vistas |
|---|---|---|
| 🟢 **DEV 1** | `admin-auth-dev1` | `Login.vue`, `UserManagement.vue` |
| 🔵 **DEV 2** | `ep-management-dev2` | `EPRegister.vue`, `CompanyList.vue` |
| 🟡 **DEV 3** | `operation-tracking-dev3` | `BitacorasReview.vue`, `TrackingCalendar.vue` |

---

## 📝 HISTORIAL DE CAMBIOS

| Fecha | Acción | Detalle |
|---|---|---|
| 2026-04-16 | ✅ Estructura creada | Carpetas y archivos base del frontend Vue 3 + Vite |
| 2026-04-16 | ✅ Core compartido | `colors.css`, layouts, router, store |
| 2026-04-16 | ✅ Componentes UI | `BaseButton`, `BaseInput`, `StatusBadge` |
| 2026-04-16 | ✅ Módulos scaffold | Vistas y servicios base con dueño marcado por DEV |

---

> 📌 Este archivo se actualiza con cada cambio significativo del frontend.
