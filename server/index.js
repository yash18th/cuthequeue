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

// Ensure database is initialized
initDatabase();

// Auto-seed initial kitchens and menu data if database is empty (e.g. fresh Render deployment)
try {
  const row = db.prepare('SELECT count(*) as count FROM restaurants').get();
  if (!row || row.count === 0) {
    console.log('⚡ Empty database detected on startup. Auto-seeding initial restaurants and demo accounts...');
    seed().catch(err => console.error('Auto-seeding error:', err));
  }
} catch (err) {
  console.error('Auto-seed check failed:', err);
}

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

// Socket.IO Room Subscriptions
io.on('connection', (socket) => {
  // Join restaurant room for live kitchen updates
  socket.on('join:restaurant', (restaurantId) => {
    if (restaurantId) {
      socket.join(`restaurant_${restaurantId}`);
    }
  });

  // Join customer room for personal notifications
  socket.on('join:customer', (customerId) => {
    if (customerId) {
      socket.join(`customer_${customerId}`);
    }
  });

  // Join specific order tracking room
  socket.on('join:order', (orderId) => {
    if (orderId) {
      socket.join(`order_${orderId}`);
    }
  });

  socket.on('leave:order', (orderId) => {
    if (orderId) {
      socket.leave(`order_${orderId}`);
    }
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 Cut the Queue Server running on http://localhost:${PORT}`);
  console.log(`⚡ Real-Time WebSockets active on ws://localhost:${PORT}`);
});
