<template>
  <div class="flex h-screen bg-[#f8fafc] overflow-hidden font-sans">
    <Sidebar />

    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Header />

      <main class="flex-1 overflow-y-auto p-8 lg:p-12">
        <div class="w-full space-y-2">

          <!-- 2. Título de sección con separador verde -->
          <HeaderLayout title="Gestión de Bitácoras" icon="assignment" />

      <div class="content-columns">
        <!-- Columna 1: Fichas -->
        <aside class="column-fichas">
          <button class="btn-new-bitacora">
            <span class="material-symbols-outlined">add</span> Nueva Bitácora
          </button>
          
          <div class="fichas-section">
            <h3 class="section-title">
              <span class="material-symbols-outlined">tab_unselected</span> MIS FICHAS ASIGNADAS
            </h3>
            
            <div class="ficha-card active">
              <div class="ficha-header">
                <span class="ficha-id">Ficha 2670687</span>
                <span class="badge-new">3 Nuevas</span>
              </div>
              <p class="ficha-name">ADSO - Diurno</p>
            </div>

            <div class="ficha-card">
              <div class="ficha-header">
                <span class="ficha-id">Ficha 2558342</span>
              </div>
              <p class="ficha-name">Sistemas - Nocturno</p>
            </div>

            <div class="ficha-card">
              <div class="ficha-header">
                <span class="ficha-id">Ficha 2441092</span>
              </div>
              <p class="ficha-name">Multimedia</p>
            </div>
          </div>
        </aside>

        <!-- Columna 2: Entregas -->
        <section class="column-entregas">
          <div class="entregas-header">
            <h2>Entregas Recientes</h2>
            <div class="filter-box">
              <span class="material-symbols-outlined">filter_list</span>
              <input type="text" placeholder="Filtrar por nombre..." />
            </div>
          </div>

          <div class="entregas-list">
            <div class="entrega-item selected">
              <div class="entrega-info">
                <strong>Antonio Mancilla</strong>
                <span class="time">Hoy, 08:30 AM</span>
              </div>
              <p class="entrega-subject">Bitácora Quincena 4</p>
              <p class="entrega-preview">Adjunto la bitácora correspondiente a la cuarta...</p>
            </div>

            <div class="entrega-item">
              <div class="entrega-info">
                <strong>Daniela Palacio</strong>
                <span class="time">Ayer, 04:15 PM</span>
              </div>
              <p class="entrega-subject">Bitácora Quincena 3</p>
              <p class="entrega-preview">Actualización de tareas realizadas en el proyecto...</p>
            </div>

            <div class="entrega-item">
              <div class="entrega-info">
                <strong>Julian Castro</strong>
                <span class="time">12 Oct, 11:20 AM</span>
              </div>
              <p class="entrega-subject">Bitácora Quincena 4</p>
              <p class="entrega-preview">Reporte de incidencias en el área de desarrollo de...</p>
            </div>
          </div>
        </section>

        <!-- Columna 3: Detalle / Revisión -->
        <section class="column-revision">
          <div class="revision-scroll">
            <header class="revision-header">
              <div class="user-profile">
                <div class="avatar-large">AM</div>
                <div class="profile-info">
                  <h2>Antonio Mancilla</h2>
                  <p>Aprendiz ADSO - Ficha 2670687</p>
                  <div class="pills">
                    <span class="pill gray">ETAPA PRODUCTIVA</span>
                    <span class="pill green">QUINCENA 4</span>
                  </div>
                </div>
              </div>
              <div class="header-tools">
                <button class="tool-btn"><span class="material-symbols-outlined">print</span></button>
                <button class="tool-btn"><span class="material-symbols-outlined">download</span></button>
              </div>
            </header>

            <div class="revision-widgets">
              <div class="widget calendar-widget">
                <div class="widget-header">SEGUIMIENTO OCTUBRE</div>
                <div class="mini-calendar">
                  <div class="days-header"><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span></div>
                  <div class="days-grid">
                    <span class="empty"></span><span class="empty"></span><span class="empty"></span><span class="empty"></span>
                    <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span><span>10</span><span>11</span><span>12</span><span>13</span><span>14</span><span class="today">15</span><span>16</span><span>17</span><span>18</span><span>19</span><span>20</span><span>21</span><span>22</span><span>23</span><span>24</span><span>25</span><span>26</span><span>27</span><span>28</span><span>29</span><span class="selected-day">30</span><span>31</span>
                  </div>
                </div>
              </div>

              <div class="widget history-widget">
                <div class="widget-header"><span class="material-symbols-outlined">history</span> Historial de Entrega</div>
                <div class="timeline">
                  <div class="timeline-item">
                    <div class="dot active"></div>
                    <div class="t-content">
                      <p>Subido por Antonio Mancilla</p>
                      <span class="t-time">08:30 AM</span>
                    </div>
                  </div>
                  <div class="timeline-item">
                    <div class="dot"></div>
                    <div class="t-content">
                      <p>Correo de notificación enviado</p>
                      <span class="t-time">08:32 AM</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Visor PDF Dummy -->
            <div class="pdf-viewer-container">
              <div class="pdf-header">
                <div class="pdf-name"><span class="material-symbols-outlined">picture_as_pdf</span> bitacora_4_antonio.pdf</div>
                <div class="pdf-zoom">
                  <button><span class="material-symbols-outlined">search</span></button>
                  <span>100%</span>
                  <button><span class="material-symbols-outlined">zoom_in</span></button>
                </div>
              </div>
              <div class="pdf-mockup">
                <div class="pdf-page">
                  <div class="pdf-skeleton title"></div>
                  <div class="pdf-skeleton line"></div>
                  <div class="pdf-skeleton line short"></div>
                  <div class="pdf-skeleton block"></div>
                </div>
              </div>
            </div>

            <!-- Acciones Finales -->
            <footer class="revision-actions">
              <button class="btn-reject">
                <span class="material-symbols-outlined">close</span> Rechazar con observaciones
              </button>
              <button class="btn-approve">
                <span class="material-symbols-outlined">check_circle</span> Aprobar y Sumar Horas
              </button>
            </footer>
          </div>
        </section>
      </div>
    </div>
  </main>
</div>
</div>
</template>

<script setup>
import Sidebar from '@/components/layout/Sidebar.vue'
import Header from '@/components/layout/Header.vue'
import BtnBack from '@/layouts/btnBackLayout.vue'
import HeaderLayout from '@/layouts/headerViewsLayout.vue'
</script>

<style scoped>
.bitacoras-layout { display: flex; height: 100vh; background: #f4f7f6; overflow: hidden; }
.main-wrapper { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

/* Navbar */
.top-nav-bitacoras { height: 40px; background: white; display: flex; align-items: center; padding: 0 1rem; gap: 1rem; border-bottom: 1px solid #edf2f7; }
.nav-brand { display: flex; align-items: center; gap: 6px; min-width: 160px; }
.nav-brand h1 { font-size: 0.85rem; font-weight: 800; color: #1a202c; }
.icon-main { font-size: 1.1rem; color: var(--color_button, #2e7d32); }

.nav-search { flex: 1; position: relative; max-width: 400px; }
.nav-search .material-symbols-outlined { position: absolute; left: 8px; top: 50%; transform: translateY(-50%); font-size: 1rem; color: #a0aec0; }
.nav-search input { width: 100%; padding: 5px 10px 5px 30px; border-radius: 8px; border: none; background: #f1f5f9; font-size: 0.7rem; }

.nav-actions { display: flex; align-items: center; gap: 10px; }
.nav-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: none; border: 1px solid #e2e8f0; border-radius: 8px; color: #4a5568; cursor: pointer; transition: all 0.2s; }
.nav-btn:hover { background: #f8fafc; color: var(--color_button); border-color: var(--color_button); }
.nav-btn .material-symbols-outlined { font-size: 1.1rem; }
.user-avatar-mini { width: 26px; height: 26px; border-radius: 50%; background: #e2e8f0; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }

/* Layout Columns */
.content-columns { flex: 1; display: grid; grid-template-columns: 180px 240px 1fr; overflow: hidden; }

/* Scrollbar Style */
.column-fichas::-webkit-scrollbar,
.entregas-list::-webkit-scrollbar,
.column-revision::-webkit-scrollbar { width: 4px; }

/* Columna Fichas */
.column-fichas { background: #f8fafc; padding: 0.75rem 0.5rem; border-right: 1px solid #edf2f7; display: flex; flex-direction: column; gap: 0.75rem; overflow-y: auto; }
.btn-new-bitacora { width: 100%; padding: 8px; background: var(--color_button, #2e7d32); color: white; border: none; border-radius: 8px; font-weight: 800; font-size: 0.7rem; display: flex; align-items: center; justify-content: center; gap: 4px; cursor: pointer; box-shadow: 0 2px 6px rgba(46, 125, 50, 0.2); }

.fichas-section .section-title { font-size: 0.55rem; font-weight: 800; color: #718096; letter-spacing: 0.5px; display: flex; align-items: center; gap: 3px; margin-bottom: 0.5rem; }
.ficha-card { padding: 8px; background: white; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 0.4rem; cursor: pointer; transition: all 0.2s; }
.ficha-card:hover { border-color: var(--color_button); }
.ficha-card.active { border-color: var(--color_button); background: #f0fdf4; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
.ficha-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3px; }
.ficha-id { font-size: 0.6rem; font-weight: 800; color: #2e7d32; }
.badge-new { background: #c53030; color: white; font-size: 0.5rem; padding: 1px 4px; border-radius: 4px; font-weight: 800; }
.ficha-name { font-size: 0.7rem; font-weight: 700; color: #2d3748; }

/* Columna Entregas */
.column-entregas { background: #f1f5f9; border-right: 1px solid #edf2f7; display: flex; flex-direction: column; }
.entregas-header { padding: 0.75rem 0.5rem; }
.entregas-header h2 { font-size: 0.85rem; font-weight: 800; color: #1a202c; margin-bottom: 0.5rem; }
.filter-box { position: relative; }
.filter-box .material-symbols-outlined { position: absolute; left: 8px; top: 50%; transform: translateY(-50%); font-size: 1rem; color: #94a3b8; }
.filter-box input { width: 100%; padding: 5px 8px 5px 28px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 0.7rem; background: white; }

.entregas-list { flex: 1; overflow-y: auto; padding: 0 0.5rem 0.75rem; }
.entrega-item { background: white; padding: 8px; border-radius: 8px; margin-bottom: 0.4rem; border-left: 3px solid transparent; cursor: pointer; transition: all 0.2s; }
.entrega-item:hover { background: #f8fafc; }
.entrega-item.selected { border-left-color: var(--color_button); background: white; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
.entrega-info { display: flex; justify-content: space-between; font-size: 0.7rem; margin-bottom: 3px; }
.entrega-info strong { color: #2d3748; }
.entrega-info .time { font-size: 0.55rem; color: #a0aec0; font-weight: 700; }
.entrega-subject { font-size: 0.7rem; font-weight: 700; color: var(--color_button); margin-bottom: 2px; }
.entrega-preview { font-size: 0.6rem; color: #718096; line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

/* Columna Revisión */
.column-revision { background: white; overflow-y: auto; }
.revision-scroll { padding: 1rem; width: 100%; }

.revision-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; }
.user-profile { display: flex; align-items: center; gap: 12px; }
.avatar-large { width: 36px; height: 36px; background: #E6F4EA; color: #2e7d32; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.9rem; }
.profile-info h2 { font-size: 1.1rem; font-weight: 800; color: #1a202c; margin: 0; }
.profile-info p { color: #718096; font-size: 0.7rem; margin-top: 1px; }
.pills { display: flex; gap: 6px; margin-top: 6px; }
.pill { padding: 3px 8px; border-radius: 20px; font-size: 0.55rem; font-weight: 800; }
.pill.gray { background: #f1f5f9; color: #475569; }
.pill.green { background: #f0fdf4; color: #16a34a; }

.header-tools { display: flex; gap: 8px; }
.tool-btn { width: 30px; height: 30px; border: 1px solid #e2e8f0; border-radius: 8px; background: white; cursor: pointer; color: #4a5568; display: flex; align-items: center; justify-content: center; }
.tool-btn .material-symbols-outlined { font-size: 1.1rem; }

.revision-widgets { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
.widget { background: #f8fafc; border: 1px solid #edf2f7; border-radius: 12px; padding: 1rem; }
.widget-header { font-size: 0.65rem; font-weight: 800; color: #718096; margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px; }

/* Calendar Widget */
.days-header { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; font-size: 0.6rem; font-weight: 800; color: #a0aec0; margin-bottom: 6px; }
.days-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; text-align: center; }
.days-grid span { font-size: 0.65rem; font-weight: 600; padding: 3px 0; border-radius: 6px; }
.days-grid .today { background: var(--color_button); color: white; }
.days-grid .selected-day { background: #f0fdf4; color: var(--color_button); font-weight: 800; border: 1px solid #16a34a; }

/* History Widget */
.timeline { display: flex; flex-direction: column; gap: 0.75rem; }
.timeline-item { display: flex; gap: 12px; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: #e2e8f0; margin-top: 3px; }
.dot.active { background: #16a34a; box-shadow: 0 0 0 4px #f0fdf4; }
.t-content p { font-size: 0.75rem; font-weight: 700; color: #2d3748; margin: 0; }
.t-time { font-size: 0.65rem; color: #a0aec0; font-weight: 600; }

/* PDF Viewer */
.pdf-viewer-container { background: #1e1e1e; border-radius: 12px; overflow: hidden; margin-bottom: 1rem; }
.pdf-header { background: #2d2d2d; padding: 6px 1rem; display: flex; justify-content: space-between; align-items: center; color: white; }
.pdf-name { display: flex; align-items: center; gap: 6px; font-size: 0.65rem; font-weight: 600; }
.pdf-zoom { display: flex; align-items: center; gap: 8px; font-size: 0.6rem; }
.pdf-zoom button { background: none; border: none; color: #a0aec0; cursor: pointer; }

.pdf-mockup { background: #1e1e1e; padding: 1rem; min-height: 300px; display: flex; justify-content: center; }
.pdf-page { background: white; width: 100%; padding: 1.5rem; border-radius: 4px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
.pdf-skeleton { background: #f1f5f9; border-radius: 4px; margin-bottom: 6px; }
.pdf-skeleton.title { height: 12px; width: 40%; margin-bottom: 14px; }
.pdf-skeleton.line { height: 6px; width: 100%; }
.pdf-skeleton.short { width: 70%; }
.pdf-skeleton.block { height: 60px; width: 100%; margin-top: 14px; }

/* Revision Actions */
.revision-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #edf2f7; }
.btn-reject { padding: 10px; border-radius: 10px; border: 2px solid #c53030; color: #c53030; background: white; font-weight: 800; font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; }
.btn-approve { padding: 10px; border-radius: 10px; border: none; background: var(--color_button); color: white; font-weight: 800; font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; }
</style>
