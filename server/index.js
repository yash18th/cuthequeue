const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { db, initDatabase } = require('./db/database');
const { seed } = require('./db/seed');
const authRoutes = require('./routes/auth');
const restaurantRoutes = require('./routes/restaurants');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const analyticsRoutes = require('./routes/analytics');
const superadminRoutes = require('./routes/superadmin');
const showcaseRoutes = require('./routes/showcases');

const app = express();
const server = http.createServer(app);

const ALLOWED_ORIGINS = [
  'https://cuthequeue.vercel.app',
  'https://cuthequeue-admin.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://localhost:5001',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (tools, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (
      ALLOWED_ORIGINS.includes(origin) ||
      /^https:\/\/cuthequeue(-admin)?.*\.vercel\.app$/.test(origin) ||
      /^http:\/\/localhost:\d+$/.test(origin) ||
      /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)
    ) {
      return callback(null, true);
    }
    // Safe fallback for other authorized origins
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Socket.io initialization with CORS allowlist
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling']
});

app.use(cors(corsOptions));
app.use(express.json());

// Attach Socket.io instance to request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/showcases', showcaseRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Cut the Queue API'
  });
});

// Socket.IO Room Subscriptions & Logging
io.on('connection', (socket) => {
  console.log(`⚡ [Socket] Client connected: ${socket.id}`);

  // Join restaurant or branch room for live kitchen updates
  socket.on('join:restaurant', (restaurantId) => {
    if (restaurantId) {
      socket.join(`restaurant_${restaurantId}`);
      socket.join(`branch:${restaurantId}`);
      console.log(`[Socket] ${socket.id} joined restaurant_${restaurantId} & branch:${restaurantId}`);
    }
  });

  socket.on('join:branch', (branchId) => {
    if (branchId) {
      socket.join(`branch:${branchId}`);
      socket.join(`restaurant_${branchId}`);
      console.log(`[Socket] ${socket.id} joined branch:${branchId} & restaurant_${branchId}`);
    }
  });

  // Join customer room for personal notifications
  socket.on('join:customer', (customerId) => {
    if (customerId) {
      socket.join(`customer_${customerId}`);
      console.log(`[Socket] ${socket.id} joined customer_${customerId}`);
    }
  });

  // Join specific order tracking room
  socket.on('join:order', (orderId) => {
    if (orderId) {
      socket.join(`order_${orderId}`);
      console.log(`[Socket] ${socket.id} joined order_${orderId}`);
    }
  });

  socket.on('leave:order', (orderId) => {
    if (orderId) {
      socket.leave(`order_${orderId}`);
      console.log(`[Socket] ${socket.id} left order_${orderId}`);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`[Socket] Client ${socket.id} disconnected (${reason})`);
  });

  socket.on('error', (err) => {
    console.error(`⚠️ [Socket] Error on ${socket.id}:`, err);
  });
});

const PORT = process.env.PORT || 5001;

async function startServer() {
  try {
    // 1. Initialize database schema, tables, and migrations
    initDatabase();
    console.log('Database initialized');

    // 2. Safely and idempotently seed required initial accounts, brands, restaurants, and menu
    await seed();
    console.log('Database seed completed');

    // 3. Start Express HTTP & WebSocket server on 0.0.0.0
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server listening on port ${PORT}`);
      console.log(`🚀 Cut the Queue Server running on http://0.0.0.0:${PORT}`);
      console.log(`⚡ Real-Time WebSockets active on port ${PORT}`);
    });
  } catch (err) {
    console.error('Fatal error during server startup:', err);
    process.exit(1);
  }
}

startServer();
