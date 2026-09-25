require('dotenv').config();
const mongoose = require('mongoose');

async function inspectMongoDB() {
  console.log('\n==============================================');
  console.log('       EMS MONGODB CONNECTION INSPECTION       ');
  console.log('==============================================\n');

  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ems_database';
    const conn = await mongoose.connect(mongoUri);

    console.log('Status:        🟢 CONNECTED SUCCESSFULLY');
    console.log(`Database Name: 📁 ${conn.connection.name}`);
    console.log(`Host & Port:   🌐 ${conn.connection.host}:${conn.connection.port}\n`);

    const collections = await conn.connection.db.listCollections().toArray();
    console.log('Collections & Record Counts:');
    console.log('----------------------------------------------');
    for (const c of collections) {
      const count = await conn.connection.db.collection(c.name).countDocuments();
      console.log(` • ${c.name.padEnd(16)} : ${count} records`);
    }

    console.log('\nSample Registered Employees from MongoDB:');
    console.log('----------------------------------------------');
    const User = conn.model('User', new mongoose.Schema({}, { strict: false }));
    const sampleUsers = await User.find({}, { name: 1, email: 1, employeeId: 1, role: 1 }).limit(5);
    sampleUsers.forEach((u, i) => {
      console.log(` ${i + 1}. [${u.role?.toUpperCase()}] ${u.name} (ID: ${u.employeeId || 'N/A'}, Email: ${u.email})`);
    });

    console.log('\n==============================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n🔴 Connection Failed:', err.message);
    console.log('Please ensure MongoDB service is running.\n');
    process.exit(1);
  }
}

inspectMongoDB();
