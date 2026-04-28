require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { connectDB } = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');

const authRoutes    = require('./routes/auth');
const postRoutes    = require('./routes/posts');
const voiceRoutes   = require('./routes/voice');
const billingRoutes = require('./routes/billing');

const app = express();

// Security headers
app.use(helmet());

// CORS — restricted to frontend URL only, never wildcard in production
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Billing webhook needs raw body for signature verification — must come before express.json()
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// Health check for Railway/Vercel uptime monitoring
app.get('/health', (req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// Routes
app.use('/api/auth',    authRoutes);
app.use('/api/posts',   postRoutes);
app.use('/api/voice',   voiceRoutes);
app.use('/api/billing', billingRoutes);

// 404 catch-all
app.use('*', (req, res) =>
  res.status(404).json({ success: false, error: 'Route not found', code: 'NOT_FOUND' })
);

// Centralised error handler — must be last middleware
app.use(errorHandler);

// Boot
connectDB()
  .then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`[server] Running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('[server] Failed to start:', err.message);
    process.exit(1);
  });
