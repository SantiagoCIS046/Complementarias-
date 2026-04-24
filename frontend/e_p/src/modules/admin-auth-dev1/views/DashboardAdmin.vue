<template>
  <div class="admin-container">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo-area">
          <span class="logo-text">REPFORA</span>
          <span class="logo-subtext">ARQUITECTO INSTITUCIONAL</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-group">
          <a href="#" class="nav-item active">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Gestión de Usuarios
          </a>
          <a href="#" class="nav-item">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            Configuración del Sistema
          </a>
          <a href="#" class="nav-item">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Seguridad
          </a>
        </div>
      </nav>

      <div class="sidebar-footer">
        <a href="#" class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          Soporte
        </a>
        <a href="#" class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Cerrar Sesión
        </a>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Topbar -->
      <header class="topbar">
        <nav class="top-nav">
          <a href="#" class="top-nav-item active">Gestión de Usuarios</a>
          <a href="#" class="top-nav-item">Configuración del Sistema</a>
          <a href="#" class="top-nav-item">Seguridad</a>
        </nav>

        <div class="topbar-actions">
          <div class="search-box">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Búsqueda Global..." />
          </div>
          <button class="icon-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span class="notification-badge"></span>
          </button>
          <button class="icon-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
          <div class="user-profile">
            <img src="https://i.pravatar.cc/150?u=admin" alt="Admin" />
          </div>
        </div>
      </header>

      <!-- Content Area -->
      <div class="page-body">
        <header class="page-header">
          <div class="header-info">
            <h1 class="page-title">Gestión de Usuarios</h1>
            <p class="page-description">
              Visión arquitectónica de todos los miembros institucionales. Gestione permisos, supervise el estado y ejecute operaciones masivas en la red del campus.
            </p>
          </div>
          <div class="header-actions">
            <button class="btn btn-secondary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Exportar Datos
            </button>
            <button class="btn btn-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 12 15 15"/>
              </svg>
              Importación Masiva
            </button>
          </div>
        </header>

        <div class="dashboard-grid">
          <!-- Left Column -->
          <div class="left-col">
            <!-- Import Progress Card -->
            <div class="card import-card">
              <h3 class="card-title-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Importación Masiva
              </h3>
              <div class="upload-zone">
                <div class="upload-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <p>Haga clic para cargar o arrastre y suelte</p>
                <small>CSV o XLSX (Máx. 10MB)</small>
              </div>
              <div class="progress-area">
                <div class="progress-info">
                  <span>PROCESANDO USUARIOS.CSV</span>
                  <span class="percentage">85%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: 85%"></div>
                </div>
              </div>
            </div>

            <!-- Error List Card -->
            <div class="card error-card">
              <div class="error-header">
                <div class="error-title">
                  <span class="alert-icon">!</span>
                  <h3>Resumen de Errores</h3>
                </div>
                <span class="error-badge">3 BLOQUEADO</span>
              </div>
              
              <div class="error-items">
                <div class="error-item">
                  <div class="error-code">R-42</div>
                  <div class="error-details">
                    <p class="error-msg">Formato de Email Inválido</p>
                    <p class="error-loc">Línea 142: "juan.perez#sena.edu.co"</p>
                  </div>
                </div>
                <div class="error-item red">
                  <div class="error-code">R-89</div>
                  <div class="error-details">
                    <p class="error-msg">ID de Documento Duplicado</p>
                    <p class="error-loc">Línea 204: Documento 1002394 ya existe</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column (Table) -->
          <div class="right-col">
            <div class="card table-card">
              <div class="table-filters">
                <div class="search-input">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input type="text" placeholder="Filtrar por nombre, documento o rol..." />
                </div>
                <select class="role-select">
                  <option>Todos los Roles</option>
                  <option>Admin</option>
                  <option>Instructor</option>
                  <option>Aprendiz</option>
                </select>
              </div>

              <table class="user-table">
                <thead>
                  <tr>
                    <th>MIEMBRO</th>
                    <th>DOCUMENTO</th>
                    <th>ROL</th>
                    <th>ESTADO</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div class="member-info">
                        <div class="avatar bg-green">AM</div>
                        <div class="member-details">
                          <p class="member-name">Alejandra Martinez</p>
                          <p class="member-email">alejandra.m@repfora.edu.co</p>
                        </div>
                      </div>
                    </td>
                    <td>1.023.455.902</td>
                    <td><span class="badge badge-admin">ADMIN</span></td>
                    <td><span class="status-dot status-active"></span> Activo</td>
                  </tr>
                  <tr>
                    <td>
                      <div class="member-info">
                        <img src="https://i.pravatar.cc/150?u=2" class="avatar" alt="" />
                        <div class="member-details">
                          <p class="member-name">Roberto Gomez</p>
                          <p class="member-email">r.gomez@instructor.sena.edu.co</p>
                        </div>
                      </div>
                    </td>
                    <td>79.231.004</td>
                    <td><span class="badge badge-instructor">INSTRUCTOR</span></td>
                    <td><span class="status-dot status-offline"></span> Desconectado</td>
                  </tr>
                  <tr>
                    <td>
                      <div class="member-info">
                        <div class="avatar bg-gray">DC</div>
                        <div class="member-details">
                          <p class="member-name">Daniela Castro</p>
                          <p class="member-email">d.castro@aprendiz.sena.edu.co</p>
                        </div>
                      </div>
                    </td>
                    <td>1.192.304.551</td>
                    <td><span class="badge badge-aprendiz">APRENDIZ</span></td>
                    <td><span class="status-dot status-active"></span> Activo</td>
                  </tr>
                  <tr>
                    <td>
                      <div class="member-info">
                        <div class="avatar bg-pink">SV</div>
                        <div class="member-details">
                          <p class="member-name">Samuel Valencia</p>
                          <p class="member-email">s.valencia@aprendiz.sena.edu.co</p>
                        </div>
                      </div>
                    </td>
                    <td>1.002.883.210</td>
                    <td><span class="badge badge-aprendiz">APRENDIZ</span></td>
                    <td><span class="status-dot status-suspended"></span> Suspendido</td>
                  </tr>
                </tbody>
              </table>

              <div class="table-pagination">
                <p class="pagination-info">Mostrando 1-4 de 1,240 miembros</p>
                <div class="pagination-btns">
                  <button class="page-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></button>
                  <button class="page-btn active">1</button>
                  <button class="page-btn">2</button>
                  <button class="page-btn">3</button>
                  <button class="page-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="stats-grid">
          <div class="stat-card border-green">
            <p class="stat-label">TOTAL DE USUARIOS</p>
            <h2 class="stat-value">1,240</h2>
            <p class="stat-trend trend-up">↑ 12% desde el último periodo</p>
          </div>
          <div class="stat-card border-pink">
            <p class="stat-label">INSTRUCTORES ACTIVOS</p>
            <h2 class="stat-value">84</h2>
            <p class="stat-sub">Capacidad institucional completa</p>
          </div>
          <div class="stat-card border-dark">
            <p class="stat-label">INGRESOS RECIENTES</p>
            <h2 class="stat-value">43</h2>
            <p class="stat-sub">Pendiente de verificación</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
// DashboardAdmin.vue - Vista Principal de Gestión de Usuarios
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

.admin-container {
  display: flex;
  width: 100vw;
  height: 100vh;
  background: #f8fafc;
  font-family: 'Inter', sans-serif;
  color: #1e293b;
}

/* Sidebar */
.sidebar {
  width: 260px;
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  padding: 24px 0;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 0 24px 32px;
}

.logo-text {
  display: block;
  font-size: 1.25rem;
  font-weight: 800;
  color: #000;
  letter-spacing: -0.5px;
}

.logo-subtext {
  display: block;
  font-size: 0.65rem;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: 1px;
}

.sidebar-nav {
  flex: 1;
  padding: 0 16px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  text-decoration: none;
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  margin-bottom: 4px;
}

.nav-item:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.nav-item.active {
  background: #ffffff;
  color: #39a900;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  border-left: 4px solid #39a900;
  border-radius: 4px 8px 8px 4px;
}

.nav-icon {
  width: 18px;
  height: 18px;
}

.sidebar-footer {
  padding: 0 16px;
  border-top: 1px solid #f1f5f9;
  padding-top: 16px;
}

/* Main Content */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Topbar */
.topbar {
  height: 70px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  flex-shrink: 0;
}

.top-nav {
  display: flex;
  gap: 32px;
}

.top-nav-item {
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
  transition: color 0.2s;
}

.top-nav-item.active {
  color: #39a900;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.search-box {
  position: relative;
  width: 300px;
}

.search-box input {
  width: 100%;
  background: #f1f5f9;
  border: none;
  border-radius: 10px;
  padding: 10px 12px 10px 40px;
  font-size: 0.875rem;
  outline: none;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #94a3b8;
}

.icon-btn {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  position: relative;
}

.icon-btn svg {
  width: 20px;
  height: 20px;
}

.notification-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  background: #ef4444;
  border: 2px solid #fff;
  border-radius: 50%;
}

.user-profile img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

/* Page Body */
.page-body {
  flex: 1;
  overflow-y: auto;
  padding: 40px 48px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 40px;
}

.page-title {
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 8px;
}

.page-description {
  color: #64748b;
  max-width: 600px;
  line-height: 1.6;
  font-size: 0.9375rem;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn svg { width: 18px; height: 18px; }

.btn-secondary {
  background: #e2e8f0;
  border: none;
  color: #1e293b;
}

.btn-primary {
  background: #39a900;
  border: none;
  color: #fff;
}

.btn:hover { transform: translateY(-2px); }

/* Dashboard Grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 32px;
  margin-bottom: 32px;
}

.card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
}

.card-title-sm {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 20px;
}

.card-title-sm svg { width: 18px; height: 18px; color: #39a900; }

/* Import Card */
.upload-zone {
  border: 2px dashed #e2e8f0;
  border-radius: 12px;
  padding: 32px 16px;
  text-align: center;
  margin-bottom: 20px;
}

.upload-icon {
  width: 48px;
  height: 48px;
  background: #f1f5f9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  color: #64748b;
}

.upload-zone p { font-size: 0.875rem; font-weight: 600; margin-bottom: 4px; }
.upload-zone small { color: #94a3b8; font-size: 0.75rem; }

.progress-area {
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.65rem;
  font-weight: 800;
  margin-bottom: 8px;
}

.percentage { color: #39a900; }

.progress-bar {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #39a900;
  border-radius: 4px;
}

/* Error Card */
.error-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.error-title { display: flex; align-items: center; gap: 8px; }
.alert-icon {
  width: 24px;
  height: 24px;
  background: #ef4444;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.875rem;
}

.error-badge {
  background: #fee2e2;
  color: #ef4444;
  font-size: 0.65rem;
  font-weight: 800;
  padding: 4px 8px;
  border-radius: 4px;
}

.error-item {
  display: flex;
  gap: 12px;
  border-left: 3px solid #f97316;
  padding: 12px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  border-radius: 0 8px 8px 0;
  margin-bottom: 12px;
}

.error-item.red { border-left-color: #ef4444; }

.error-code {
  font-size: 0.75rem;
  font-weight: 800;
  color: #f97316;
}
.red .error-code { color: #ef4444; }

.error-msg { font-size: 0.8125rem; font-weight: 700; margin-bottom: 2px; }
.error-loc { font-size: 0.6875rem; color: #94a3b8; }

/* Table Card */
.table-card { padding: 0; overflow: hidden; }

.table-filters {
  padding: 24px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.search-input {
  position: relative;
  flex: 1;
}

.search-input input {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 12px 10px 40px;
  outline: none;
}

.search-input svg {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #94a3b8;
}

.role-select {
  padding: 0 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  outline: none;
  font-weight: 600;
  font-size: 0.875rem;
}

.user-table {
  width: 100%;
  border-collapse: collapse;
}

.user-table th {
  background: #f8fafc;
  text-align: left;
  padding: 12px 24px;
  font-size: 0.6875rem;
  font-weight: 800;
  color: #64748b;
  letter-spacing: 0.5px;
}

.user-table td {
  padding: 16px 24px;
  border-bottom: 1px solid #f1f5f9;
}

.member-info { display: flex; align-items: center; gap: 12px; }
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: #fff;
}

.avatar.bg-green { background: #86efac; color: #14532d; }
.avatar.bg-gray { background: #e2e8f0; color: #475569; }
.avatar.bg-pink { background: #fbcfe8; color: #9d174d; }

.member-name { font-size: 0.875rem; font-weight: 700; }
.member-email { font-size: 0.75rem; color: #94a3b8; }

.badge {
  font-size: 0.65rem;
  font-weight: 800;
  padding: 4px 8px;
  border-radius: 4px;
}

.badge-admin { background: #dcfce7; color: #16a34a; }
.badge-instructor { background: #fce7f3; color: #db2777; }
.badge-aprendiz { background: #f1f5f9; color: #64748b; }

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}

.status-active { background: #22c55e; }
.status-offline { background: #94a3b8; }
.status-suspended { background: #ef4444; }

.table-pagination {
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-info { font-size: 0.8125rem; color: #64748b; }

.pagination-btns { display: flex; gap: 8px; }
.page-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn svg { width: 14px; height: 14px; }
.page-btn:hover { background: #f1f5f9; }
.page-btn.active { background: #39a900; color: #fff; border-color: #39a900; }

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.stat-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
}

.border-green { border-left: 4px solid #39a900; }
.border-pink { border-left: 4px solid #db2777; }
.border-dark { border-left: 4px solid #1e293b; }

.stat-label { font-size: 0.6875rem; font-weight: 800; color: #64748b; margin-bottom: 12px; }
.stat-value { font-size: 1.75rem; font-weight: 800; margin-bottom: 8px; }
.stat-trend { font-size: 0.75rem; font-weight: 600; }
.trend-up { color: #16a34a; }
.stat-sub { font-size: 0.75rem; color: #94a3b8; }

</style>
