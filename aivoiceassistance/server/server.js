const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const followUpScheduler = require('./jobs/followUpScheduler');

// Import Routes
const customerRoutes = require('./routes/customerRoutes');
const followUpRoutes = require('./routes/followUpRoutes');
const callRoutes = require('./routes/callRoutes');
const aiToolRoutes = require('./routes/aiToolRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 5001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'AI-Powered Loan Customer Follow-up & Voice Calling API',
    timestamp: new Date(),
    mockVoiceEnabled: process.env.ENABLE_MOCK_VOICE === 'true'
  });
});

// API Routes
app.use('/api/customers', customerRoutes);
app.use('/api/followups', followUpRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/ai-tools', aiToolRoutes);
app.use('/api/voice', webhookRoutes);
app.use('/api/analytics', analyticsRoutes);

// Global 404 Route Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start DB & Server with Automatic Port Retry
const startServer = async () => {
  await connectDB();

  const listenOnPort = (portToTry) => {
    const server = app.listen(portToTry, () => {
      console.log(`=======================================================`);
      console.log(`🚀 Loan AI Server running on http://localhost:${portToTry}`);
      console.log(`🎙️ Voice Provider: ${process.env.VOICE_AI_PROVIDER || 'vapi'}`);
      console.log(`🤖 Mock Mode: ${process.env.ENABLE_MOCK_VOICE === 'true' ? 'ENABLED' : 'DISABLED'}`);
      console.log(`=======================================================`);

      // Start background follow-up scheduler
      followUpScheduler.start();
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`[Port Conflict] Port ${portToTry} is already in use. Retrying on port ${portToTry + 1}...`);
        setTimeout(() => listenOnPort(portToTry + 1), 500);
      } else {
        console.error('[Server Error]:', err);
      }
    });
  };

  listenOnPort(DEFAULT_PORT);
};

startServer();
