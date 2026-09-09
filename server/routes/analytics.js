const express = require('express');
const { db } = require('../db/database');
const { authenticate, requireRestaurantOwner } = require('../middleware/auth');

const router = express.Router();

// Restaurant analytics
router.get('/restaurant/:restaurantId', authenticate, requireRestaurantOwner, (req, res) => {
  try {
    const restaurantId = req.params.restaurantId;

    // 1. Order counts by status
    const counts = db.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted_count,
        SUM(CASE WHEN status = 'preparing' THEN 1 ELSE 0 END) as preparing_count,
        SUM(CASE WHEN status = 'ready' THEN 1 ELSE 0 END) as ready_count,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN status = 'cancelled' OR status = 'rejected' THEN 1 ELSE 0 END) as cancelled_count
      FROM orders
      WHERE restaurant_id = ?
    `).get(restaurantId);

    // 2. Revenue calculations
    const todayRevenue = db.prepare(`
      SELECT COALESCE(SUM(total), 0) as revenue
      FROM orders
      WHERE restaurant_id = ? 
        AND status = 'completed'
        AND date(created_at) = date('now')
    `).get(restaurantId).revenue;

    const weekRevenue = db.prepare(`
      SELECT COALESCE(SUM(total), 0) as revenue
      FROM orders
      WHERE restaurant_id = ? 
        AND status = 'completed'
        AND created_at >= datetime('now', '-7 days')
    `).get(restaurantId).revenue;

    const monthRevenue = db.prepare(`
      SELECT COALESCE(SUM(total), 0) as revenue
      FROM orders
      WHERE restaurant_id = ? 
        AND status = 'completed'
        AND created_at >= datetime('now', '-30 days')
    `).get(restaurantId).revenue;

    const totalRevenue = db.prepare(`
      SELECT COALESCE(SUM(total), 0) as revenue
      FROM orders
      WHERE restaurant_id = ? AND status = 'completed'
    `).get(restaurantId).revenue;

    // 3. Popular menu items
    const popularItems = db.prepare(`
      SELECT 
        oi.item_name,
        SUM(oi.quantity) as total_sold,
        SUM(oi.total_price) as total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.restaurant_id = ? AND o.status = 'completed'
      GROUP BY oi.item_name
      ORDER BY total_sold DESC
      LIMIT 8
    `).all(restaurantId);

    // 4. Daily revenue chart (last 7 days)
    const dailyTrend = db.prepare(`
      SELECT 
        strftime('%m-%d', created_at) as day_label,
        COUNT(id) as order_count,
        COALESCE(SUM(total), 0) as revenue
      FROM orders
      WHERE restaurant_id = ? AND status = 'completed' AND created_at >= datetime('now', '-7 days')
      GROUP BY day_label
      ORDER BY day_label ASC
    `).all(restaurantId);

    // 5. Peak ordering hours
    const peakHours = db.prepare(`
      SELECT 
        strftime('%H:00', created_at) as hour_slot,
        COUNT(id) as order_count
      FROM orders
      WHERE restaurant_id = ?
      GROUP BY hour_slot
      ORDER BY hour_slot ASC
    `).all(restaurantId);

    res.json({
      metrics: {
        todayOrders: counts.total_orders || 0,
        pending: counts.pending_count || 0,
        accepted: counts.accepted_count || 0,
        preparing: counts.preparing_count || 0,
        ready: counts.ready_count || 0,
        completed: counts.completed_count || 0,
        cancelled: counts.cancelled_count || 0,
        todayRevenue: Math.round(todayRevenue),
        weekRevenue: Math.round(weekRevenue),
        monthRevenue: Math.round(monthRevenue),
        totalRevenue: Math.round(totalRevenue)
      },
      popularItems,
      dailyTrend,
      peakHours
    });
  } catch (err) {
    console.error('Fetch analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics data.' });
  }
});

module.exports = router;
