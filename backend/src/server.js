const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const { initReminderScheduler, checkAndSendReminders } = require('./services/reminderScheduler');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

// Start background reminder scheduler
initReminderScheduler();

const app = express();

// Security headers — disable CSP so React/Vite SPA assets load correctly
app.use(helmet({ contentSecurityPolicy: false }));

// CORS — applied to /api routes only; static files are same-origin and need no CORS
// Origin is derived dynamically from the request Host header so no env var is required
app.use('/api', (req, res, next) => {
  const staticOrigins = [
    process.env.APP_URL,
    'http://localhost:3000',
    'http://localhost:5173',
  ].filter(Boolean);
  const selfOrigin = `${req.protocol}://${req.headers.host}`;
  const allowed = [...staticOrigins, selfOrigin];

  cors({
    origin: (origin, callback) => {
      if (!origin || allowed.includes(origin)) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })(req, res, next);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting — strict for sensitive auth endpoints, relaxed for others
const authStrictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' },
});

const authGeneralLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' },
});

// API Routes
app.use('/api/auth/login', authStrictLimiter);
app.use('/api/auth/register', authStrictLimiter);
app.use('/api/auth/forgot-password', authStrictLimiter);
app.use('/api/auth', authGeneralLimiter);
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/todos', require('./routes/todoRoutes'));
app.use('/api/activities', require('./routes/activityRoutes'));
app.use('/api/push', require('./routes/pushRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// External cron trigger — called by cron-job.org every minute to run reminders
// even when Render free tier would otherwise be spun down
app.post('/api/internal/run-reminders', async (req, res) => {
  const secret = req.headers['x-cron-secret'];
  if (!process.env.INTERNAL_CRON_SECRET || secret !== process.env.INTERNAL_CRON_SECRET) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  try {
    await checkAndSendReminders();
    res.json({ success: true, ran: true, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const path = require('path');
const fs = require('fs');

// Serve frontend static build if present
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));

  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  // Fallback root endpoint
  app.get('/', (req, res) => {
    res.send('Todo App API is running');
  });
}

// 404 Handler for API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found at ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = app;
