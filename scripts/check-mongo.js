require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecommerce_delivery';

(async () => {
  try {
    console.log(`Trying to connect to MongoDB at ${uri}`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('MongoDB connected successfully.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('MongoDB connection failed:');
    console.error(err.message || err);
    process.exit(1);
  }
})();
