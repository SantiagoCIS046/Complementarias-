const mongoose = require('mongoose');

const mongoUri = 'mongodb+srv://SantiagoCis046:santiago1522@cluster0.qtyaki3.mongodb.net/repfora_db?retryWrites=true&w=majority&appName=Cluster0';

const run = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to DB');
    
    const db = mongoose.connection.db;
    const users = await db.collection('users').find({}).toArray();
    console.log('Users count:', users.length);
    users.forEach(u => {
      console.log(`- ID: ${u._id}, Email: ${u.email}, Role: ${u.role}, Name: ${u.name}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
