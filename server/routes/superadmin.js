const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../db/database');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Apply super_admin guard to all routes here
router.use(authenticate, requireRole('super_admin'));

// Platform Overview Metrics
router.get('/overview', (req, res) => {
  try {
    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role != 'super_admin'").get().count;
    const totalCustomers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'customer'").get().count;
    const totalAdmins = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'restaurant_admin'").get().count;

    const totalRestaurants = db.prepare('SELECT COUNT(*) as count FROM restaurants').get().count;
    const activeRestaurants = db.prepare('SELECT COUNT(*) as count FROM restaurants WHERE is_approved = 1 AND is_suspended = 0').get().count;

    const orderStats = db.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
        SUM(CASE WHEN status = 'cancelled' OR status = 'rejected' THEN 1 ELSE 0 END) as cancelled_orders,
        COALESCE(SUM(total), 0) as gross_volume,
        COALESCE(SUM(fee), 0) as platform_fees
      FROM orders
    `).get();

    const recentOrders = db.prepare(`
      SELECT o.*, r.name as restaurant_name, u.name as customer_name
      FROM orders o
      JOIN restaurants r ON o.restaurant_id = r.id
      JOIN users u ON o.customer_id = u.id
      ORDER BY o.id DESC
      LIMIT 10
    `).all();

    res.json({
      metrics: {
        totalUsers,
        totalCustomers,
        totalAdmins,
        totalRestaurants,
        activeRestaurants,
        totalOrders: orderStats.total_orders || 0,
        completedOrders: orderStats.completed_orders || 0,
        cancelledOrders: orderStats.cancelled_orders || 0,
        grossVolume: Math.round(orderStats.gross_volume || 0),
        platformFees: Math.round(orderStats.platform_fees || 0)
      },
      recentOrders
    });
  } catch (err) {
    console.error('Superadmin overview error:', err);
    res.status(500).json({ error: 'Failed to fetch platform metrics.' });
  }
});

// Manage Restaurants
router.get('/restaurants', (req, res) => {
  try {
    const restaurants = db.prepare(`
      SELECT r.*, u.name as owner_name, u.email as owner_email,
             (SELECT COUNT(*) FROM orders o WHERE o.restaurant_id = r.id) as total_orders,
             (SELECT COALESCE(SUM(total), 0) FROM orders o WHERE o.restaurant_id = r.id AND o.status = 'completed') as total_revenue
      FROM restaurants r
      LEFT JOIN users u ON r.owner_id = u.id
      ORDER BY r.id DESC
    `).all();

    res.json(restaurants);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch restaurants.' });
  }
});

// Toggle restaurant suspension / approval
router.patch('/restaurants/:id/status', (req, res) => {
  try {
    const { is_approved, is_suspended } = req.body;
    const rest = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(req.params.id);
    if (!rest) {
      return res.status(404).json({ error: 'Restaurant not found.' });
    }

    db.prepare(`
      UPDATE restaurants
      SET is_approved = COALESCE(?, is_approved),
          is_suspended = COALESCE(?, is_suspended)
      WHERE id = ?
    `).run(is_approved, is_suspended, req.params.id);

    const updated = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(req.params.id);
    res.json({ message: 'Restaurant updated successfully', restaurant: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update restaurant.' });
  }
});

// Manage Users
router.get('/users', (req, res) => {
  try {
    const users = db.prepare(`
      SELECT u.id, u.name, u.email, u.phone, u.role, u.is_suspended, u.created_at,
             (SELECT COUNT(*) FROM orders o WHERE o.customer_id = u.id) as customer_orders_count
      FROM users u
      WHERE u.role != 'super_admin'
      ORDER BY u.id DESC
    `).all();

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// Toggle user suspension
router.patch('/users/:id/toggle-suspend', (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    if (user.role === 'super_admin') {
      return res.status(400).json({ error: 'Cannot suspend a super admin account.' });
    }

    const newSuspended = user.is_suspended ? 0 : 1;
    db.prepare('UPDATE users SET is_suspended = ? WHERE id = ?').run(newSuspended, req.params.id);

    res.json({
      message: `User account ${newSuspended ? 'suspended' : 'reactivated'}`,
      is_suspended: newSuspended
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle user status.' });
  }
});

// Global Orders
router.get('/orders', (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT o.*, r.name as restaurant_name, u.name as customer_name,
             p.status as payment_status, p.method as payment_method
      FROM orders o
      JOIN restaurants r ON o.restaurant_id = r.id
      JOIN users u ON o.customer_id = u.id
      LEFT JOIN payments p ON o.id = p.order_id
      ORDER BY o.id DESC
      LIMIT 100
    `).all();

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

module.exports = router;
