const mongoose = require('mongoose');

const connectDB = async () => {
  let uri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL;

  if (uri) {
    uri = uri.trim();
    if ((uri.startsWith('"') && uri.endsWith('"')) || (uri.startsWith("'") && uri.endsWith("'"))) {
      uri = uri.slice(1, -1).trim();
    }
  }

  if (!uri) {
    console.error('FATAL ERROR: No MongoDB URI found. Please set MONGO_URI in your environment variables.');
  }

  try {
    const conn = await mongoose.connect(uri || 'mongodb://127.0.0.1:27017/ems_database');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
