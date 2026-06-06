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
    console.log('🗑️  Colecciones e índices viejos limpiados.');

    // CONTRASEÑA EN TEXTO PLANO - el modelo real la hashea automáticamente
    const PASSWORD = 'sena2024';

    // 1. ADMINISTRADOR
    const admin = await User.create({
      name: 'Administrador del Sistema Santiago Cisneros',
      email: 'santiagocisneros046@gmail.com',
      password: PASSWORD,
      role: 'ADMIN',
      documento: '1037658690',
      isFirstLogin: false
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
      status: 'ACTIVO',
      isFirstLogin: true
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
      status: 'ACTIVO',
      isFirstLogin: true
    });
    console.log('✅ Instructor Multimedia creado:', instructor2.email);

    // 3. APRENDICES (vinculados al instructor)
    const a1 = await User.create({
      name: 'Juan Mancilla',
      email: 'mancilla@gmail.com',
      password: PASSWORD,
      role: 'APRENDIZ',
      documento: '1037000111',
      ficha: '2670687',
      instructorAsignado: instructor._id,
      fechaAsignacionInstructor: new Date(),
      isFirstLogin: true
    });

    const a2 = await User.create({
      name: 'Daniela Palacio',
      email: 'dpalacio@soy.sena.edu.co',
      password: PASSWORD,
      role: 'APRENDIZ',
      documento: '1037000333',
      ficha: '2558342',
      instructorAsignado: instructor._id,
      fechaAsignacionInstructor: new Date(),
      isFirstLogin: true
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
        sector_economico: 'Logística y Transporte',
        estado: 'EN_REVISION',
        datos_contacto: { telefono: '6076301122', correo_corporativo: 'contacto@globallogistica.co' },
        jefe_inmediato: { nombre_completo: 'Carlos Mendoza', cargo: 'Gerente de Operaciones', telefono: '3187778899', correo: 'cmendoza@globallogistica.co' }
      },
      {
        razon_social: 'Inversiones Delta',
        nit: '880.992.451-0',
        direccion: 'Carrera 9 #12-34',
        municipio: 'San Gil',
        sector_economico: 'Servicios Financieros',
        estado: 'HABILITADA',
        datos_contacto: { telefono: '6077241122', correo_corporativo: 'info@inversionesdelta.com' },
        jefe_inmediato: { nombre_completo: 'Martha Lucía Gómez', cargo: 'Coordinadora Administrativa', telefono: '3165554433', correo: 'mgomez@inversionesdelta.com' }
      },
      {
        razon_social: 'Constructora Bolívar',
        nit: '830.005.123-4',
        direccion: 'Calle 50 #28-40',
        municipio: 'Bucaramanga',
        sector_economico: 'Construcción',
        estado: 'HABILITADA',
        datos_contacto: { telefono: '6076402233', correo_corporativo: 'servicioalcliente@cbolivar.com' },
        jefe_inmediato: { nombre_completo: 'Andrés Felipe Castro', cargo: 'Director de Obra', telefono: '3178889900', correo: 'acastro@cbolivar.com' }
      },
      {
        razon_social: 'Servicios Integrales SAS',
        nit: '900.551.442-8',
        direccion: 'Diagonal 15 #55-60',
        municipio: 'Socorro',
        sector_economico: 'Servicios',
        estado: 'RECHAZADA',
        datos_contacto: { telefono: '6077274455', correo_corporativo: 'gerencia@serviciosintegrales.com.co' },
        jefe_inmediato: { nombre_completo: 'Sandra Milena Rojas', cargo: 'Jefe de Gestión Humana', telefono: '3124445577', correo: 'srojas@serviciosintegrales.com.co' }
      },
      {
        razon_social: 'BioMedica Research',
        nit: '880.112.990-2',
        direccion: 'Transversal 3 #8-15',
        municipio: 'San Gil',
        sector_economico: 'Salud',
        estado: 'EN_REVISION',
        datos_contacto: { telefono: '6077249988', correo_corporativo: 'contacto@biomedicaresearch.org' },
        jefe_inmediato: { nombre_completo: 'Dr. Alberto Restrepo', cargo: 'Director de Investigación', telefono: '3109998877', correo: 'arestrepo@biomedicaresearch.org' }
      },
      {
        razon_social: 'Bancolombia S.A.',
        nit: '890.903.938-8',
        direccion: 'Calle 12 #10-05',
        municipio: 'San Gil',
        sector_economico: 'Servicios Financieros',
        estado: 'HABILITADA',
        datos_contacto: { telefono: '6077243344', correo_corporativo: 'sucursal_sangil@bancolombia.com.co' },
        jefe_inmediato: { nombre_completo: 'María Constanza Ortiz', cargo: 'Gerente de Sucursal', telefono: '3156667788', correo: 'mortiz@bancolombia.com.co' }
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
    // Comentado para permitir que los aprendices inicien sin etapas ni empresas vinculadas por defecto y puedan probar el flujo de registro desde cero.
    /*
    await ProductiveStage.create({
      apprenticeId: a1._id,
      instructorId: instructor._id,
      companyId: co1._id,
      ficha: '2670687',
      estado: 'REGISTRO',
      tipoFormacion: 'PRESENCIAL',
      modalidad: 'CONTRATO_APRENDIZAJE',
      horasCompletadas: 0,
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
      horasCompletadas: 0,
      horasRequeridas: 864
    });
    console.log('✅ Etapas productivas vinculadas.');
    */

    // 6. FICHAS (NUEVO MODELO)
    await Batch.create({
      codigo_ficha: '2670687',
      programa: 'Análisis y Desarrollo de Software',
      nivel_formacion: 'Tecnólogo',
      fecha_inicio_ep: new Date('2026-02-15'),
      fecha_fin_ep: new Date('2026-08-15'),
      instructor_asignado: {
        instructor_id: instructor._id,
        nombre: instructor.name,
        fecha_asignacion: new Date()
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
        nombre: instructor2.name,
        fecha_asignacion: new Date()
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
