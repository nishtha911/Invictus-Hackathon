const mongoose = require('mongoose');

let mongoMemoryServer = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/loan_ai_db';

  try {
    console.log(`[MongoDB] Attempting connection to: ${uri}`);
    
    // Set a short selection timeout so if local mongodb is not running, fallback fires quickly
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`[MongoDB] Connected to MongoDB host: ${conn.connection.host}`);
    
    // Sync actual database records from major project
    const { syncFromSupabase } = require('../services/supabaseSync');
    await syncFromSupabase();
    
    return conn;
  } catch (error) {
    console.warn(`[MongoDB Warning] Could not connect to local MongoDB (${error.message}).`);
    console.log('[MongoDB Fallback] Spinning up MongoMemoryServer (In-Memory Database)...');
    
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create();
      const memoryUri = mongoMemoryServer.getUri();
      
      const conn = await mongoose.connect(memoryUri);
      console.log(`[MongoDB Memory] Successfully connected to In-Memory DB: ${memoryUri}`);

      // Auto-seed demo data into memory DB
      // await seedInMemoryDB();
      
      // Sync actual database records from major project
      const { syncFromSupabase } = require('../services/supabaseSync');
      await syncFromSupabase();

      return conn;
    } catch (memError) {
      console.error('[MongoDB Critical] Failed to initialize MongoMemoryServer:', memError.message);
      process.exit(1);
    }
  }
};

const seedInMemoryDB = async () => {
  try {
    const Customer = require('../models/Customer');
    const count = await Customer.countDocuments({});
    if (count === 0) {
      console.log('[MongoDB Memory] Auto-seeding 10 demo customers into In-Memory DB...');
      const seedScript = require('../seed/seedData');
      await seedScript.runSeed();
    }
  } catch (err) {
    console.error('[MongoDB Memory Seed Error]:', err.message);
  }
};

module.exports = connectDB;
