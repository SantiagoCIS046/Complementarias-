<template>
  <div class="repfora-dashboard">
    <Sidebar />

    <div class="main-wrapper">
      <Header title="Gestión de Bitácoras & Seguimientos" />

      <main class="content">
        <div class="w-full space-y-2">

      <div class="content-columns">
        <!-- Columna 1: Fichas (Simplificada en esta vista de detalle) -->
        <aside class="column-fichas">
          <button class="btn-new-bitacora" @click="openWizardModal()">
            <span class="material-symbols-outlined">add</span> Nueva Bitácora
          </button>
          
          <button 
            class="btn-new-bitacora mt-2" 
            style="background-color: #2563eb !important; box-shadow: 0 2px 6px rgba(37, 99, 235, 0.2);"
            @click="openTrackingWizardModal()"
          >
            <span class="material-symbols-outlined">assignment_turned_in</span> Registrar Visita
          </button>
          
          <div class="fichas-section mt-4">
            <h3 class="section-title">
              <span class="material-symbols-outlined">person</span> APRENDIZ SELECCIONADO
            </h3>
            
            <div class="ficha-card active">
              <div class="ficha-header">
                <span class="ficha-id">Ficha {{ ficha }}</span>
              </div>
              <p class="ficha-name">{{ apprenticeName }}</p>
            </div>
          </div>
        </aside>

        <!-- Columna 2: Entregas -->
        <section class="column-entregas">
          <div class="tab-toggle-container" style="display: flex; border-bottom: 1px solid var(--border-primary); margin-bottom: 8px;">
            <button 
              class="tab-btn" 
              :class="{ active: activeTab === 'bitacoras' }"
              @click="activeTab = 'bitacoras'"
              style="flex: 1; padding: 10px; font-size: 0.72rem; font-weight: 800; border: none; background: none; cursor: pointer; transition: all 0.2s; color: activeTab === 'bitacoras' ? 'var(--color_button)' : 'var(--text-muted)';"
              :style="activeTab === 'bitacoras' ? 'border-bottom: 2px solid var(--color_button)' : ''"
            >
              Bitácoras ({{ bitacoras.length }})
            </button>
            <button 
              class="tab-btn" 
              :class="{ active: activeTab === 'seguimientos' }"
              @click="activeTab = 'seguimientos'"
              style="flex: 1; padding: 10px; font-size: 0.72rem; font-weight: 800; border: none; background: none; cursor: pointer; transition: all 0.2s; color: activeTab === 'seguimientos' ? 'var(--color_button)' : 'var(--text-muted)';"
              :style="activeTab === 'seguimientos' ? 'border-bottom: 2px solid var(--color_button)' : ''"
            >
              Seguimientos ({{ trackings.length }}/{{ cupo.maxSeguimientos }})
            </button>
          </div>

          <!-- RENDER LIST BITACORAS -->
          <div v-if="activeTab === 'bitacoras'" class="entregas-list">
            <div v-for="bit in bitacoras" :key="bit._id" 
                 class="entrega-item" 
                 :class="{ selected: selectedBitacora?._id === bit._id }"
                 @click="selectBitacora(bit)">
              <div class="entrega-info">
                <strong>{{ apprenticeName }}</strong>
                <span class="time">{{ formatDate(bit.createdAt) }}</span>
              </div>
              <p class="entrega-subject">Bitácora Semana {{ bit.semana }}</p>
              <p class="entrega-preview" :class="bit.estado.toLowerCase()">Estado: {{ bit.estado }}</p>
            </div>
            
            <div v-if="bitacoras.length === 0 && !isLoading" class="p-8 text-center text-gray-400 italic text-xs">
              No hay bitácoras registradas para esta etapa.
            </div>
          </div>

          <!-- RENDER LIST SEGUIMIENTOS -->
          <div v-else-if="activeTab === 'seguimientos'" class="entregas-list">
            <div v-for="track in trackings" :key="track._id" 
                 class="entrega-item" 
                 :class="{ selected: selectedTracking?._id === track._id }"
                 @click="selectedTracking = track"
                 style="border-left-color: #2563eb;">
              <div class="entrega-info">
                <strong>Visita #{{ track.numeroVisita }}</strong>
                <span class="time">{{ formatDate(track.fechaVisita) }}</span>
              </div>
              <p class="entrega-subject" style="color: #2563eb;">{{ track.lugarVisita || 'Presencial' }}</p>
              <p class="entrega-preview font-bold" :class="track.calificacion ? track.calificacion.toLowerCase() : 'pendiente'">
                Calificación: {{ track.calificacion || 'Sin calificar' }}
              </p>
            </div>
            
            <div v-if="trackings.length === 0" class="p-8 text-center text-gray-400 italic text-xs">
              No hay visitas de seguimiento registradas.
            </div>
          </div>
        </section>

        <!-- Columna 3: Detalle / Revisión -->
        <section class="column-revision">
          <div class="revision-scroll">
            
            <!-- A. RENDER TAB BITACORAS -->
            <div v-if="activeTab === 'bitacoras'">
              <div class="instructor-checklist-container">
                <div class="instructor-checklist-header">
                  <div style="display:flex; align-items:center; gap:8px">
                    <span class="material-symbols-outlined icon-checklist-mini">playlist_add_check</span>
                    <h3>Avance Quincenal del Aprendiz</h3>
                  </div>
                  <div class="summary-stats">
                    <span class="stat-badge">Entregas: <strong>{{ bitacoras.length }} / 12</strong></span>
                    <span class="stat-badge approved">Aprobadas: <strong>{{ bitacoras.filter(b => b.estado === 'APROBADA').length }}</strong></span>
                  </div>
                </div>
                <div v-if="isLoading" class="instructor-checklist-grid">
                  <div v-for="i in 12" :key="i" class="instructor-checklist-card skel-anim" style="height:36px; border-radius:8px"></div>
                </div>
                <div v-else class="instructor-checklist-grid">
                  <div 
                    v-for="item in checklist" 
                    :key="item.semana" 
                    class="instructor-checklist-card"
                    :class="[item.estado.toLowerCase(), { 'is-active': selectedBitacora?._id === item.bitacora?._id, 'is-clickable': item.cargado }]"
                    @click="item.cargado && selectBitacora(item.bitacora)"
                    :title="item.cargado ? `Bitácora ${item.semana}: ${item.estado}. Clic para ver.` : `Bitácora ${item.semana}: No Cargado`"
                  >
                    <span class="week-num-badge">Q{{ item.semana }}</span>
                    <span class="material-symbols-outlined mini-icon">
                      {{ 
                        item.estado === 'APROBADA' ? 'check' : 
                        item.estado === 'PENDIENTE' ? 'schedule' : 
                        item.estado === 'RECHAZADA' ? 'close' : 'remove' 
                      }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- DETALLE DE BITÁCORA SELECCIONADA -->
              <div v-if="selectedBitacora" class="mt-4">
                <header class="revision-header">
                  <div class="user-profile">
                    <div class="avatar-large">{{ getInitials(apprenticeName) }}</div>
                    <div class="profile-info">
                      <h2>{{ apprenticeName }}</h2>
                      <p>Ficha {{ ficha }}</p>
                      <div class="pills">
                        <span class="pill gray">ETAPA PRODUCTIVA</span>
                        <span class="pill green">SEMANA {{ selectedBitacora.semana }}</span>
                      </div>
                    </div>
                  </div>
                </header>

                <div class="revision-widgets">
                  <div class="widget">
                    <div class="widget-header">INFORMACIÓN DE ENTREGA</div>
                    <div class="space-y-2">
                      <p class="text-xs"><strong>Horas Reportadas:</strong> {{ selectedBitacora.horasReportadas }}h</p>
                      <p class="text-xs"><strong>Descripción:</strong></p>
                      <p class="text-[11px] text-gray-600 bg-white p-2 rounded border">{{ selectedBitacora.descripcion }}</p>
                    </div>
                  </div>

                  <div class="widget">
                    <div class="widget-header">OBSERVACIONES DEL INSTRUCTOR</div>
                    <textarea v-model="observaciones" 
                              class="w-full text-xs p-2 rounded border focus:border-green-600 outline-none" 
                              rows="4" 
                              placeholder="Escriba aquí sus observaciones..."></textarea>
                  </div>
                </div>

                <!-- Visor PDF / Evidencias -->
                <div class="evidencias-container mb-6">
                   <h3 class="text-xs font-bold mb-2">Evidencias Adjuntas</h3>
                   <div v-if="selectedBitacora.evidencias?.length > 0" class="grid grid-cols-1 gap-2">
                     <div v-for="(ev, idx) in selectedBitacora.evidencias" :key="idx" 
                        class="pdf-access-box">
                        <div class="pdf-info-group">
                          <div class="pdf-icon-wrapper">
                            <span class="material-symbols-outlined icon-pdf">picture_as_pdf</span>
                          </div>
                          <div class="pdf-info">
                            <h4>{{ ev.nombre || 'Evidencia ' + (idx + 1) }}</h4>
                            <p>Documento adjunto para revisión</p>
                          </div>
                        </div>
                        <a :href="ev.url" target="_blank" class="btn-view-pdf">
                          Ver Documento
                        </a>
                     </div>
                   </div>
                   <p v-else class="text-xs text-gray-400 italic">No se adjuntaron archivos.</p>
                </div>

                <!-- Acciones Finales -->
                <footer v-if="selectedBitacora.estado === 'PENDIENTE'" class="revision-actions">
                  <button class="btn-reject" @click="handleReview('RECHAZADA')" :disabled="isSaving">
                    <span class="material-symbols-outlined">close</span> Rechazar
                  </button>
                  <button class="btn-approve" @click="handleReview('APROBADA')" :disabled="isSaving">
                    <span class="material-symbols-outlined">check_circle</span> Aprobar
                  </button>
                </footer>
                <div v-else class="p-4 bg-gray-50 rounded-xl border text-center">
                   <p class="text-xs font-bold" :class="selectedBitacora.estado === 'APROBADA' ? 'text-green-600' : 'text-red-600'">
                     ESTA BITÁCORA YA FUE {{ selectedBitacora.estado }}
                   </p>
                   <p v-if="selectedBitacora.observacionesInstructor" class="text-[10px] text-gray-500 mt-1 italic">
                     "{{ selectedBitacora.observacionesInstructor }}"
                   </p>
                </div>
              </div>
              
              <div v-else class="h-[250px] flex flex-col items-center justify-center text-gray-400 p-8 mt-4 border border-dashed rounded-xl bg-gray-50">
                 <span class="material-symbols-outlined text-4xl mb-2">description</span>
                 <p class="font-bold text-xs text-center">Seleccione una bitácora en la lista izquierda o en el checklist para comenzar la revisión</p>
              </div>
            </div>

            <!-- B. RENDER TAB SEGUIMIENTOS -->
            <div v-else-if="activeTab === 'seguimientos'">
              <div v-if="selectedTracking" class="mt-4">
                <header class="revision-header">
                  <div class="user-profile">
                    <div class="avatar-large" style="background: #eff6ff; color: #2563eb;">
                      <span class="material-symbols-outlined">assignment_turned_in</span>
                    </div>
                    <div class="profile-info">
                      <h2>Seguimiento Técnico #{{ selectedTracking.numeroVisita }}</h2>
                      <p>Ficha {{ ficha }} | Nivel: <strong>{{ cupo.nivelFormacion }}</strong></p>
                      <div class="pills">
                        <span class="pill gray">VISITA DE SEGUIMIENTO</span>
                        <span class="pill" style="background: #eff6ff; color: #2563eb;">
                          {{ selectedTracking.calificacion || 'PENDIENTE' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </header>

                <div class="revision-widgets">
                  <div class="widget">
                    <div class="widget-header">DETALLES DE LA VISITA</div>
                    <div class="space-y-2">
                      <p class="text-xs"><strong>Fecha de Visita:</strong> {{ new Date(selectedTracking.fechaVisita).toLocaleDateString() }}</p>
                      <p class="text-xs"><strong>Lugar de Visita:</strong> {{ selectedTracking.lugarVisita || 'N/A' }}</p>
                      <p class="text-xs"><strong>Calificación:</strong> {{ selectedTracking.calificacion || 'Sin Calificación' }}</p>
                      <p class="text-xs"><strong>Tamaño de Acta PDF:</strong> {{ (selectedTracking.evidenciaSize / (1024 * 1024)).toFixed(2) }} MB</p>
                    </div>
                  </div>

                  <div class="widget">
                    <div class="widget-header">COMPROMISOS ADQUIRIDOS</div>
                    <p class="text-[11px] text-gray-600 bg-white p-2 rounded border" style="min-height: 80px;">
                      {{ selectedTracking.compromisos || 'Ningún compromiso registrado.' }}
                    </p>
                  </div>
                </div>

                <!-- Observaciones -->
                <div class="widget mb-4">
                  <div class="widget-header">OBSERVACIONES DEL INSTRUCTOR</div>
                  <p class="text-[11px] text-gray-600 bg-white p-2 rounded border">
                    {{ selectedTracking.observaciones }}
                  </p>
                </div>

                <!-- Visor / Acceso PDF de Visita -->
                <div class="evidencias-container mb-4">
                   <h3 class="text-xs font-bold mb-2">Acta de Visita en PDF</h3>
                   <div class="pdf-access-box" style="border-color: #bae6fd;">
                      <div class="pdf-info-group">
                        <div class="pdf-icon-wrapper" style="background: rgba(37, 99, 235, 0.1); color: #2563eb;">
                          <span class="material-symbols-outlined">picture_as_pdf</span>
                        </div>
                        <div class="pdf-info">
                          <h4>acta_seguimiento_visita_{{ selectedTracking.numeroVisita }}.pdf</h4>
                          <p>Soporte oficial firmado y validado por IA</p>
                        </div>
                      </div>
                      <a :href="selectedTracking.evidenciaUrl" target="_blank" class="btn-view-pdf" style="color: #2563eb; border-color: #2563eb;">
                        Descargar Acta
                      </a>
                   </div>
                </div>

                <!-- Tarjeta de firmas IA -->
                <div v-if="selectedTracking.isValidatedByIA && selectedTracking.signaturesValidated" class="widget mb-6" style="background: rgba(34, 197, 94, 0.04); border-color: #bae6fd;">
                  <div class="widget-header" style="color: #16a34a;">
                    <span class="material-symbols-outlined" style="font-size: 1.1rem; color: #16a34a;">verified</span>
                    FIRMAS DETECTADAS POR IA (VERIFICACIÓN EXITOSA)
                  </div>
                  <div class="signatures-list" style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
                    <div v-for="(sig, key) in selectedTracking.signaturesValidated" :key="key" 
                         style="display: flex; justify-content: space-between; align-items: center; background: white; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border-primary);">
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="material-symbols-outlined" style="font-size: 1.1rem; color: var(--text-muted);">
                          {{ key === 'aprendiz' ? 'signature' : key === 'instructor' ? 'shield_person' : 'apartment' }}
                        </span>
                        <span style="font-size: 0.72rem; font-weight: 700; text-transform: capitalize; color: var(--text-primary);">
                          Firma {{ key === 'jefeInmediate' || key === 'jefeInmediato' ? 'Jefe Inmediato (Empresa)' : key }}
                        </span>
                      </div>
                      <span style="background: rgba(34, 197, 94, 0.1); color: #16a34a; font-size: 0.6rem; font-weight: 800; padding: 2px 6px; border-radius: 20px; display: flex; align-items: center; gap: 2px;">
                        <span class="material-symbols-outlined" style="font-size: 0.7rem;">check</span> {{ Math.round(sig.confidence * 100) }}% Confianza
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="h-[250px] flex flex-col items-center justify-center text-gray-400 p-8 mt-4 border border-dashed rounded-xl bg-gray-50">
                 <span class="material-symbols-outlined text-4xl mb-2">assignment_turned_in</span>
                 <p class="font-bold text-xs text-center">Seleccione una visita de seguimiento en la lista izquierda para ver su reporte detallado</p>
              </div>
            </div>

          </div>
        </section>
      </div>
      </div>
      </main>
    </div>

  <!-- ═══════ MODAL: Nueva Bitácora (Asistente de 3 pasos con validación de firmas por IA) ═══════ -->
  <div class="modal-overlay" v-if="showNewBitacoraModal" @click.self="showNewBitacoraModal = false">
    <div class="modal-card modal-md">
      <div class="modal-head">
        <div class="head-info">
          <h2>Nueva Bitácora</h2>
          <p class="u-email">Asistente de entrega — Paso {{ currentStep }} de 3</p>
        </div>
        <button class="modal-close" @click="showNewBitacoraModal = false">&times;</button>
      </div>
      <div class="modal-body">
        <!-- Paso 1: Ficha y Detalles, Paso 2: Archivo, Paso 3: Validación IA -->
        <div class="wizard-steps mb-6" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-primary); padding-bottom: 16px;">
          <div class="wizard-step" style="display: flex; align-items: center; gap: 6px; font-size: 0.75rem; font-weight: 700; transition: all 0.2s;" :style="{ color: currentStep === 1 ? 'var(--color_button)' : 'var(--text-muted)' }">
            <span class="step-num" style="width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; transition: all 0.2s;" :style="{ background: currentStep >= 1 ? 'var(--color_button)' : 'var(--bg-hover)', color: currentStep >= 1 ? 'white' : 'var(--text-muted)' }">1</span>
            Detalles
          </div>
          <div style="flex-grow: 1; height: 2px; transition: all 0.2s; margin: 0 10px;" :style="{ background: currentStep > 1 ? 'var(--color_button)' : 'var(--border-primary)' }"></div>
          <div class="wizard-step" style="display: flex; align-items: center; gap: 6px; font-size: 0.75rem; font-weight: 700; transition: all 0.2s;" :style="{ color: currentStep === 2 ? 'var(--color_button)' : 'var(--text-muted)' }">
            <span class="step-num" style="width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; transition: all 0.2s;" :style="{ background: currentStep >= 2 ? 'var(--color_button)' : 'var(--bg-hover)', color: currentStep >= 2 ? 'white' : 'var(--text-muted)' }">2</span>
            Carga PDF
          </div>
          <div style="flex-grow: 1; height: 2px; transition: all 0.2s; margin: 0 10px;" :style="{ background: currentStep > 2 ? 'var(--color_button)' : 'var(--border-primary)' }"></div>
          <div class="wizard-step" style="display: flex; align-items: center; gap: 6px; font-size: 0.75rem; font-weight: 700; transition: all 0.2s;" :style="{ color: currentStep === 3 ? 'var(--color_button)' : 'var(--text-muted)' }">
            <span class="step-num" style="width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; transition: all 0.2s;" :style="{ background: currentStep >= 3 ? 'var(--color_button)' : 'var(--bg-hover)', color: currentStep >= 3 ? 'white' : 'var(--text-muted)' }">3</span>
            Validación IA
          </div>
        </div>

        <!-- Paso 1: Detalles -->
        <div v-if="currentStep === 1" class="space-y-4" style="display: flex; flex-direction: column; gap: 14px;">
          <div class="form-group-premium">
            <label class="label-premium">Semana de Formación</label>
            <input type="number" v-model="newBitacoraForm.semana" class="input-premium" min="1" max="24" />
          </div>
          <div class="form-group-premium">
            <label class="label-premium">Horas a Reportar en la Semana</label>
            <input type="number" v-model="newBitacoraForm.horasReportadas" class="input-premium" min="1" max="120" />
          </div>
          <div class="form-group-premium">
            <label class="label-premium">Descripción de Actividades Realizadas</label>
            <textarea v-model="newBitacoraForm.descripcion" class="input-premium" rows="4" placeholder="Ej: Elaboración de diagramas UML, codificación de controladores y pruebas unitarias de integración..." style="resize: none; width: 100%; box-sizing: border-box;"></textarea>
          </div>
        </div>

        <!-- Paso 2: Carga PDF -->
        <div v-if="currentStep === 2" class="space-y-4">
          <div 
            class="drag-drop-zone"
            @dragover.prevent
            @drop.prevent="handleFileDrop"
            @click="triggerFileSelect"
            style="border: 2px dashed var(--border-primary); border-radius: 12px; padding: 40px 20px; text-align: center; cursor: pointer; background: var(--bg-secondary); transition: all 0.2s;"
            onmouseover="this.style.borderColor='var(--color_button)'; this.style.background='var(--bg-hover)';"
            onmouseout="this.style.borderColor='var(--border-primary)'; this.style.background='var(--bg-secondary)';"
          >
            <span class="material-symbols-outlined" style="font-size: 3.5rem; color: var(--color_button); opacity: 0.8; margin-bottom: 12px;">upload_file</span>
            <h3 style="font-size: 0.85rem; font-weight: 800; color: var(--text-primary); margin: 0 0 6px 0;">Arrastre su Bitácora PDF aquí</h3>
            <p style="font-size: 0.7rem; color: var(--text-muted); margin: 0 0 16px 0;">O haga clic para explorar en sus archivos locales (Máx. 5MB)</p>
            <span class="btn-primary-sena" style="padding: 6px 14px; font-size: 0.7rem; display: inline-block;">Seleccionar Archivo</span>
            <input type="file" id="bitacora-file-input" class="hidden" accept="application/pdf" style="display: none;" @change="handleFileChange" />
          </div>
        </div>

        <!-- Paso 3: Validación IA -->
        <div v-if="currentStep === 3" class="space-y-4" style="display: flex; flex-direction: column; gap: 14px;">
          <!-- Estado: Escaneando firmas -->
          <div v-if="isScanning" style="text-align: center; padding: 30px 10px;">
            <div class="spin-ring-lg" style="margin: 0 auto 16px; width: 48px; height: 48px; border: 4px solid var(--bg-hover); border-top-color: var(--color_button); border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <h3 style="font-size: 0.85rem; font-weight: 800; color: var(--text-primary); margin: 0 0 6px 0;">Procesando documento con IA...</h3>
            <p style="font-size: 0.7rem; color: var(--text-muted); margin: 0;">Escaneando firmas obligatorias y metadatos del PDF.</p>
          </div>

          <!-- Estado: Error de Escaneo -->
          <div v-else-if="scanError" style="background: rgba(239, 68, 68, 0.08); border-left: 4px solid #ef4444; padding: 16px; border-radius: 6px;">
            <div style="display: flex; gap: 12px; align-items: flex-start;">
              <span class="material-symbols-outlined" style="color: #ef4444; font-size: 1.6rem;">error</span>
              <div>
                <h4 style="color: #b91c1c; font-size: 0.8rem; font-weight: 800; margin: 0 0 4px 0;">⚠ Error de Validación</h4>
                <p style="color: #ef4444; font-size: 0.72rem; margin: 0; line-height: 1.4;">{{ scanError }}</p>
              </div>
            </div>
          </div>

          <!-- Estado: Escaneado con Éxito (Muestra las firmas) -->
          <div v-else-if="scanResult" class="space-y-4" style="display: flex; flex-direction: column; gap: 12px;">
            <h3 style="font-size: 0.8rem; font-weight: 800; color: var(--text-secondary); border-bottom: 1px solid var(--border-primary); padding-bottom: 6px; margin: 0;">Firmas Requeridas Registradas</h3>
            
            <div class="signatures-list" style="display: flex; flex-direction: column; gap: 10px;">
              <!-- Firma 1: Aprendiz -->
              <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: 10px 14px; border-radius: 8px; border: 1px solid var(--border-primary);">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span class="material-symbols-outlined" style="color: var(--text-muted); font-size: 1.3rem;">signature</span>
                  <div style="display: flex; flex-direction: column;">
                    <span style="font-size: 0.78rem; font-weight: 800; color: var(--text-primary);">Firma del Aprendiz</span>
                    <span style="font-size: 0.65rem; color: var(--text-muted);">{{ apprenticeName }}</span>
                  </div>
                </div>
                <span v-if="scanResult.signatures?.aprendiz?.detected" style="background: rgba(34, 197, 94, 0.1); color: #16a34a; font-size: 0.65rem; font-weight: 800; padding: 4px 8px; border-radius: 20px; display: flex; align-items: center; gap: 4px;">
                  <span class="material-symbols-outlined" style="font-size: 0.8rem;">check</span> Detectada ({{ Math.round(scanResult.signatures.aprendiz.confidence * 100) }}%)
                </span>
                <span v-else style="background: rgba(239, 68, 68, 0.1); color: #ef4444; font-size: 0.65rem; font-weight: 800; padding: 4px 8px; border-radius: 20px; display: flex; align-items: center; gap: 4px;">
                  <span class="material-symbols-outlined" style="font-size: 0.8rem;">close</span> Faltante
                </span>
              </div>

              <!-- Firma 2: Instructor -->
              <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: 10px 14px; border-radius: 8px; border: 1px solid var(--border-primary);">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span class="material-symbols-outlined" style="color: var(--text-muted); font-size: 1.3rem;">shield_person</span>
                  <div style="display: flex; flex-direction: column;">
                    <span style="font-size: 0.78rem; font-weight: 800; color: var(--text-primary);">Firma del Instructor</span>
                    <span style="font-size: 0.65rem; color: var(--text-muted);">Seguimiento SENA</span>
                  </div>
                </div>
                <span v-if="scanResult.signatures?.instructor?.detected" style="background: rgba(34, 197, 94, 0.1); color: #16a34a; font-size: 0.65rem; font-weight: 800; padding: 4px 8px; border-radius: 20px; display: flex; align-items: center; gap: 4px;">
                  <span class="material-symbols-outlined" style="font-size: 0.8rem;">check</span> Detectada ({{ Math.round(scanResult.signatures.instructor.confidence * 100) }}%)
                </span>
                <span v-else style="background: rgba(239, 68, 68, 0.1); color: #ef4444; font-size: 0.65rem; font-weight: 800; padding: 4px 8px; border-radius: 20px; display: flex; align-items: center; gap: 4px;">
                  <span class="material-symbols-outlined" style="font-size: 0.8rem;">close</span> Faltante
                </span>
              </div>

              <!-- Firma 3: Jefe Inmediato -->
              <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: 10px 14px; border-radius: 8px; border: 1px solid var(--border-primary);">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span class="material-symbols-outlined" style="color: var(--text-muted); font-size: 1.3rem;">apartment</span>
                  <div style="display: flex; flex-direction: column;">
                    <span style="font-size: 0.78rem; font-weight: 800; color: var(--text-primary);">Firma del Jefe Inmediato (Empresa)</span>
                    <span style="font-size: 0.65rem; color: var(--text-muted);">Supervisor Co-formador</span>
                  </div>
                </div>
                <span v-if="scanResult.signatures?.jefeInmediato?.detected" style="background: rgba(34, 197, 94, 0.1); color: #16a34a; font-size: 0.65rem; font-weight: 800; padding: 4px 8px; border-radius: 20px; display: flex; align-items: center; gap: 4px;">
                  <span class="material-symbols-outlined" style="font-size: 0.8rem;">check</span> Detectada ({{ Math.round(scanResult.signatures.jefeInmediato.confidence * 100) }}%)
                </span>
                <span v-else style="background: rgba(239, 68, 68, 0.1); color: #ef4444; font-size: 0.65rem; font-weight: 800; padding: 4px 8px; border-radius: 20px; display: flex; align-items: center; gap: 4px;">
                  <span class="material-symbols-outlined" style="font-size: 0.8rem;">close</span> Faltante
                </span>
              </div>
            </div>

            <!-- Veredicto Final -->
            <div v-if="scanResult.valid" style="background: rgba(34, 197, 94, 0.08); border-left: 4px solid #16a34a; padding: 12px; border-radius: 6px; display: flex; gap: 10px; align-items: center; margin-top: 16px;">
              <span class="material-symbols-outlined" style="color: #16a34a; font-size: 1.4rem;">check_circle</span>
              <p style="color: #14532d; font-size: 0.72rem; font-weight: 700; margin: 0; line-height: 1.4;">{{ scanResult.message }}</p>
            </div>
            <div v-else style="background: rgba(239, 68, 68, 0.08); border-left: 4px solid #ef4444; padding: 12px; border-radius: 6px; display: flex; gap: 10px; align-items: center; margin-top: 16px;">
              <span class="material-symbols-outlined" style="color: #ef4444; font-size: 1.4rem;">warning</span>
              <p style="color: #7f1d1d; font-size: 0.72rem; font-weight: 700; margin: 0; line-height: 1.4;">{{ scanResult.message }}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer footer-premium">
        <!-- Paso 1 botones -->
        <template v-if="currentStep === 1">
          <button class="btn-cancel-premium" @click="showNewBitacoraModal = false">Cancelar</button>
          <button class="btn-confirm-premium" :disabled="!newBitacoraForm.semana || !newBitacoraForm.horasReportadas" @click="currentStep = 2">Siguiente</button>
        </template>
        <!-- Paso 2 botones -->
        <template v-else-if="currentStep === 2">
          <button class="btn-cancel-premium" @click="currentStep = 1">Atrás</button>
          <button class="btn-confirm-premium" :disabled="!selectedFile" @click="currentStep = 3">Siguiente</button>
        </template>
        <!-- Paso 3 botones -->
        <template v-else-if="currentStep === 3">
          <button class="btn-cancel-premium" :disabled="isScanning" @click="currentStep = 2">Volver a Cargar</button>
          <button class="btn-confirm-premium" :disabled="isScanning || !scanResult?.valid" @click="submitNewBitacora">Confirmar y Subir</button>
        </template>
      </div>
    </div>
  </div>

  <!-- ═══════ MODAL: Nuevo Seguimiento (Asistente de 3 pasos con validación de firmas por IA) ═══════ -->
  <div class="modal-overlay" v-if="showNewTrackingModal" @click.self="showNewTrackingModal = false">
    <div class="modal-card modal-md">
      <div class="modal-head">
        <div class="head-info">
          <h2>Registrar Visita de Seguimiento</h2>
          <p class="u-email">Asistente de seguimiento — Paso {{ trackingStep }} de 3</p>
        </div>
        <button class="modal-close" @click="showNewTrackingModal = false">&times;</button>
      </div>
      <div class="modal-body">
        
        <div class="wizard-steps mb-6" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-primary); padding-bottom: 16px;">
          <div class="wizard-step" style="display: flex; align-items: center; gap: 6px; font-size: 0.75rem; font-weight: 700; transition: all 0.2s;" :style="{ color: trackingStep === 1 ? '#2563eb' : 'var(--text-muted)' }">
            <span class="step-num" style="width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; transition: all 0.2s;" :style="{ background: trackingStep >= 1 ? '#2563eb' : 'var(--bg-hover)', color: trackingStep >= 1 ? 'white' : 'var(--text-muted)' }">1</span>
            Detalles
          </div>
          <div style="flex-grow: 1; height: 2px; transition: all 0.2s; margin: 0 10px;" :style="{ background: trackingStep > 1 ? '#2563eb' : 'var(--border-primary)' }"></div>
          <div class="wizard-step" style="display: flex; align-items: center; gap: 6px; font-size: 0.75rem; font-weight: 700; transition: all 0.2s;" :style="{ color: trackingStep === 2 ? '#2563eb' : 'var(--text-muted)' }">
            <span class="step-num" style="width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; transition: all 0.2s;" :style="{ background: trackingStep >= 2 ? '#2563eb' : 'var(--bg-hover)', color: trackingStep >= 2 ? 'white' : 'var(--text-muted)' }">2</span>
            Carga PDF
          </div>
          <div style="flex-grow: 1; height: 2px; transition: all 0.2s; margin: 0 10px;" :style="{ background: trackingStep > 2 ? '#2563eb' : 'var(--border-primary)' }"></div>
          <div class="wizard-step" style="display: flex; align-items: center; gap: 6px; font-size: 0.75rem; font-weight: 700; transition: all 0.2s;" :style="{ color: trackingStep === 3 ? '#2563eb' : 'var(--text-muted)' }">
            <span class="step-num" style="width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; transition: all 0.2s;" :style="{ background: trackingStep >= 3 ? '#2563eb' : 'var(--bg-hover)', color: trackingStep >= 3 ? 'white' : 'var(--text-muted)' }">3</span>
            Validación IA
          </div>
        </div>

        <!-- Paso 1: Detalles -->
        <div v-if="trackingStep === 1" class="space-y-4" style="display: flex; flex-direction: column; gap: 14px;">
          <div class="form-group-premium" style="margin-bottom: 4px;">
            <div style="display: flex; align-items: center; gap: 8px; background: var(--bg-hover); padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border-primary);">
              <input type="checkbox" id="es-extraordinario-checkbox" v-model="newTrackingForm.esExtraordinario" style="width: 15px; height: 15px; cursor: pointer;" />
              <label for="es-extraordinario-checkbox" class="label-premium" style="margin-bottom: 0; cursor: pointer; font-size: 0.72rem; font-weight: 800; color: var(--text-primary);">¿Es un Seguimiento Extraordinario / Especial?</label>
            </div>
            
            <div v-if="newTrackingForm.esExtraordinario" style="margin-top: 8px;">
              <div v-if="!cupo.extraordinaryTrackingAuthorized" style="background: rgba(239, 68, 68, 0.08); border-left: 4px solid #ef4444; padding: 12px; border-radius: 8px; display: flex; flex-direction: column; gap: 6px;">
                <div style="display: flex; gap: 6px; align-items: center;">
                  <span class="material-symbols-outlined" style="color: #ef4444; font-size: 1.2rem;">warning</span>
                  <p style="color: #7f1d1d; font-size: 0.72rem; font-weight: 700; margin: 0; line-height: 1.4;">
                    Requiere autorización previa del Administrador.
                  </p>
                </div>
                <div v-if="currentUser.role === 'ADMIN'" style="display: flex; justify-content: flex-end;">
                  <button @click="authorizeStageNow" class="btn-primary-sena" style="padding: 4px 10px; font-size: 0.65rem; background-color: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; display: inline-flex; align-items: center; gap: 4px;">
                    <span class="material-symbols-outlined" style="font-size: 0.8rem;">verified</span> Autorizar Ahora
                  </button>
                </div>
              </div>
              <div v-else style="background: rgba(34, 197, 94, 0.08); border-left: 4px solid #16a34a; padding: 12px; border-radius: 8px; display: flex; align-items: center; gap: 8px;">
                <span class="material-symbols-outlined" style="color: #16a34a; font-size: 1.2rem;">check_circle</span>
                <p style="color: #14532d; font-size: 0.72rem; font-weight: 700; margin: 0; line-height: 1.4;">
                  Autorización de Administrador Activada.
                </p>
              </div>
            </div>
          </div>

          <div class="form-group-premium">
            <label class="label-premium">Número de Visita</label>
            <input type="number" v-model="newTrackingForm.numeroVisita" class="input-premium" min="1" />
            <p class="text-[10px] text-gray-500 mt-1">El cupo máximo de seguimientos estándar es de {{ cupo.maxSeguimientos }} visitas.</p>
          </div>
          <div class="form-group-premium">
            <label class="label-premium">Fecha de Visita</label>
            <input type="date" v-model="newTrackingForm.fechaVisita" class="input-premium" />
          </div>
          <div class="form-group-premium">
            <label class="label-premium">Lugar de Visita / Modalidad</label>
            <input type="text" v-model="newTrackingForm.lugarVisita" class="input-premium" placeholder="Ej: Presencial en Empresa Co-formadora, Virtual Teams..." />
          </div>
          <div class="form-group-premium">
            <label class="label-premium">Calificación del Aprendiz</label>
            <select v-model="newTrackingForm.calificacion" class="select-premium">
              <option value="EXCELENTE">Excelente</option>
              <option value="BUENO">Bueno</option>
              <option value="ACEPTABLE">Aceptable</option>
              <option value="DEFICIENTE">Deficiente</option>
            </select>
          </div>
          <div class="form-group-premium">
            <label class="label-premium">Observaciones Generales</label>
            <textarea v-model="newTrackingForm.observaciones" class="input-premium" rows="3" placeholder="Registre aquí el progreso técnico, comportamental y novedades..." style="resize: none; width: 100%; box-sizing: border-box;"></textarea>
          </div>
          <div class="form-group-premium">
            <label class="label-premium">Compromisos Adquiridos</label>
            <textarea v-model="newTrackingForm.compromisos" class="input-premium" rows="2" placeholder="Ej: Aprendiz se compromete a entregar bitácoras faltantes antes del 30 de mayo..." style="resize: none; width: 100%; box-sizing: border-box;"></textarea>
          </div>
        </div>

        <!-- Paso 2: Carga PDF -->
        <div v-if="trackingStep === 2" class="space-y-4">
          <div 
            class="drag-drop-zone"
            @dragover.prevent
            @drop.prevent="handleTrackingFileDrop"
            @click="triggerTrackingFileSelect"
            style="border: 2px dashed #bae6fd; border-radius: 12px; padding: 40px 20px; text-align: center; cursor: pointer; background: var(--bg-secondary); transition: all 0.2s;"
            onmouseover="this.style.borderColor='#2563eb'; this.style.background='var(--bg-hover)';"
            onmouseout="this.style.borderColor='#bae6fd'; this.style.background='var(--bg-secondary)';"
          >
            <span class="material-symbols-outlined" style="font-size: 3.5rem; color: #2563eb; opacity: 0.8; margin-bottom: 12px;">upload_file</span>
            <h3 style="font-size: 0.85rem; font-weight: 800; color: var(--text-primary); margin: 0 0 6px 0;">Arrastre su Acta de Seguimiento PDF aquí</h3>
            <p style="font-size: 0.7rem; color: var(--text-muted); margin: 0 0 16px 0;">O haga clic para explorar en sus archivos locales (Máx. 7MB)</p>
            <span class="btn-primary-sena" style="padding: 6px 14px; font-size: 0.7rem; display: inline-block; background-color: #2563eb;">Seleccionar Archivo</span>
            <input type="file" id="tracking-file-input" class="hidden" accept="application/pdf" style="display: none;" @change="handleTrackingFileChange" />
          </div>
        </div>

        <!-- Paso 3: Validación IA -->
        <div v-if="trackingStep === 3" class="space-y-4" style="display: flex; flex-direction: column; gap: 14px;">
          <!-- Estado: Escaneando firmas -->
          <div v-if="isScanningTracking" style="text-align: center; padding: 30px 10px;">
            <div class="spin-ring-lg" style="margin: 0 auto 16px; width: 48px; height: 48px; border: 4px solid var(--bg-hover); border-top-color: #2563eb; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <h3 style="font-size: 0.85rem; font-weight: 800; color: var(--text-primary); margin: 0 0 6px 0;">Procesando acta con IA...</h3>
            <p style="font-size: 0.7rem; color: var(--text-muted); margin: 0;">Escaneando firmas obligatorias de reporte técnico (Aprendiz, Instructor, Jefe Inmediato).</p>
          </div>

          <!-- Estado: Error de Escaneo -->
          <div v-else-if="scanTrackingError" style="background: rgba(239, 68, 68, 0.08); border-left: 4px solid #ef4444; padding: 16px; border-radius: 6px;">
            <div style="display: flex; gap: 12px; align-items: flex-start;">
              <span class="material-symbols-outlined" style="color: #ef4444; font-size: 1.6rem;">error</span>
              <div>
                <h4 style="color: #b91c1c; font-size: 0.8rem; font-weight: 800; margin: 0 0 4px 0;">⚠ Error de Validación</h4>
                <p style="color: #ef4444; font-size: 0.72rem; margin: 0; line-height: 1.4;">{{ scanTrackingError }}</p>
              </div>
            </div>
          </div>

          <!-- Estado: Escaneado con Éxito (Muestra las firmas) -->
          <div v-else-if="scanTrackingResult" class="space-y-4" style="display: flex; flex-direction: column; gap: 12px;">
            <h3 style="font-size: 0.8rem; font-weight: 800; color: var(--text-secondary); border-bottom: 1px solid var(--border-primary); padding-bottom: 6px; margin: 0;">Firmas Requeridas Registradas</h3>
            
            <div class="signatures-list" style="display: flex; flex-direction: column; gap: 10px;">
              <!-- Firma 1: Aprendiz -->
              <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: 10px 14px; border-radius: 8px; border: 1px solid var(--border-primary);">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span class="material-symbols-outlined" style="color: var(--text-muted); font-size: 1.3rem;">signature</span>
                  <div style="display: flex; flex-direction: column;">
                    <span style="font-size: 0.78rem; font-weight: 800; color: var(--text-primary);">Firma del Aprendiz</span>
                    <span style="font-size: 0.65rem; color: var(--text-muted);">{{ apprenticeName }}</span>
                  </div>
                </div>
                <span v-if="scanTrackingResult.signatures?.aprendiz?.detected" style="background: rgba(34, 197, 94, 0.1); color: #16a34a; font-size: 0.65rem; font-weight: 800; padding: 4px 8px; border-radius: 20px; display: flex; align-items: center; gap: 4px;">
                  <span class="material-symbols-outlined" style="font-size: 0.8rem;">check</span> Detectada ({{ Math.round(scanTrackingResult.signatures.aprendiz.confidence * 100) }}%)
                </span>
                <span v-else style="background: rgba(239, 68, 68, 0.1); color: #ef4444; font-size: 0.65rem; font-weight: 800; padding: 4px 8px; border-radius: 20px; display: flex; align-items: center; gap: 4px;">
                  <span class="material-symbols-outlined" style="font-size: 0.8rem;">close</span> Faltante
                </span>
              </div>

              <!-- Firma 2: Instructor -->
              <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: 10px 14px; border-radius: 8px; border: 1px solid var(--border-primary);">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span class="material-symbols-outlined" style="color: var(--text-muted); font-size: 1.3rem;">shield_person</span>
                  <div style="display: flex; flex-direction: column;">
                    <span style="font-size: 0.78rem; font-weight: 800; color: var(--text-primary);">Firma del Instructor</span>
                    <span style="font-size: 0.65rem; color: var(--text-muted);">Seguimiento Técnico</span>
                  </div>
                </div>
                <span v-if="scanTrackingResult.signatures?.instructor?.detected" style="background: rgba(34, 197, 94, 0.1); color: #16a34a; font-size: 0.65rem; font-weight: 800; padding: 4px 8px; border-radius: 20px; display: flex; align-items: center; gap: 4px;">
                  <span class="material-symbols-outlined" style="font-size: 0.8rem;">check</span> Detectada ({{ Math.round(scanTrackingResult.signatures.instructor.confidence * 100) }}%)
                </span>
                <span v-else style="background: rgba(239, 68, 68, 0.1); color: #ef4444; font-size: 0.65rem; font-weight: 800; padding: 4px 8px; border-radius: 20px; display: flex; align-items: center; gap: 4px;">
                  <span class="material-symbols-outlined" style="font-size: 0.8rem;">close</span> Faltante
                </span>
              </div>

              <!-- Firma 3: Jefe Inmediato -->
              <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: 10px 14px; border-radius: 8px; border: 1px solid var(--border-primary);">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span class="material-symbols-outlined" style="color: var(--text-muted); font-size: 1.3rem;">apartment</span>
                  <div style="display: flex; flex-direction: column;">
                    <span style="font-size: 0.78rem; font-weight: 800; color: var(--text-primary);">Firma del Jefe Inmediato (Empresa)</span>
                    <span style="font-size: 0.65rem; color: var(--text-muted);">Supervisor Co-formador</span>
                  </div>
                </div>
                <span v-if="scanTrackingResult.signatures?.jefeInmediato?.detected" style="background: rgba(34, 197, 94, 0.1); color: #16a34a; font-size: 0.65rem; font-weight: 800; padding: 4px 8px; border-radius: 20px; display: flex; align-items: center; gap: 4px;">
                  <span class="material-symbols-outlined" style="font-size: 0.8rem;">check</span> Detectada ({{ Math.round(scanTrackingResult.signatures.jefeInmediato.confidence * 100) }}%)
                </span>
                <span v-else style="background: rgba(239, 68, 68, 0.1); color: #ef4444; font-size: 0.65rem; font-weight: 800; padding: 4px 8px; border-radius: 20px; display: flex; align-items: center; gap: 4px;">
                  <span class="material-symbols-outlined" style="font-size: 0.8rem;">close</span> Faltante
                </span>
              </div>
            </div>

            <!-- Veredicto Final -->
            <div v-if="scanTrackingResult.valid" style="background: rgba(34, 197, 94, 0.08); border-left: 4px solid #16a34a; padding: 12px; border-radius: 6px; display: flex; gap: 10px; align-items: center; margin-top: 16px;">
              <span class="material-symbols-outlined" style="color: #16a34a; font-size: 1.4rem;">check_circle</span>
              <p style="color: #14532d; font-size: 0.72rem; font-weight: 700; margin: 0; line-height: 1.4;">{{ scanTrackingResult.message }}</p>
            </div>
            <div v-else style="background: rgba(239, 68, 68, 0.08); border-left: 4px solid #ef4444; padding: 12px; border-radius: 6px; display: flex; gap: 10px; align-items: center; margin-top: 16px;">
              <span class="material-symbols-outlined" style="color: #ef4444; font-size: 1.4rem;">warning</span>
              <p style="color: #7f1d1d; font-size: 0.72rem; font-weight: 700; margin: 0; line-height: 1.4;">{{ scanTrackingResult.message }}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer footer-premium">
        <!-- Paso 1: Dolores/Detalles botones -->
        <template v-if="trackingStep === 1">
          <button class="btn-cancel-premium" @click="showNewTrackingModal = false">Cancelar</button>
          <button 
            class="btn-confirm-premium" 
            style="background-color: #2563eb;" 
            :disabled="newTrackingForm.esExtraordinario && !cupo.extraordinaryTrackingAuthorized"
            @click="trackingStep = 2"
          >
            Siguiente
          </button>
        </template>
        <!-- Paso 2 botones -->
        <template v-else-if="trackingStep === 2">
          <button class="btn-cancel-premium" @click="trackingStep = 1">Atrás</button>
          <button class="btn-confirm-premium" style="background-color: #2563eb;" :disabled="!selectedTrackingFile" @click="trackingStep = 3">Siguiente</button>
        </template>
        <!-- Paso 3 botones -->
        <template v-else-if="trackingStep === 3">
          <button class="btn-cancel-premium" :disabled="isScanningTracking" @click="trackingStep = 2">Volver a Cargar</button>
          <button 
            class="btn-confirm-premium" 
            style="background-color: #2563eb;" 
            :disabled="isScanningTracking || isSaving || !scanTrackingResult?.valid" 
            @click="submitNewTracking"
          >
            {{ isSaving ? 'Guardando...' : 'Confirmar y Registrar Seguimiento' }}
          </button>
        </template>
      </div>
    </div>
  </div>
</div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from '@/components/layout/Sidebar.vue'
import Header from '@/components/layout/Header.vue'
import { bitacoraService } from '../services/bitacora.service'
import { trackingService } from '../services/tracking.service'
import { useAuthStore } from '../../../core/store/auth.store'

const route = useRoute()
const authStore = useAuthStore()

const currentUser = computed(() => authStore.user || { name: 'Instructor', role: 'INSTRUCTOR' })

const stageId = route.query.id
const apprenticeName = route.query.name || 'Aprendiz'
const ficha = route.query.ficha || 'S/N'

// --- PESTAÑAS (RF-INS-08) ---
const activeTab = ref('bitacoras')

// --- ESTADOS BITÁCORAS ---
const bitacoras = ref([])
const selectedBitacora = ref(null)
const isLoading = ref(true)
const isSaving = ref(false)
const observaciones = ref('')

const checklist = computed(() => {
  const list = []
  for (let i = 1; i <= 12; i++) {
    const found = bitacoras.value.find(b => b.semana === i)
    list.push({
      semana: i,
      cargado: !!found,
      bitacora: found || null,
      estado: found ? found.estado : 'NO_CARGADO'
    })
  }
  return list
})

// --- ESTADOS SEGUIMIENTOS (RF-INS-08) ---
const trackings = ref([])
const cupo = ref({ maxSeguimientos: 3, nivelFormacion: 'Tecnólogo' })
const selectedTracking = ref(null)

const showNewTrackingModal = ref(false)
const trackingStep = ref(1)
const isScanningTracking = ref(false)
const scanTrackingError = ref(null)
const scanTrackingResult = ref(null)
const selectedTrackingFile = ref(null)

const newTrackingForm = ref({
  numeroVisita: 1,
  fechaVisita: new Date().toISOString().substring(0, 10),
  lugarVisita: 'Presencial en Empresa',
  calificacion: 'EXCELENTE',
  observaciones: '',
  compromisos: '',
  esExtraordinario: false
})

// --- Asistente de 3 Pasos Bitácoras (RF-INS-05) ---
const showNewBitacoraModal = ref(false)
const currentStep = ref(1)
const isScanning = ref(false)
const scanError = ref(null)
const scanResult = ref(null)
const selectedFile = ref(null)

const newBitacoraForm = ref({
  semana: 1,
  horasReportadas: 40,
  asunto: '',
  descripcion: ''
})

// --- MÉTODOS BITÁCORAS ---
const triggerFileSelect = () => {
  const fileInput = document.getElementById('bitacora-file-input')
  if (fileInput) fileInput.click()
}

const handleFileChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    processFileForScan(file)
  }
}

const handleFileDrop = (e) => {
  const file = e.dataTransfer.files[0]
  if (file) {
    processFileForScan(file)
  }
}

const processFileForScan = async (file) => {
  if (file.type !== 'application/pdf') {
    scanError.value = 'El archivo debe ser de formato PDF obligatoriamente.'
    currentStep.value = 3
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    scanError.value = 'El archivo excede el tamaño máximo permitido de 5MB.'
    currentStep.value = 3
    return
  }

  selectedFile.value = file
  scanError.value = null
  scanResult.value = null
  isScanning.value = true
  currentStep.value = 3

  try {
    const res = await bitacoraService.validateSignatures(file)
    scanResult.value = res.data
  } catch (err) {
    console.error('Error validando firmas por IA:', err)
    scanError.value = err.response?.data?.message || 'Error de conexión con el servicio de Inteligencia Artificial.'
  } finally {
    isScanning.value = false
  }
}

const submitNewBitacora = async () => {
  if (!selectedFile.value || !scanResult.value?.valid) return

  isSaving.value = true
  try {
    const newBitacoraData = {
      stageId: stageId,
      semana: newBitacoraForm.value.semana,
      descripcion: newBitacoraForm.value.descripcion || 'Registro semanal de actividades',
      horasReportadas: newBitacoraForm.value.horasReportadas,
      evidencias: [{
        nombre: selectedFile.value.name,
        url: 'https://docs.google.com/viewer?url=simulado_' + selectedFile.value.name
      }]
    }

    await bitacoraService.crear(newBitacoraData)
    alert('¡Bitácora subida y validada por IA con éxito!')
    showNewBitacoraModal.value = false
    await fetchBitacoras()
  } catch (err) {
    console.error('Error al guardar la bitácora:', err)
    alert('Error al guardar la bitácora: ' + (err.response?.data?.message || err.message))
  } finally {
    isSaving.value = false
  }
}

const resetWizard = () => {
  currentStep.value = 1
  isScanning.value = false
  scanError.value = null
  scanResult.value = null
  selectedFile.value = null
  newBitacoraForm.value = {
    semana: bitacoras.value.length + 1,
    horasReportadas: 40,
    asunto: '',
    descripcion: ''
  }
}

const openWizardModal = () => {
  resetWizard()
  showNewBitacoraModal.value = true
}

const fetchBitacoras = async () => {
  if (!stageId) return
  isLoading.value = true
  try {
    const res = await bitacoraService.getByStage(stageId)
    bitacoras.value = res.data.data || []
    if (bitacoras.value.length > 0) {
      selectedBitacora.value = bitacoras.value[bitacoras.value.length - 1]
    }
  } catch (error) {
    console.error('Error fetching bitacoras:', error)
  } finally {
    isLoading.value = false
  }
}

const selectBitacora = (bit) => {
  selectedBitacora.value = bit
  observaciones.value = bit.observacionesInstructor || ''
}

const handleReview = async (estado) => {
  if (!selectedBitacora.value) return
  
  if (estado === 'RECHAZADA' && !observaciones.value) {
    alert('Por favor ingrese observaciones para el rechazo.')
    return
  }

  isSaving.value = true
  try {
    await bitacoraService.revisar(selectedBitacora.value._id, {
      estado,
      observaciones: observaciones.value
    })
    alert(`Bitácora ${estado} correctamente.`)
    await fetchBitacoras()
  } catch (error) {
    console.error('Error reviewing bitacora:', error)
    alert('Error al procesar la revisión.')
  } finally {
    isSaving.value = false
  }
}

// --- MÉTODOS SEGUIMIENTOS (RF-INS-08) ---
const fetchTrackings = async () => {
  if (!stageId) return
  try {
    const res = await trackingService.getAllTrackings({ stageId })
    trackings.value = res.data.data || []
    if (res.data.cupo) {
      cupo.value = res.data.cupo
    }
    if (trackings.value.length > 0) {
      selectedTracking.value = trackings.value[0]
    } else {
      selectedTracking.value = null
    }
  } catch (error) {
    console.error('Error fetching trackings:', error)
  }
}

const resetTrackingWizard = () => {
  trackingStep.value = 1
  isScanningTracking.value = false
  scanTrackingError.value = null
  scanTrackingResult.value = null
  selectedTrackingFile.value = null
  newTrackingForm.value = {
    numeroVisita: trackings.value.length + 1,
    fechaVisita: new Date().toISOString().substring(0, 10),
    lugarVisita: 'Presencial en Empresa',
    calificacion: 'EXCELENTE',
    observaciones: '',
    compromisos: '',
    esExtraordinario: false
  }
}

const openTrackingWizardModal = () => {
  resetTrackingWizard()
  showNewTrackingModal.value = true
}

const triggerTrackingFileSelect = () => {
  const fileInput = document.getElementById('tracking-file-input')
  if (fileInput) fileInput.click()
}

const handleTrackingFileChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    processTrackingFileForScan(file)
  }
}

const handleTrackingFileDrop = (e) => {
  const file = e.dataTransfer.files[0]
  if (file) {
    processTrackingFileForScan(file)
  }
}

const processTrackingFileForScan = async (file) => {
  if (file.type !== 'application/pdf') {
    scanTrackingError.value = 'El archivo debe ser de formato PDF obligatoriamente.'
    trackingStep.value = 3
    return
  }

  // Límite estricto de 7MB
  if (file.size > 7 * 1024 * 1024) {
    scanTrackingError.value = 'El archivo excede el tamaño máximo permitido de 7MB.'
    trackingStep.value = 3
    return
  }

  selectedTrackingFile.value = file
  scanTrackingError.value = null
  scanTrackingResult.value = null
  isScanningTracking.value = true
  trackingStep.value = 3

  try {
    const res = await trackingService.validatePdf(file)
    scanTrackingResult.value = res.data
  } catch (err) {
    console.error('Error validando firmas en seguimiento por IA:', err)
    scanTrackingError.value = err.response?.data?.message || 'Error de conexión con el servicio de Inteligencia Artificial.'
  } finally {
    isScanningTracking.value = false
  }
}

const submitNewTracking = async () => {
  if (!selectedTrackingFile.value || !scanTrackingResult.value?.valid) return

  isSaving.value = true
  try {
    const newTrackingData = {
      stageId: stageId,
      numeroVisita: newTrackingForm.value.numeroVisita,
      fechaVisita: newTrackingForm.value.fechaVisita,
      lugarVisita: newTrackingForm.value.lugarVisita,
      calificacion: newTrackingForm.value.calificacion,
      observaciones: newTrackingForm.value.observaciones,
      compromisos: newTrackingForm.value.compromisos,
      evidenciaUrl: 'https://docs.google.com/viewer?url=simulado_' + selectedTrackingFile.value.name,
      evidenciaSize: selectedTrackingFile.value.size,
      isValidatedByIA: true,
      signaturesValidated: scanTrackingResult.value.signatures,
      esExtraordinario: newTrackingForm.value.esExtraordinario
    }

    await trackingService.createTracking(newTrackingData)
    alert('¡Visita de seguimiento registrada y validada por IA con éxito!')
    showNewTrackingModal.value = false
    await fetchTrackings()
  } catch (err) {
    console.error('Error al guardar seguimiento:', err)
    alert('Error al registrar seguimiento: ' + (err.response?.data?.message || err.message))
  } finally {
    isSaving.value = false
  }
}

const authorizeStageNow = async () => {
  isSaving.value = true
  try {
    await trackingService.authorizeExtraordinary(stageId, true)
    cupo.value.extraordinaryTrackingAuthorized = true
    alert('¡Seguimientos extraordinarios autorizados correctamente!')
  } catch (err) {
    console.error('Error al autorizar etapa:', err)
    alert('Error al autorizar: ' + (err.response?.data?.message || err.message))
  } finally {
    isSaving.value = false
  }
}

// --- AUXILIRES ---
const getInitials = (name) => {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

onMounted(async () => {
  await fetchBitacoras()
  await fetchTrackings()
})
</script>

<style scoped>
.bitacoras-layout { display: flex; height: 100vh; background: var(--bg-secondary); overflow: hidden; }
.main-wrapper { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

/* Navbar */
.top-nav-bitacoras { height: 40px; background: var(--bg-primary); display: flex; align-items: center; padding: 0 1rem; gap: 1rem; border-bottom: 1px solid var(--border-primary); }
.nav-brand { display: flex; align-items: center; gap: 6px; min-width: 160px; }
.nav-brand h1 { font-size: 0.85rem; font-weight: 800; color: var(--text-primary); }
.icon-main { font-size: 1.1rem; color: var(--color_button, #2e7d32); }

.nav-search { flex: 1; position: relative; max-width: 400px; }
.nav-search .material-symbols-outlined { position: absolute; left: 8px; top: 50%; transform: translateY(-50%); font-size: 1rem; color: var(--text-muted); }
.nav-search input { width: 100%; padding: 5px 10px 5px 30px; border-radius: 8px; border: none; background: var(--bg-hover); font-size: 0.7rem; color: var(--text-primary); }

.nav-actions { display: flex; align-items: center; gap: 10px; }
.nav-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: none; border: 1px solid var(--border-primary); border-radius: 8px; color: var(--text-secondary); cursor: pointer; transition: all 0.2s; }
.nav-btn:hover { background: var(--bg-hover); color: var(--color_button); border-color: var(--color_button); }
.nav-btn .material-symbols-outlined { font-size: 1.1rem; }
.user-avatar-mini { width: 26px; height: 26px; border-radius: 50%; background: var(--border-primary); border: 2px solid var(--bg-primary); box-shadow: 0 2px 4px rgba(0,0,0,0.1); }

/* Layout Columns */
.content-columns { flex: 1; display: grid; grid-template-columns: 180px 240px 1fr; overflow: hidden; }

/* Scrollbar Style */
.column-fichas::-webkit-scrollbar,
.entregas-list::-webkit-scrollbar,
.column-revision::-webkit-scrollbar { width: 4px; }

/* Columna Fichas */
.column-fichas { background: var(--bg-secondary); padding: 0.75rem 0.5rem; border-right: 1px solid var(--border-primary); display: flex; flex-direction: column; gap: 0.75rem; overflow-y: auto; }
.btn-new-bitacora { width: 100%; padding: 8px; background: var(--color_button, #2e7d32); color: white; border: none; border-radius: 8px; font-weight: 800; font-size: 0.7rem; display: flex; align-items: center; justify-content: center; gap: 4px; cursor: pointer; box-shadow: 0 2px 6px rgba(46, 125, 50, 0.2); }

.fichas-section .section-title { font-size: 0.55rem; font-weight: 800; color: var(--text-muted); letter-spacing: 0.5px; display: flex; align-items: center; gap: 3px; margin-bottom: 0.5rem; }
.ficha-card { padding: 8px; background: var(--bg-elevated); border-radius: 8px; border: 1px solid var(--border-primary); margin-bottom: 0.4rem; cursor: pointer; transition: all 0.2s; }
.ficha-card:hover { border-color: var(--color_button); }
.ficha-card.active { border-color: var(--color_button); background: var(--bg-active); box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
.ficha-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3px; }
.ficha-id { font-size: 0.6rem; font-weight: 800; color: var(--color_button); }
.badge-new { background: #c53030; color: white; font-size: 0.5rem; padding: 1px 4px; border-radius: 4px; font-weight: 800; }
.ficha-name { font-size: 0.7rem; font-weight: 700; color: var(--text-primary); }

/* Columna Entregas */
.column-entregas { background: var(--bg-hover); border-right: 1px solid var(--border-primary); display: flex; flex-direction: column; }
.entregas-header { padding: 0.75rem 0.5rem; }
.entregas-header h2 { font-size: 0.85rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.5rem; }
.filter-box { position: relative; }
.filter-box .material-symbols-outlined { position: absolute; left: 8px; top: 50%; transform: translateY(-50%); font-size: 1rem; color: var(--text-muted); }
.filter-box input { width: 100%; padding: 5px 8px 5px 28px; border-radius: 8px; border: 1px solid var(--border-primary); font-size: 0.7rem; background: var(--bg-elevated); color: var(--text-primary); }

.entregas-list { flex: 1; overflow-y: auto; padding: 0 0.5rem 0.75rem; }
.entrega-item { background: var(--bg-elevated); padding: 8px; border-radius: 8px; margin-bottom: 0.4rem; border-left: 3px solid transparent; cursor: pointer; transition: all 0.2s; }
.entrega-item:hover { background: var(--bg-hover); }
.entrega-item.selected { border-left-color: var(--color_button); background: var(--bg-elevated); box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
.entrega-info { display: flex; justify-content: space-between; font-size: 0.7rem; margin-bottom: 3px; }
.entrega-info strong { color: var(--text-primary); }
.entrega-info .time { font-size: 0.55rem; color: var(--text-muted); font-weight: 700; }
.entrega-subject { font-size: 0.7rem; font-weight: 700; color: var(--color_button); margin-bottom: 2px; }
.entrega-preview { font-size: 0.6rem; color: var(--text-secondary); line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

/* Columna Revisión */
.column-revision { background: var(--bg-primary); overflow-y: auto; }
.revision-scroll { padding: 1rem; width: 100%; }

.revision-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; }
.user-profile { display: flex; align-items: center; gap: 12px; }
.avatar-large { width: 36px; height: 36px; background: var(--bg-active); color: var(--color_button); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.9rem; }
.profile-info h2 { font-size: 1.1rem; font-weight: 800; color: var(--text-primary); margin: 0; }
.profile-info p { color: var(--text-secondary); font-size: 0.7rem; margin-top: 1px; }
.pills { display: flex; gap: 6px; margin-top: 6px; }
.pill { padding: 3px 8px; border-radius: 20px; font-size: 0.55rem; font-weight: 800; }
.pill.gray { background: var(--bg-hover); color: var(--text-secondary); }
.pill.green { background: var(--bg-active); color: #16a34a; }

.header-tools { display: flex; gap: 8px; }
.tool-btn { width: 30px; height: 30px; border: 1px solid var(--border-primary); border-radius: 8px; background: var(--bg-elevated); cursor: pointer; color: var(--text-secondary); display: flex; align-items: center; justify-content: center; }
.tool-btn .material-symbols-outlined { font-size: 1.1rem; }

.revision-widgets { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
.widget { background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: 12px; padding: 1rem; }
.widget-header { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px; }

/* Calendar Widget */
.days-header { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; font-size: 0.6rem; font-weight: 800; color: var(--text-muted); margin-bottom: 6px; }
.days-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; text-align: center; }
.days-grid span { font-size: 0.65rem; font-weight: 600; padding: 3px 0; border-radius: 6px; color: var(--text-primary); }
.days-grid .today { background: var(--color_button); color: white; }
.days-grid .selected-day { background: var(--bg-active); color: var(--color_button); font-weight: 800; border: 1px solid #16a34a; }

.spin-sm { width: 14px; height: 14px; border: 2px solid rgba(0,0,0,0.1); border-top-color: #2e7d32; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.entrega-preview.aprobada { color: #16a34a; font-weight: 800; }
.entrega-preview.rechazada { color: #ef4444; font-weight: 800; }
.entrega-preview.pendiente { color: #d97706; font-weight: 800; }

/* History Widget */
.timeline { display: flex; flex-direction: column; gap: 0.75rem; }
.timeline-item { display: flex; gap: 12px; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: var(--border-primary); margin-top: 3px; }
.dot.active { background: #16a34a; box-shadow: 0 0 0 4px var(--bg-active); }
.t-content p { font-size: 0.75rem; font-weight: 700; color: var(--text-primary); margin: 0; }
.t-time { font-size: 0.65rem; color: var(--text-muted); font-weight: 600; }

/* PDF Access Box */
.pdf-access-box { background: var(--bg-secondary); border: 1px solid var(--border-primary); border-radius: 12px; padding: 16px; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s; }
.pdf-access-box:hover { border-color: var(--scrollbar-thumb); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
.pdf-info-group { display: flex; align-items: center; gap: 16px; }
.pdf-icon-wrapper { width: 48px; height: 48px; background: rgba(239,68,68,0.1); color: #ef4444; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
.pdf-icon-wrapper .material-symbols-outlined { font-size: 1.5rem; }
.pdf-info h4 { font-size: 0.85rem; font-weight: 800; color: var(--text-primary); margin: 0 0 4px 0; }
.pdf-info p { font-size: 0.7rem; color: var(--text-secondary); margin: 0; font-weight: 600; }
.btn-view-pdf { background: var(--bg-elevated); border: 1px solid var(--border-primary); padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 0.75rem; color: var(--text-secondary); cursor: pointer; transition: all 0.2s; text-decoration: none; display: inline-block; }
.btn-view-pdf:hover { background: var(--bg-hover); color: var(--color_button); border-color: var(--color_button); }

/* Modals General */
.modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-card { background: var(--bg-elevated); border-radius: 16px; width: 480px; max-height: 90vh; overflow-y: auto; box-shadow: var(--shadow-lg); border: 1px solid var(--border-primary); }
.modal-md { width: 500px; }
.modal-full { width: 90vw; height: 90vh; display: flex; flex-direction: column; overflow: hidden; }
.modal-head { display: flex; justify-content: space-between; align-items: flex-start; padding: 20px 24px; border-bottom: 1px solid var(--border-primary); background: var(--bg-primary); }
.head-info h2 { font-size: 1.1rem; font-weight: 800; margin: 0; color: var(--text-primary); }
.head-info p { font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px; }
.modal-close { background: none; border: none; font-size: 1.5rem; color: var(--text-muted); cursor: pointer; line-height: 1; }
.modal-body { padding: 24px; background: var(--bg-secondary); }
.modal-footer { padding: 16px 24px; border-top: 1px solid var(--border-primary); display: flex; justify-content: flex-end; gap: 10px; background: var(--bg-primary); }

/* Premium Form Styles */
.form-group-premium { margin-bottom: 16px; }
.label-premium { display: block; font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 6px; }
.input-premium, .select-premium { width: 100%; padding: 10px 12px; border: 1px solid var(--border-primary); border-radius: 8px; font-size: 0.85rem; outline: none; transition: 0.2s; background: var(--bg-secondary); color: var(--text-primary); box-sizing: border-box; }
.input-premium:focus, .select-premium:focus { border-color: var(--color_button); background: var(--bg-elevated); box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.15); }
.btn-cancel-premium { background: var(--bg-hover); color: var(--text-secondary); border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.btn-cancel-premium:hover { background: var(--border-primary); }
.btn-confirm-premium { background: var(--color_button); color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: background 0.2s; box-shadow: 0 2px 4px rgba(46, 125, 50, 0.2); }
.btn-confirm-premium:hover { background: #1b5e20; }

/* Revision Actions */
.revision-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--border-primary); }
.btn-reject { padding: 10px; border-radius: 10px; border: 2px solid #c53030; color: #c53030; background: var(--bg-elevated); font-weight: 800; font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; }
.btn-approve { padding: 10px; border-radius: 10px; border: none; background: var(--color_button); color: white; font-weight: 800; font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; }

/* --- Instructor Visual Checklist CSS --- */
.instructor-checklist-container {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 16px;
  box-shadow: var(--shadow-sm);
}

.instructor-checklist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.icon-checklist-mini {
  font-size: 18px;
  color: var(--color_button);
  background: var(--bg-active);
  padding: 4px;
  border-radius: 6px;
}

.instructor-checklist-header h3 {
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.summary-stats {
  display: flex;
  gap: 8px;
}

.stat-badge {
  font-size: 0.55rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 12px;
  background: var(--bg-hover);
  color: var(--text-secondary);
  border: 1px solid var(--border-primary);
}

.stat-badge.approved {
  background: #F0FDF4;
  color: #16A34A;
  border-color: #DCFCE7;
}

.instructor-checklist-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
}

.instructor-checklist-card {
  border-radius: 8px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-height: 38px;
  transition: all 0.2s ease;
  border: 1px dashed var(--color-gray-400);
  background: transparent;
  cursor: default;
}

.instructor-checklist-card.is-clickable {
  cursor: pointer;
  border-style: solid;
}

.instructor-checklist-card.is-clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.05);
}

.instructor-checklist-card.no_cargado {
  border: 1px dashed var(--border-primary);
  background: var(--bg-secondary);
  color: var(--text-muted);
}
.instructor-checklist-card.no_cargado .mini-icon {
  color: var(--text-muted);
  opacity: 0.4;
  font-size: 14px;
}
.instructor-checklist-card.no_cargado .week-num-badge {
  color: var(--text-secondary);
}

.instructor-checklist-card.pendiente {
  background: #FFFBEB;
  border-color: #F59E0B;
  color: #B45309;
}
.instructor-checklist-card.pendiente .mini-icon {
  color: #D97706;
  font-size: 14px;
}
.instructor-checklist-card.pendiente .week-num-badge {
  color: #B45309;
}

.instructor-checklist-card.aprobada {
  background: #F0FDF4;
  border-color: #10B981;
  color: #047857;
}
.instructor-checklist-card.aprobada .mini-icon {
  color: #10B981;
  font-size: 14px;
}
.instructor-checklist-card.aprobada .week-num-badge {
  color: #047857;
}

.instructor-checklist-card.rechazada {
  background: #FEF2F2;
  border-color: #EF4444;
  color: #B91C1C;
}
.instructor-checklist-card.rechazada .mini-icon {
  color: #EF4444;
  font-size: 14px;
}
.instructor-checklist-card.rechazada .week-num-badge {
  color: #B91C1C;
}

.instructor-checklist-card.is-active {
  border-width: 2px;
  box-shadow: 0 0 0 2px rgba(46, 125, 50, 0.15);
}

.week-num-badge {
  font-size: 0.6rem;
  font-weight: 800;
}

.mini-icon {
  font-size: 14px;
}

.mt-4 {
  margin-top: 1rem;
}
</style>
