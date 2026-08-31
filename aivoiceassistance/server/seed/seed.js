const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const connectDB = require('../config/db');
const { runSeed } = require('./seedData');

const execute = async () => {
  try {
    await connectDB();
    console.log('[Seed] Seeding database records...');
    const created = await runSeed();
    console.log(`[Seed] Successfully seeded ${created.length} demo customers and follow-ups!`);
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]:', err.message);
    process.exit(1);
  }
};

execute();
