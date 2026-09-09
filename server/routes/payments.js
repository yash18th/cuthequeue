const express = require('express');
const { db } = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Process / Verify payment for an order
router.post('/process', authenticate, (req, res) => {
  try {
    const { order_id, method = 'upi', simulate_failure = false } = req.body;

    if (!order_id) {
      return res.status(400).json({ error: 'Order ID is required.' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (order.customer_id !== req.user.id && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    let payment = db.prepare('SELECT * FROM payments WHERE order_id = ?').get(order.id);

    if (simulate_failure) {
      if (payment) {
        db.prepare('UPDATE payments SET status = ? WHERE id = ?').run('failed', payment.id);
      }
      return res.status(400).json({
        success: false,
        status: 'failed',
        error: 'Payment couldn’t be completed by your banking provider. Please try again.'
      });
    }

    const txnRef = `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    if (payment) {
      db.prepare('UPDATE payments SET status = ?, method = ?, transaction_ref = ? WHERE id = ?')
        .run('successful', method, txnRef, payment.id);
      payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(payment.id);
    } else {
      const result = db.prepare(`
        INSERT INTO payments (order_id, amount, status, method, transaction_ref)
        VALUES (?, ?, 'successful', ?, ?)
      `).run(order.id, order.total, method, txnRef);
      payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(result.lastInsertRowid);
    }

    res.json({
      success: true,
      status: 'successful',
      payment,
      message: 'Payment completed successfully.'
    });
  } catch (err) {
    console.error('Payment error:', err);
    res.status(500).json({ error: 'Payment processing error.' });
  }
});

// Refund payment (for cancelled / rejected orders)
router.post('/refund', authenticate, (req, res) => {
  try {
    const { order_id } = req.body;
    const payment = db.prepare('SELECT * FROM payments WHERE order_id = ?').get(order_id);

    if (!payment) {
      return res.status(404).json({ error: 'No payment record found for this order.' });
    }

    db.prepare('UPDATE payments SET status = ? WHERE id = ?').run('refunded', payment.id);
    res.json({ success: true, message: 'Refund initiated and completed.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process refund.' });
  }
});

module.exports = router;
