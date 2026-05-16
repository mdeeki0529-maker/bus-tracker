/**
 * server.js
 * Entry point – creates the Express app, attaches Socket.IO,
 * and starts listening.
 */

require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { Server: SocketIOServer } = require('socket.io');

const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');
const socketService = require('./services/socketService');

const busRoutes = require('./routes/buses');
const routeRoutes = require('./routes/routes');

// ─── App setup ────────────────────────────────────────────────────────────────

const app = express();
const server = http.createServer(app);

// Parse allowed origins from env (comma-separated list)
const allowedOrigins = (process.env.CORS_ORIGINS || '*').split(',').map((s) => s.trim());

// ─── Socket.IO ────────────────────────────────────────────────────────────────

const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
  // Ping every 10 s to detect stale connections quickly
  pingInterval: 10_000,
  pingTimeout: 5_000,
});

socketService.init(io);

// ─── Express middleware ────────────────────────────────────────────────────────

app.use(
  helmet({
    // Allow loading Leaflet map tiles from external CDNs
    contentSecurityPolicy: false,
  })
);

app.use(
  cors({
    origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  })
);

app.use(express.json({ limit: '10kb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate-limit all API calls (more aggressive limit for GPS endpoint is set
// in the GPS device itself via the API key; here we protect the public API)
app.use(
  '/api',
  rateLimit({
    windowMs: 60_000, // 1 minute
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ─── Routes ────────────────────────────────────────────────────────────────────

app.use('/api/buses', busRoutes);
app.use('/api/routes', routeRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date() }));

// 404 catch-all
app.use((_req, res) => res.status(404).json({ error: 'Not found.' }));

// Central error handler (must be last)
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT, 10) || 3001;

server.listen(PORT, () => {
  logger.info(`🚌  Bus Tracker API running on port ${PORT}  [${process.env.NODE_ENV || 'development'}]`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received – shutting down gracefully');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io }; // exported for testing
