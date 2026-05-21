// companies.controller.js   DEV 2 | Gestion de Empresas
// =============================================
// Controladores HTTP para el modulo de Empresas.
// =============================================

const path    = require('path');
const XLSX    = require('xlsx');
const service = require('./companies.service');

// Ruta absoluta a la plantilla Excel almacenada en el backend
const TEMPLATE_PATH = path.join(__dirname, '../../assets/formato_registro_empresas_REPFORAEP.xlsm');

/**
 * GET /api/companies/template
 * Descarga la plantilla Excel para carga masiva (solo ADMIN).
 */
const downloadTemplate = (_req, res) => {
  res.download(TEMPLATE_PATH, 'formato_registro_empresas_REPFORAEP.xlsm', (err) => {
    if (err) {
      res.status(500).json({ success: false, message: 'No se pudo servir la plantilla.' });
    }
  });
};

/**
 * POST /api/companies/upload-xlsx
 * Recibe un archivo .xlsx (multipart/form-data), parsea las filas,
 * mapea las columnas al modelo Company y llama a bulkCrear.
 *
 * Columnas esperadas en el Excel (fila 1 = cabecera):
 *   NIT | RAZON_SOCIAL | SECTOR_ECONOMICO | DIRECCION | MUNICIPIO |
 *   TELEFONO | CORREO_CORPORATIVO | JEFE_NOMBRE | JEFE_CARGO |
 *   JEFE_TELEFONO | JEFE_CORREO
 */
const uploadXlsx = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se recibió ningún archivo.' });
    }

    // Parsear el buffer en memoria (sin escribir a disco)
    const workbook  = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames;
    const empresasData = [];

    for (const sheetName of sheetNames) {
      // Validar si la pestaña empieza por "empresa" (ej. "Empresa 1", "empresa 2", "Empresa3")
      if (/^empresa/i.test(sheetName.trim())) {
        const sheet = workbook.Sheets[sheetName];
        
        // Convertir la pestaña vertical a formato JSON
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        if (!rows || rows.length === 0) continue;

        // Construir un mapa llave-valor para esta pestaña
        const entryMap = {};
        for (const row of rows) {
          // Normalizar las llaves de la fila (ej. "Campo" o "Valor")
          const normRow = {};
          for (const key of Object.keys(row)) {
            const normK = key.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            normRow[normK] = String(row[key]).trim();
          }

          const campoVal = normRow['campo'];
          const valorVal = normRow['valor'];

          if (campoVal) {
            // Normalizar el nombre del campo para el mapeo (ej. "Dirección Principal" -> "direccion_principal")
            const normCampo = campoVal.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_');
            entryMap[normCampo] = valorVal || '';
          }
        }

        // Si la pestaña está vacía o no tiene campos útiles, la omitimos
        if (Object.keys(entryMap).length === 0) continue;

        // Normalizar y validar el estado de aprobación
        let estadoVal = 'EN_REVISION';
        if (entryMap['estado_de_aprobacion']) {
          const rawEst = entryMap['estado_de_aprobacion'].toUpperCase().replace(/\s+/g, '_');
          if (['EN_REVISION', 'HABILITADA', 'RECHAZADA'].includes(rawEst)) {
            estadoVal = rawEst;
          }
        }

        // Mapear la información al esquema del modelo de base de datos
        empresasData.push({
          _pestana:         sheetName,
          nit:              entryMap['nit']                || '',
          razon_social:     entryMap['razon_social']       || '',
          sector_economico: entryMap['sector_economico']   || '',
          direccion:        entryMap['direccion_principal'] || entryMap['direccion'] || '',
          municipio:        entryMap['municipio']           || '',
          datos_contacto: {
            telefono:            entryMap['telefono_empresa'] || entryMap['telefono'] || '',
            correo_corporativo:  entryMap['correo_corporativo']  || ''
          },
          jefe_inmediato: {
            nombre_completo: entryMap['nombre_completo'] || entryMap['jefe_nombre'] || '',
            cargo:           entryMap['cargo']           || entryMap['jefe_cargo']  || '',
            telefono:        entryMap['celular_de_contacto'] || entryMap['jefe_telefono'] || '',
            correo:          entryMap['correo_del_jefe'] || entryMap['jefe_correo']   || ''
          },
          documentacion: {
            rut_url:             entryMap['url_del_rut']             || '',
            camara_comercio_url: entryMap['url_camara_de_comercio']   || ''
          },
          estado: estadoVal
        });
      }
    }

    if (empresasData.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "El archivo no contiene ninguna pestaña con un nombre válido que empiece por 'Empresa' (ej. Empresa 1, Empresa 2, etc.) o están vacías." 
      });
    }

    // Separar filas sin datos obligatorios para reportarlos como errores inmediatos
    const conDatos  = empresasData.filter(e => e.nit && e.razon_social);
    const sinDatos  = empresasData
      .filter(e => !e.nit || !e.razon_social)
      .map(e => ({ fila: e._pestana, nit: e.nit || '—', motivo: 'Faltan NIT o Razón Social' }));

    // Limpiar el campo temporal _pestana antes de enviar al servicio de guardado
    const payload = conDatos.map(({ _pestana, ...rest }) => rest);

    const result = await service.bulkCrear(payload);

    // Construir la lista completa de omitidas cruzando con el nombre de la pestaña original
    const omitidas = [
      ...sinDatos,
      ...result.omitidas.map(o => ({
        fila: empresasData.find(e => e.nit === o.nit)?._pestana || '—',
        nit: o.nit || '—',
        motivo: o.motivo
      }))
    ];

    return res.status(201).json({
      success:  true,
      creadas:  result.creadas.length,
      omitidas: omitidas.length,
      detalle_omitidas: omitidas
    });

  } catch (error) {
    console.error('[uploadXlsx]', error);
    res.status(500).json({ success: false, message: 'Error al procesar el archivo: ' + error.message });
  }
};

/**
 * POST /api/companies
 * Crear nueva empresa.
 */
const crear = async (req, res) => {
  try {
    const empresa = await service.crear(req.body);
    res.status(201).json({ success: true, data: empresa });
  } catch (error) {
    const status = error.message.includes('Ya existe') ? 409 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/companies/bulk
 * Crear múltiples empresas desde archivo plano (SGVA) — JSON array.
 */
const bulkCrear = async (req, res) => {
  try {
    const empresasData = req.body;
    if (!Array.isArray(empresasData)) {
      return res.status(400).json({ success: false, message: 'El cuerpo debe ser un arreglo de empresas.' });
    }
    const result = await service.bulkCrear(empresasData);
    res.status(201).json({
      success: true,
      creadas: result.creadas.length,
      omitidas: result.omitidas.length,
      detalle_omitidas: result.omitidas,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/companies
 * Listar empresas (con busqueda opcional via query ?busqueda=).
 */
const getAll = async (req, res) => {
  try {
    const filtros = {};
    if (req.query.busqueda) filtros.busqueda = req.query.busqueda;
    const empresas = await service.getAll(filtros);
    res.json({ success: true, count: empresas.length, data: empresas });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/companies/:id
 * Detalle de una empresa.
 */
const getById = async (req, res) => {
  try {
    const empresa = await service.getById(req.params.id);
    res.json({ success: true, data: empresa });
  } catch (error) {
    const status = error.message.includes('no encontrada') ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/companies/:id
 * Actualizar empresa.
 */
const actualizar = async (req, res) => {
  try {
    const empresa = await service.actualizar(req.params.id, req.body);
    res.json({ success: true, data: empresa });
  } catch (error) {
    const status = error.message.includes('no encontrada') ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/companies/:id
 * Eliminar empresa.
 */
const eliminar = async (req, res) => {
  try {
    await service.eliminar(req.params.id);
    res.json({ success: true, message: 'Empresa eliminada correctamente.' });
  } catch (error) {
    const status = error.message.includes('no encontrada') ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

module.exports = {
  downloadTemplate,
  uploadXlsx,
  crear,
  bulkCrear,
  getAll,
  getById,
  actualizar,
  eliminar,
};