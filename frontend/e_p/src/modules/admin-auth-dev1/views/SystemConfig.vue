<template>
  <div class="repfora-dashboard">
    <Sidebar />
    
    <div class="main-wrapper">
      <Header title="Parámetros Formativos" />

      <main class="content">
        <div class="page-body">
          
          <!-- Alerta Global Flotante (Bootstrap Style) -->
          <Transition name="fade">
            <div v-if="alertBox.show" class="alert-bootstrap-global" :class="alertBox.type">
              <div class="alert-content">
                <span class="material-symbols-outlined" style="font-size: 20px; color: currentColor;">info</span>
                <span>{{ alertBox.message }}</span>
              </div>
              <button class="alert-close" @click="alertBox.show = false">&times;</button>
            </div>
          </Transition>

          <header class="page-header">
            <div class="header-left-group">
              <div class="header-info">
                <h1 class="page-title">Configuración de Parámetros Formativos</h1>
                <p class="page-description">Establezca los tiempos y horas requeridas para las actividades y el seguimiento institucional.</p>
              </div>
            </div>
          </header>

          <div v-if="isLoading" class="table-loading">
            <div class="spin-ring-lg"></div>
            <p>Cargando configuraciones del sistema...</p>
          </div>

          <div v-else class="config-grid">
            <!-- Bloque 1: Parámetros Formativos (Horas de Gestión) -->
            <div class="card config-card-premium">
              <div class="card-header-premium">
                <span class="material-symbols-outlined header-icon">settings_applications</span>
                <div>
                  <h3>RF-ADM-10: Parámetros de Seguimiento</h3>
                  <p>Defina las horas asignadas para la revisión, visitas y trámites.</p>
                </div>
              </div>

              <div class="card-body-premium">
                <div class="form-group-premium mb-4">
                  <label class="label-premium">Horas de revisión por Bitácora</label>
                  <div class="input-with-suffix">
                    <input type="number" min="0" v-model="formFormativo.horasRevisionBitacoras" class="input-premium" />
                    <span class="suffix-text">Horas</span>
                  </div>
                  <small class="help-text">Tiempo asignado al instructor para revisar y retroalimentar cada bitácora mensual.</small>
                </div>

                <div class="form-group-premium mb-4">
                  <label class="label-premium">Horas por Visita de Seguimiento (Normal)</label>
                  <div class="input-with-suffix">
                    <input type="number" min="0" v-model="formFormativo.horasSeguimiento" class="input-premium" />
                    <span class="suffix-text">Horas</span>
                  </div>
                  <small class="help-text">Tiempo estándar para visitas presenciales o virtuales programadas a la empresa.</small>
                </div>

                <div class="form-group-premium mb-4">
                  <label class="label-premium">Horas por Visitas Extraordinarias / Comités</label>
                  <div class="input-with-suffix">
                    <input type="number" min="0" v-model="formFormativo.horasExtraordinarios" class="input-premium" />
                    <span class="suffix-text">Horas</span>
                  </div>
                  <small class="help-text">Tiempo para reuniones no programadas por dificultades en la etapa productiva.</small>
                </div>

                <div class="form-group-premium mb-4">
                  <label class="label-premium">Horas por Proceso de Certificación</label>
                  <div class="input-with-suffix">
                    <input type="number" min="0" v-model="formFormativo.horasCertificacion" class="input-premium" />
                    <span class="suffix-text">Horas</span>
                  </div>
                  <small class="help-text">Tiempo destinado a la validación final del expediente digital del aprendiz.</small>
                </div>
              </div>

              <div class="card-footer-premium text-right">
                <button class="btn btn-primary-sena" @click="saveParametrosFormativos" :disabled="isSavingFormativo">
                  <span v-if="!isSavingFormativo">Guardar Parámetros</span>
                  <div v-else class="spin-mini"></div>
                </button>
              </div>
            </div>

            <!-- Bloque 2: Horas Requeridas por Modalidad de Actividad -->
            <div class="card config-card-premium">
              <div class="card-header-premium">
                <span class="material-symbols-outlined header-icon">schedule</span>
                <div>
                  <h3>RF-ADM-09: Horas Requeridas por Actividad</h3>
                  <p>Configure el total de horas obligatorias según el tipo de etapa productiva.</p>
                </div>
              </div>

              <div class="card-body-premium">
                <div class="form-group-premium mb-4">
                  <label class="label-premium">Contrato de Aprendizaje</label>
                  <div class="input-with-suffix">
                    <input type="number" min="0" v-model="formActividades.CONTRATO_APRENDIZAJE" class="input-premium" />
                    <span class="suffix-text">Horas</span>
                  </div>
                </div>

                <div class="form-group-premium mb-4">
                  <label class="label-premium">Pasantía</label>
                  <div class="input-with-suffix">
                    <input type="number" min="0" v-model="formActividades.PASANTIA" class="input-premium" />
                    <span class="suffix-text">Horas</span>
                  </div>
                </div>

                <div class="form-group-premium mb-4">
                  <label class="label-premium">Proyecto Productivo</label>
                  <div class="input-with-suffix">
                    <input type="number" min="0" v-model="formActividades.PROYECTO_PRODUCTIVO" class="input-premium" />
                    <span class="suffix-text">Horas</span>
                  </div>
                </div>

                <div class="form-group-premium mb-4">
                  <label class="label-premium">Monitoría Académica / Administrativa</label>
                  <div class="input-with-suffix">
                    <input type="number" min="0" v-model="formActividades.MONITORIA" class="input-premium" />
                    <span class="suffix-text">Horas</span>
                  </div>
                </div>

                <div class="form-group-premium mb-4">
                  <label class="label-premium">Vinculación Laboral</label>
                  <div class="input-with-suffix">
                    <input type="number" min="0" v-model="formActividades.VINCULACION_LABORAL" class="input-premium" />
                    <span class="suffix-text">Horas</span>
                  </div>
                </div>
              </div>

              <div class="card-footer-premium text-right">
                <button class="btn btn-primary-sena" @click="saveHorasActividad" :disabled="isSavingActividades">
                  <span v-if="!isSavingActividades">Guardar Horas por Actividad</span>
                  <div v-else class="spin-mini"></div>
                </button>
              </div>
            </div>

            <!-- Bloque 3: Parámetros Académicos, Alertas y Nube -->
            <div class="card config-card-premium">
              <div class="card-header-premium">
                <span class="material-symbols-outlined header-icon">cloud_sync</span>
                <div>
                  <h3>Parámetros de Proceso y Nube</h3>
                  <p>Establezca límites, seguimientos mínimos obligatorios y el proveedor de la nube.</p>
                </div>
              </div>

              <div class="card-body-premium">
                <div class="form-group-premium mb-4">
                  <label class="label-premium">Proveedor de Almacenamiento Activo</label>
                  <select v-model="formAlertas.cloudStorageProvider" class="input-premium select-premium">
                    <option value="GOOGLE_DRIVE">Google Drive</option>
                    <option value="ONEDRIVE">Microsoft OneDrive</option>
                  </select>
                  <small class="help-text">Define dónde se creará automáticamente la estructura de carpetas de los aprendices.</small>
                </div>

                <div class="form-group-premium mb-4">
                  <label class="label-premium">Número máximo de Bitácoras</label>
                  <div class="input-with-suffix">
                    <input type="number" min="1" v-model="formAlertas.maxBitacoras" class="input-premium" />
                    <span class="suffix-text">Bitácoras</span>
                  </div>
                  <small class="help-text">Cantidad máxima de reportes mensuales permitidos por aprendiz (defecto 7).</small>
                </div>

                <div class="form-group-premium mb-4">
                  <label class="label-premium">Visitas de Seguimiento Obligatorias</label>
                  <div class="input-with-suffix">
                    <input type="number" min="1" v-model="formAlertas.seguimientosObligatorios" class="input-premium" />
                    <span class="suffix-text">Visitas</span>
                  </div>
                  <small class="help-text">Cantidad de visitas requeridas realizadas con éxito para certificar (defecto 3).</small>
                </div>

                <div class="form-group-premium mb-4">
                  <label class="label-premium">Días de anticipación para Alertas de Visita</label>
                  <div class="input-with-suffix">
                    <input type="number" min="1" v-model="formAlertas.diasAnticipacion" class="input-premium" />
                    <span class="suffix-text">Días</span>
                  </div>
                  <small class="help-text">Días previos para notificar al instructor sobre seguimientos programados (defecto 5).</small>
                </div>
              </div>

              <div class="card-footer-premium text-right">
                <button class="btn btn-primary-sena" @click="saveAlertasConfig" :disabled="isSavingAlertas">
                  <span v-if="!isSavingAlertas">Guardar Parámetros Académicos</span>
                  <div v-else class="spin-mini"></div>
                </button>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Sidebar from '../../../components/layout/Sidebar.vue';
import Header from '../../../components/layout/Header.vue';
import http from '../../../core/api/http';

const isLoading = ref(true);
const isSavingFormativo = ref(false);
const isSavingActividades = ref(false);

const alertBox = ref({
  show: false,
  message: '',
  type: 'success'
});

const showAlert = (message, type = 'success') => {
  alertBox.value = {
    show: true,
    message,
    type
  };
  setTimeout(() => {
    alertBox.value.show = false;
  }, 5000);
};

// Formulario de parámetros formativos (RF-ADM-10)
const formFormativo = ref({
  horasRevisionBitacoras: 1,
  horasSeguimiento: 2,
  horasExtraordinarios: 2,
  horasCertificacion: 2
});

// Formulario de horas por actividad (RF-ADM-09)
const formActividades = ref({
  CONTRATO_APRENDIZAJE: 880,
  PASANTIA: 880,
  PROYECTO_PRODUCTIVO: 880,
  MONITORIA: 440,
  VINCULACION_LABORAL: 880
});

// Formulario de parámetros académicos, alertas y almacenamiento (RF-ADM-10 y RF-ADM-11)
const isSavingAlertas = ref(false);
const formAlertas = ref({
  cloudStorageProvider: 'GOOGLE_DRIVE',
  maxBitacoras: 7,
  seguimientosObligatorios: 3,
  diasAnticipacion: 5
});

const loadConfiguraciones = async () => {
  try {
    isLoading.value = true;
    const response = await http.get('/system-config');
    const configs = response.data.data || [];

    // Mapear parámetros formativos
    const revision = configs.find(c => c.clave === 'HORAS_REVISION_BITACORAS');
    if (revision) formFormativo.value.horasRevisionBitacoras = Number(revision.valor);

    const seguimiento = configs.find(c => c.clave === 'HORAS_SEGUIMIENTO');
    if (seguimiento) formFormativo.value.horasSeguimiento = Number(seguimiento.valor);

    const extra = configs.find(c => c.clave === 'HORAS_EXTRAORDINARIOS');
    if (extra) formFormativo.value.horasExtraordinarios = Number(extra.valor);

    const cert = configs.find(c => c.clave === 'HORAS_CERTIFICACION');
    if (cert) formFormativo.value.horasCertificacion = Number(cert.valor);

    // Mapear horas por actividad
    const horasActividad = configs.find(c => c.clave === 'HORAS_POR_ACTIVIDAD');
    if (horasActividad && horasActividad.valor) {
      formActividades.value = {
        ...formActividades.value,
        ...horasActividad.valor
      };
    }

    // Mapear parámetros académicos, alertas y almacenamiento
    const cloudProvider = configs.find(c => c.clave === 'CLOUD_STORAGE_PROVIDER');
    if (cloudProvider) formAlertas.value.cloudStorageProvider = cloudProvider.valor;

    const maxB = configs.find(c => c.clave === 'MAX_BITACORAS');
    if (maxB) formAlertas.value.maxBitacoras = Number(maxB.valor);

    const segO = configs.find(c => c.clave === 'SEGUIMIENTOS_OBLIGATORIOS');
    if (segO) formAlertas.value.seguimientosObligatorios = Number(segO.valor);

    const diasA = configs.find(c => c.clave === 'DIAS_ANTICIPACION_ALERTA_SEGUIMIENTO');
    if (diasA) formAlertas.value.diasAnticipacion = Number(diasA.valor);

  } catch (err) {
    console.error('Error al cargar configuraciones:', err);
    showAlert('Error al cargar las configuraciones del sistema.', 'danger');
  } finally {
    isLoading.value = false;
  }
};

const saveParametrosFormativos = async () => {
  try {
    isSavingFormativo.value = true;
    
    // Guardar uno por uno las llaves
    await http.post('/system-config', {
      clave: 'HORAS_REVISION_BITACORAS',
      valor: Number(formFormativo.value.horasRevisionBitacoras),
      descripcion: 'Horas asignadas por revisión de cada bitácora.'
    });

    await http.post('/system-config', {
      clave: 'HORAS_SEGUIMIENTO',
      valor: Number(formFormativo.value.horasSeguimiento),
      descripcion: 'Horas asignadas por visita/seguimiento programado.'
    });

    await http.post('/system-config', {
      clave: 'HORAS_EXTRAORDINARIOS',
      valor: Number(formFormativo.value.horasExtraordinarios),
      descripcion: 'Horas asignadas por seguimientos extraordinarios o comités.'
    });

    await http.post('/system-config', {
      clave: 'HORAS_CERTIFICACION',
      valor: Number(formFormativo.value.horasCertificacion),
      descripcion: 'Horas asignadas por el proceso de certificación.'
    });

    showAlert('Parámetros de seguimiento actualizados correctamente.');
  } catch (err) {
    console.error('Error al guardar parámetros:', err);
    showAlert('No se pudieron actualizar los parámetros de seguimiento.', 'danger');
  } finally {
    isSavingFormativo.value = false;
  }
};

const saveHorasActividad = async () => {
  try {
    isSavingActividades.value = true;

    await http.post('/system-config', {
      clave: 'HORAS_POR_ACTIVIDAD',
      valor: {
        CONTRATO_APRENDIZAJE: Number(formActividades.value.CONTRATO_APRENDIZAJE),
        PASANTIA: Number(formActividades.value.PASANTIA),
        PROYECTO_PRODUCTIVO: Number(formActividades.value.PROYECTO_PRODUCTIVO),
        MONITORIA: Number(formActividades.value.MONITORIA),
        VINCULACION_LABORAL: Number(formActividades.value.VINCULACION_LABORAL)
      },
      descripcion: 'Horas de etapa productiva requeridas por modalidad de actividad.'
    });

    showAlert('Horas requeridas por actividad actualizadas correctamente.');
  } catch (err) {
    console.error('Error al guardar horas por actividad:', err);
    showAlert('No se pudieron guardar las horas requeridas por actividad.', 'danger');
  } finally {
    isSavingActividades.value = false;
  }
};

const saveAlertasConfig = async () => {
  try {
    isSavingAlertas.value = true;
    
    await http.post('/system-config', {
      clave: 'CLOUD_STORAGE_PROVIDER',
      valor: formAlertas.value.cloudStorageProvider,
      descripcion: 'Proveedor de almacenamiento en la nube activo (GOOGLE_DRIVE o ONEDRIVE).'
    });

    await http.post('/system-config', {
      clave: 'MAX_BITACORAS',
      valor: Number(formAlertas.value.maxBitacoras),
      descripcion: 'Número máximo de bitácoras permitidas por Etapa Productiva.'
    });

    await http.post('/system-config', {
      clave: 'SEGUIMIENTOS_OBLIGATORIOS',
      valor: Number(formAlertas.value.seguimientosObligatorios),
      descripcion: 'Cantidad de visitas de seguimiento obligatorias para finalización.'
    });

    await http.post('/system-config', {
      clave: 'DIAS_ANTICIPACION_ALERTA_SEGUIMIENTO',
      valor: Number(formAlertas.value.diasAnticipacion),
      descripcion: 'Días de anticipación para notificar seguimientos programados.'
    });

    showAlert('Parámetros académicos, de alertas y almacenamiento actualizados correctamente.');
  } catch (err) {
    console.error('Error al guardar configuración de alertas/almacenamiento:', err);
    showAlert('No se pudieron actualizar los parámetros académicos y de almacenamiento.', 'danger');
  } finally {
    isSavingAlertas.value = false;
  }
};

onMounted(() => {
  loadConfiguraciones();
});
</script>

<style scoped>
.page-body { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 12px 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.page-title { font-size: 1.1rem; font-weight: 800; margin: 0; color: var(--text-primary); }
.page-description { font-size: 0.75rem; color: var(--text-secondary); }

.config-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.config-card-premium {
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.card-header-premium {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-primary);
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--bg-primary);
}

.header-icon {
  font-size: 32px;
  color: var(--color_button);
}

.card-header-premium h3 {
  font-size: 1rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.card-header-premium p {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 2px 0 0 0;
}

.card-body-premium {
  padding: 24px;
  flex: 1;
}

.card-footer-premium {
  padding: 16px 24px;
  border-top: 1px solid var(--border-primary);
  background: var(--bg-secondary);
}

.text-right {
  text-align: right;
}

.input-with-suffix {
  position: relative;
  display: flex;
  align-items: center;
}

.input-with-suffix input {
  padding-right: 64px;
}

.suffix-text {
  position: absolute;
  right: 16px;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  pointer-events: none;
}

.help-text {
  display: block;
  margin-top: 6px;
  font-size: 0.72rem;
  color: var(--text-muted);
  line-height: 1.4;
}

.btn-primary-sena {
  background: #1b5e20;
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-primary-sena:hover:not(:disabled) {
  background: #143b23;
  transform: translateY(-1px);
}

.btn-primary-sena:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.alert-bootstrap-global {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  font-size: 0.85rem;
  font-weight: 600;
  animation: slideIn 0.3s ease-out;
  max-width: 450px;
  gap: 16px;
}

.alert-bootstrap-global.success {
  background: #E8F5E9;
  border: 1px solid #C8E6C9;
  color: #2E7D32;
}

.alert-bootstrap-global.danger {
  background: #FFEBEE;
  border: 1px solid #FFCDD2;
  color: #C62828;
}

.alert-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.alert-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: currentColor;
  cursor: pointer;
}

.select-premium {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2364748b'%3e%3cpath d='M7 10l5 5 5-5z'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 16px center;
  background-size: 24px;
  padding-right: 48px;
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@media (max-width: 1024px) {
  .config-grid {
    grid-template-columns: 1fr;
  }
}
</style>
