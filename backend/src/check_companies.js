const mongoose = require('mongoose');

const mongoUri = 'mongodb+srv://SantiagoCis046:santiago1522@cluster0.qtyaki3.mongodb.net/repfora_db?retryWrites=true&w=majority&appName=Cluster0';

const run = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to DB');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    const companies = await db.collection('companies').find({}).toArray();
    console.log('Companies count:', companies.length);
    companies.forEach(c => {
      console.log(`- ${c.razon_social} (NIT: ${c.nit}):`);
      console.log(`  direccion: ${c.direccion}`);
      console.log(`  municipio: ${c.municipio}`);
      console.log(`  sector_economico: ${c.sector_economico}`);
      console.log(`  datos_contacto: ${JSON.stringify(c.datos_contacto)}`);
      console.log(`  jefe_inmediato: ${JSON.stringify(c.jefe_inmediato)}`);
      console.log(`  documentacion: ${JSON.stringify(c.documentacion)}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
