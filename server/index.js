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

const app = express();
const server = http.createServer(app);

// Socket.io initialization with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  }
});

app.use(cors());
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

  // Join restaurant room for live kitchen updates
  socket.on('join:restaurant', (restaurantId) => {
    if (restaurantId) {
      socket.join(`restaurant_${restaurantId}`);
      console.log(`[Socket] ${socket.id} joined restaurant_${restaurantId}`);
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
