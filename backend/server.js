require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const path = require('path');

const app = express();
const server = http.createServer(app);

app.set('trust proxy', 1);

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (origin === 'http://localhost:5173') return true;

  try {
    const parsedOrigin = new URL(origin);
    return parsedOrigin.hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
};

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true,
};

const io = new Server(server, {
  cors: {
    ...corsOptions,
    methods: ['GET', 'POST'],
  },
});

// Connect DB
connectDB();

// Verify SMTP config at boot so email misconfiguration is visible in logs immediately
require('./utils/email').verifyEmailConfig();

// Security middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
});
app.use('/api/', limiter);

// Stricter limit for auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
});

// Routes
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/vendors', require('./routes/vendors'));
app.use('/api/users', require('./routes/users'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/reviews', require('./routes/reviews'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// Socket.io chat
require('./socket/chat')(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
