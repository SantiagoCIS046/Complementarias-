// seed.js - Script de Sembrado Real para RepFora E.P.
// Usa los modelos REALES del backend para evitar conflictos de esquema
const mongoose = require('mongoose');
const path = require('path');

// Cargar variables de entorno del backend
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Importar el modelo REAL del backend (con el middleware de hashing)
const User = require('./src/modules/users-dev1/user.model');
const Company = require('./src/modules/companies-dev2/company.model');
const ProductiveStage = require('./src/modules/productive-stages-dev2/productive-stage.model');
const Batch = require('./src/modules/batches-dev1/batch.model');
const SystemConfig = require('./src/modules/system-config-dev1/system-config.model');

// Usa la MISMA conexión que el backend (MongoDB Atlas)
const MONGO_URI = process.env.MONGO_URI;
console.log('📡 Base de datos destino:', MONGO_URI ? 'MongoDB Atlas (Nube)' : '❌ MONGO_URI no encontrada');

async function runSeed() {
  try {
    console.log('🚀 Conectando a MongoDB...');
    await mongoose.connect(MONGO_URI);
    
    // Limpieza
    await User.collection.drop().catch(e => console.log('Colección users ya limpia o inexistente'));
    await Company.collection.drop().catch(e => console.log('Colección companies ya limpia o inexistente'));
    await ProductiveStage.collection.drop().catch(e => console.log('Colección productivestages ya limpia o inexistente'));
    await Batch.collection.drop().catch(e => console.log('Colección batches ya limpia o inexistente'));
    await SystemConfig.collection.drop().catch(e => console.log('Colección systemconfigs ya limpia o inexistente'));
    console.log('🗑️  Colecciones e índices viejos limpiados.');

    // CONTRASEÑA EN TEXTO PLANO - el modelo real la hashea automáticamente
    const PASSWORD = 'sena2024';

    // 1. ADMINISTRADOR
    const admin = await User.create({
      name: 'Administrador del Sistema Santiago Cisneros',
      email: 'santiagocisneros046@gmail.com',
      password: PASSWORD,
      role: 'ADMIN',
      documento: '1037658690'
    });
    console.log('✅ Admin creado:', admin.email);

    // 2. INSTRUCTOR (Especialista en ADSO)
    const instructor = await User.create({
      name: 'Martin Pérez',
      email: 'martin@gmail.com',
      password: PASSWORD,
      role: 'INSTRUCTOR',
      documento: '123475869',
      programa: 'Análisis y Desarrollo de Software',
      status: 'ACTIVO'
    });
    console.log('✅ Instructor ADSO creado:', instructor.email);

    // INSTRUCTOR 2 (Especialista en Multimedia)
    const instructor2 = await User.create({
      name: 'Elena Rodríguez',
      email: 'elena@gmail.com',
      password: PASSWORD,
      role: 'INSTRUCTOR',
      documento: '987654321',
      programa: 'Multimedia',
      status: 'ACTIVO'
    });
    console.log('✅ Instructor Multimedia creado:', instructor2.email);

    // 3. APRENDICES (vinculados al instructor)
    const a1 = await User.create({
      name: 'Juan Mancilla',
      email: 'mancilla@gmail.com',
      password: PASSWORD,
      role: 'APRENDIZ',
      documento: '1037000111',
      instructorAsignado: instructor._id
    });

    const a2 = await User.create({
      name: 'Daniela Palacio',
      email: 'dpalacio@soy.sena.edu.co',
      password: PASSWORD,
      role: 'APRENDIZ',
      documento: '1037000333',
      instructorAsignado: instructor._id
    });
    console.log('✅ Aprendices creados: Juan Mancilla, Daniela Palacio');

    // 4. EMPRESAS (Alineadas con el nuevo modelo de REPFORA)
    const companiesData = [
      { 
        razon_social: 'TechSolutions S.A.S.', 
        nit: '900123456-1',
        direccion: 'Calle 10 #15-20, San Gil',
        municipio: 'San Gil',
        sector_economico: 'Tecnología',
        estado: 'HABILITADA',
        datos_contacto: { telefono: '6077240000', correo_corporativo: 'contacto@techsolutions.com' },
        jefe_inmediato: { nombre_completo: 'Juan Pérez', cargo: 'Director de IT', telefono: '3154445566', correo: 'jperez@techsolutions.com' }
      },
      { 
        razon_social: 'Global Logistica Ltda', 
        nit: '901.442.110-3',
        direccion: 'Av. Industrial 45',
        municipio: 'Bucaramanga',
        estado: 'EN_REVISION'
      },
      { 
        razon_social: 'Inversiones Delta', 
        nit: '880.992.451-0',
        estado: 'HABILITADA'
      },
      { 
        razon_social: 'Constructora Bolívar', 
        nit: '830.005.123-4',
        estado: 'HABILITADA'
      },
      { 
        razon_social: 'Servicios Integrales SAS', 
        nit: '900.551.442-8',
        estado: 'RECHAZADA'
      },
      { 
        razon_social: 'BioMedica Research', 
        nit: '880.112.990-2',
        estado: 'EN_REVISION'
      },
      { 
        razon_social: 'Bancolombia S.A.', 
        nit: '890.903.938-8',
        estado: 'HABILITADA'
      }
    ];

    const createdCompanies = [];
    for (const co of companiesData) {
      const created = await Company.create(co);
      createdCompanies.push(created);
    }
    const co1 = createdCompanies[6]; // Bancolombia para la vinculación
    const co2 = createdCompanies[0]; // TechSolutions
    console.log(`✅ ${createdCompanies.length} Empresas creadas.`);

    // 5. ETAPAS PRODUCTIVAS (valores del enum real: enums.js)
    await ProductiveStage.create({
      apprenticeId: a1._id,
      instructorId: instructor._id,
      companyId: co1._id,
      ficha: '2670687',
      estado: 'REGISTRO',
      tipoFormacion: 'PRESENCIAL',
      modalidad: 'CONTRATO_APRENDIZAJE',
      horasCompletadas: 320,
      horasRequeridas: 864
    });

    await ProductiveStage.create({
      apprenticeId: a2._id,
      instructorId: instructor._id,
      companyId: co2._id,
      ficha: '2558342',
      estado: 'REGISTRO',
      tipoFormacion: 'PRESENCIAL',
      modalidad: 'VINCULACION_LABORAL',
      horasCompletadas: 864,
      horasRequeridas: 864
    });
    console.log('✅ Etapas productivas vinculadas.');

    // 6. FICHAS (NUEVO MODELO)
    await Batch.create({
      codigo_ficha: '2670687',
      programa: 'Análisis y Desarrollo de Software',
      nivel_formacion: 'Tecnólogo',
      fecha_inicio_ep: new Date('2026-02-15'),
      fecha_fin_ep: new Date('2026-08-15'),
      instructor_asignado: {
        instructor_id: instructor._id,
        nombre: instructor.name
      },
      estado: 'ACTIVA',
      aprendices_ids: [a1._id]
    });

    await Batch.create({
      codigo_ficha: '2558342',
      programa: 'Multimedia',
      nivel_formacion: 'Tecnólogo',
      fecha_inicio_ep: new Date('2026-01-10'),
      fecha_fin_ep: new Date('2026-07-10'),
      instructor_asignado: {
        instructor_id: instructor2._id,
        nombre: instructor2.name
      },
      estado: 'ACTIVA',
      aprendices_ids: [a2._id]
    });
    
    await Batch.create({
      codigo_ficha: '2800111',
      programa: 'Sistemas',
      nivel_formacion: 'Técnico',
      fecha_inicio_ep: new Date('2026-05-20'),
      fecha_fin_ep: new Date('2026-11-20'),
      estado: 'PENDIENTE_INSTRUCTOR',
      aprendices_ids: []
    });

    console.log('✅ Fichas creadas y vinculadas.');

    // 7. CONFIGURACIÓN DEL SISTEMA
    await SystemConfig.create([
      {
        clave: 'HORAS_REVISION_BITACORAS',
        valor: 1,
        descripcion: 'Horas asignadas por revisión de cada bitácora.'
      },
      {
        clave: 'HORAS_SEGUIMIENTO',
        valor: 2,
        descripcion: 'Horas asignadas por visita/seguimiento programado (defecto 2h).'
      },
      {
        clave: 'HORAS_EXTRAORDINARIOS',
        valor: 2,
        descripcion: 'Horas asignadas por seguimientos extraordinarios o comités.'
      },
      {
        clave: 'HORAS_CERTIFICACION',
        valor: 2,
        descripcion: 'Horas asignadas por el proceso de certificación (2h).'
      },
      {
        clave: 'HORAS_POR_ACTIVIDAD',
        valor: {
          CONTRATO_APRENDIZAJE: 880,
          PASANTIA: 880,
          PROYECTO_PRODUCTIVO: 880,
          MONITORIA: 440,
          VINCULACION_LABORAL: 880
        },
        descripcion: 'Horas de etapa productiva requeridas por modalidad de actividad.'
      }
    ]);
    console.log('✅ Configuraciones del sistema creadas.');

    console.log('\n--- ✅ SINCRONIZACIÓN EXITOSA ---');
    console.log('🔑 ADMIN:      santiagocisneros046@gmail.com / sena2024');
    console.log('🔑 INSTRUCTOR: martin@gmail.com / sena2024');
    console.log('🔑 APRENDIZ:   mancilla@gmail.com / sena2024');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error en el seed:', err.message);
    process.exit(1);
  }
}

runSeed();
