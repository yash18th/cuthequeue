const express = require('express');
const { db } = require('../db/database');
const { authenticate, requireRole, requireRestaurantOwner } = require('../middleware/auth');

const router = express.Router();

// Helper to generate order number like #CQ1043
function generateOrderNumber() {
  const lastOrder = db.prepare('SELECT id FROM orders ORDER BY id DESC LIMIT 1').get();
  const nextId = (lastOrder ? lastOrder.id : 1040) + 1;
  return `#CQ${nextId}`;
}

// Helper to generate secure QR code token
function generateQRToken(orderNumber) {
  const cleanNum = orderNumber.replace('#', '');
  const randomSuffix = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `CQ_QR_${cleanNum}_${randomSuffix}`;
}

// Create new order (Authenticated Customer or User)
router.post('/', authenticate, (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        error: 'Please sign in to place your order.',
        message: 'Please sign in to place your order.',
        code: 'UNAUTHORIZED'
      });
    }

    const {
      restaurant_id,
      items,
      pickup_type = 'asap',
      scheduled_time,
      payment_method = 'upi',
      notes = ''
    } = req.body;

    const targetBranchId = req.body.branch_id || restaurant_id;
    if (!targetBranchId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Restaurant/branch and items are required.' });
    }

    const restaurant = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(targetBranchId);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant branch not found.' });
    }

    if (restaurant.is_suspended) {
      return res.status(400).json({ error: 'Sorry, this restaurant branch is currently suspended.' });
    }

    if (!restaurant.is_open && pickup_type === 'asap') {
      return res.status(400).json({ error: 'Sorry, this restaurant branch is currently closed for instant orders.' });
    }

    // Validate items and calculate prices server-side
    let calculatedSubtotal = 0;
    const validatedItems = [];

    const getItemStmt = db.prepare('SELECT * FROM menu_items WHERE id = ? AND restaurant_id = ?');

    for (const orderItem of items) {
      const itemId = orderItem.menu_item_id || orderItem.id;
      const dbItem = getItemStmt.get(itemId, restaurant.id);
      if (!dbItem) {
        return res.status(400).json({ error: `Item "${orderItem.name || 'Unknown'}" is not available at this restaurant branch.` });
      }

      if (!dbItem.is_available) {
        return res.status(400).json({ error: `"${dbItem.name}" is currently out of stock.` });
      }

      let unitPrice = dbItem.price;
      const selectedCustomizations = orderItem.customizations_selected || {};

      // Calculate customization add-on costs
      const itemCustomizations = JSON.parse(dbItem.customizations_json || '[]');
      for (const group of itemCustomizations) {
        const selected = selectedCustomizations[group.name];
        if (selected) {
          if (group.type === 'single') {
            const opt = group.options.find(o => o.label === selected);
            if (opt) unitPrice += opt.price;
          } else if (group.type === 'multiple' && Array.isArray(selected)) {
            for (const label of selected) {
              const opt = group.options.find(o => o.label === label);
              if (opt) unitPrice += opt.price;
            }
          }
        }
      }

      const qty = Math.max(1, parseInt(orderItem.quantity) || 1);
      const itemTotal = unitPrice * qty;
      calculatedSubtotal += itemTotal;

      validatedItems.push({
        menu_item_id: dbItem.id,
        item_name: dbItem.name,
        quantity: qty,
        unit_price: unitPrice,
        customizations_selected_json: JSON.stringify(selectedCustomizations),
        total_price: itemTotal
      });
    }

    const tax = Math.round(calculatedSubtotal * (restaurant.tax_rate || 0.05) * 100) / 100;
    const convenienceFee = 10.0;
    const discount = 0;
    const finalTotal = Math.round((calculatedSubtotal + tax + convenienceFee - discount) * 100) / 100;

    const orderNumber = generateOrderNumber();
    const qrToken = generateQRToken(orderNumber);

    // Run transaction
    const insertTransaction = db.transaction(() => {
      const orderInsert = db.prepare(`
        INSERT INTO orders (
          order_number, customer_id, restaurant_id, branch_id, status, pickup_type, scheduled_time,
          subtotal, tax, fee, discount, total, qr_code_token, notes
        ) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        orderNumber,
        req.user.id,
        restaurant.id,
        restaurant.id,
        pickup_type,
        scheduled_time || null,
        calculatedSubtotal,
        tax,
        convenienceFee,
        discount,
        finalTotal,
        qrToken,
        notes
      );

      const orderId = orderInsert.lastInsertRowid;

      const itemInsert = db.prepare(`
        INSERT INTO order_items (
          order_id, menu_item_id, item_name, quantity, unit_price, customizations_selected_json, total_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const itm of validatedItems) {
        itemInsert.run(
          orderId,
          itm.menu_item_id,
          itm.item_name,
          itm.quantity,
          itm.unit_price,
          itm.customizations_selected_json,
          itm.total_price
        );
      }

      // Initial payment entry
      const txnRef = `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      db.prepare(`
        INSERT INTO payments (order_id, amount, status, method, transaction_ref)
        VALUES (?, ?, 'successful', ?, ?)
      `).run(orderId, finalTotal, payment_method, txnRef);

      // Notification to customer
      db.prepare(`
        INSERT INTO notifications (user_id, order_id, type, title, message)
        VALUES (?, ?, 'order_placed', 'Order Placed 🎉', ?)
      `).run(
        req.user.id,
        orderId,
        `Your order ${orderNumber} has been sent to ${restaurant.name}.`
      );

      return { orderId, orderNumber, qrToken, txnRef };
    });

    const result = insertTransaction();

    // Fetch full order for response and live socket broadcast
    const fullOrder = db.prepare(`
      SELECT o.*, r.name as restaurant_name, r.branch_name, r.area, r.cover_image as restaurant_cover, r.address as restaurant_address,
             r.prep_time_minutes, r.brand_id, u.name as customer_name, u.phone as customer_phone
      FROM orders o
      JOIN restaurants r ON (o.branch_id = r.id OR o.restaurant_id = r.id)
      JOIN users u ON o.customer_id = u.id
      WHERE o.id = ?
    `).get(result.orderId);

    const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(result.orderId);
    fullOrder.items = orderItems.map(i => ({
      ...i,
      customizations: JSON.parse(i.customizations_selected_json || '{}')
    }));
    fullOrder.user_id = fullOrder.customer_id;
    fullOrder.total_amount = fullOrder.total;
    fullOrder.branch_id = restaurant.id;

    console.log(`[ORDER CREATE] order ID: ${fullOrder.id} (${fullOrder.order_number}) | branch ID: ${restaurant.id} (${restaurant.branch_name}) | status: ${fullOrder.status} | total: ₹${fullOrder.total}`);

    // Emit live Socket.IO events to both restaurant and branch rooms
    if (req.io) {
      const socketPayload = {
        ...fullOrder,
        order: fullOrder,
        soundAlert: true
      };
      req.io.to(`branch:${restaurant.id}`).emit('order:created', socketPayload);
      req.io.to(`restaurant_${restaurant.id}`).emit('order:created', socketPayload);
      req.io.to('admin:super').emit('order:created', socketPayload);
      console.log(`[SOCKET] Emitted order:created for order #${fullOrder.id} to branch:${restaurant.id} & restaurant_${restaurant.id}`);
    }

    res.status(201).json({
      message: 'Order placed successfully',
      order: fullOrder
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'We couldn’t place your order. Please try again.' });
  }
});

// Get orders based on role and optional branch/restaurant filter (Admin / Super Admin / Customer)
router.get('/', authenticate, (req, res) => {
  try {
    const reqBranchId = req.query.branchId || req.query.branch_id;
    const reqRestaurantId = req.query.restaurantId || req.query.restaurant_id;

    let ordersQuery = `
      SELECT o.*, r.name as restaurant_name, r.branch_name, r.area,
             u.name as customer_name, u.phone as customer_phone,
             p.status as payment_status, p.method as payment_method
      FROM orders o
      JOIN restaurants r ON (o.branch_id = r.id OR o.restaurant_id = r.id)
      JOIN users u ON o.customer_id = u.id
      LEFT JOIN payments p ON o.id = p.order_id
    `;
    const params = [];

    if (req.user.role === 'customer') {
      ordersQuery += ' WHERE o.customer_id = ? ORDER BY o.id DESC';
      params.push(req.user.id);
    } else if (req.user.role === 'restaurant_admin') {
      const userBranch = req.user.branch_id;
      // If branch admin requests a specific branch, verify authorization
      if (reqBranchId && userBranch && Number(reqBranchId) !== Number(userBranch)) {
        return res.status(403).json({ error: 'Access denied: unauthorized restaurant branch.' });
      }
      const targetBranch = userBranch || reqBranchId;
      if (targetBranch) {
        ordersQuery += ' WHERE (o.branch_id = ? OR o.restaurant_id = ?) ORDER BY o.id DESC';
        params.push(Number(targetBranch), Number(targetBranch));
      } else {
        ordersQuery += ' WHERE (r.owner_id = ? OR o.restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = ?)) ORDER BY o.id DESC';
        params.push(req.user.id, req.user.id);
      }
    } else if (req.user.role === 'super_admin') {
      if (reqBranchId) {
        ordersQuery += ' WHERE (o.branch_id = ? OR o.restaurant_id = ?) ORDER BY o.id DESC';
        params.push(Number(reqBranchId), Number(reqBranchId));
      } else if (reqRestaurantId) {
        ordersQuery += ' WHERE (o.restaurant_id = ? OR o.branch_id IN (SELECT id FROM restaurants WHERE brand_id = ?)) ORDER BY o.id DESC';
        params.push(Number(reqRestaurantId), Number(reqRestaurantId));
      } else {
        ordersQuery += ' ORDER BY o.id DESC';
      }
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }

    const orders = db.prepare(ordersQuery).all(...params);
    const getItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?');

    const formatted = orders.map(order => ({
      ...order,
      total_amount: order.total,
      items: getItems.all(order.id).map(i => ({
        ...i,
        customizations: JSON.parse(i.customizations_selected_json || '{}')
      }))
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Fetch all orders error:', err);
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

// Get customer's orders (Active + Previous)
router.get('/my-orders', authenticate, (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT o.*, r.name as restaurant_name, r.logo as restaurant_logo, r.cover_image as restaurant_cover,
             r.prep_time_minutes, p.status as payment_status, p.method as payment_method
      FROM orders o
      JOIN restaurants r ON o.restaurant_id = r.id
      LEFT JOIN payments p ON o.id = p.order_id
      WHERE o.customer_id = ?
      ORDER BY o.id DESC
    `).all(req.user.id);

    const getItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?');

    const formatted = orders.map(order => ({
      ...order,
      items: getItems.all(order.id).map(i => ({
        ...i,
        customizations: JSON.parse(i.customizations_selected_json || '{}')
      }))
    }));

    const active = formatted.filter(o => ['pending', 'accepted', 'preparing', 'ready'].includes(o.status));
    const previous = formatted.filter(o => ['completed', 'rejected', 'cancelled'].includes(o.status));

    res.json({ active, previous, all: formatted });
  } catch (err) {
    console.error('Fetch customer orders error:', err);
    res.status(500).json({ error: 'Failed to fetch order history.' });
  }
});

// Get single order detail & live tracking info
router.get('/:id', authenticate, (req, res) => {
  try {
    const order = db.prepare(`
      SELECT o.*, r.name as restaurant_name, r.branch_name, r.area, r.queue_status, r.queue_count,
             r.logo as restaurant_logo, r.cover_image as restaurant_cover,
             r.address as restaurant_address, r.contact_phone as restaurant_phone, r.prep_time_minutes,
             b.name as brand_name, b.slug as brand_slug,
             u.name as customer_name, u.phone as customer_phone, u.email as customer_email,
             p.status as payment_status, p.method as payment_method, p.transaction_ref,
             (SELECT COUNT(*) FROM orders ahead 
              WHERE ahead.restaurant_id = o.restaurant_id 
                AND ahead.status IN ('pending', 'accepted', 'preparing') 
                AND ahead.id < o.id) as orders_ahead
      FROM orders o
      JOIN restaurants r ON o.restaurant_id = r.id
      LEFT JOIN brands b ON r.brand_id = b.id
      JOIN users u ON o.customer_id = u.id
      LEFT JOIN payments p ON o.id = p.order_id
      WHERE o.id = ? OR o.order_number = ?
    `).get(req.params.id, req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // Security check: customer can only view their own order; restaurant admin can only view orders for their restaurant branch; super admin can view all
    if (req.user.role === 'customer' && order.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied: not your order.' });
    }
    if (req.user.role === 'restaurant_admin') {
      const rest = db.prepare('SELECT id, owner_id FROM restaurants WHERE id = ?').get(order.branch_id || order.restaurant_id);
      if (!rest || (rest.owner_id !== req.user.id && (!req.user.branch_id || Number(req.user.branch_id) !== Number(rest.id)))) {
        return res.status(403).json({ error: 'Access denied: order belongs to another restaurant branch.' });
      }
    }

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    order.items = items.map(i => ({
      ...i,
      customizations: JSON.parse(i.customizations_selected_json || '{}')
    }));

    res.json(order);
  } catch (err) {
    console.error('Fetch single order error:', err);
    res.status(500).json({ error: 'Failed to load order.' });
  }
});

// Restaurant Admin: Get all orders for restaurant
router.get('/restaurant/:restaurantId', authenticate, requireRestaurantOwner, (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT o.*, u.name as customer_name, u.phone as customer_phone,
             p.status as payment_status, p.method as payment_method
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      LEFT JOIN payments p ON o.id = p.order_id
      WHERE (o.branch_id = ? OR o.restaurant_id = ?)
      ORDER BY o.id DESC
    `).all(req.params.restaurantId, req.params.restaurantId);

    const getItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?');

    const formatted = orders.map(order => ({
      ...order,
      total_amount: order.total,
      items: getItems.all(order.id).map(i => ({
        ...i,
        customizations: JSON.parse(i.customizations_selected_json || '{}')
      }))
    }));

    console.log(`[ADMIN ORDER FETCH] manager user ID: ${req.user.id} | restaurant ID: ${req.params.restaurantId} | returned orders: ${formatted.length}`);

    res.json(formatted);
  } catch (err) {
    console.error('Fetch restaurant orders error:', err);
    res.status(500).json({ error: 'Failed to fetch restaurant orders.' });
  }
});

// Restaurant Admin: Update order status (Live Real-Time Transition)
router.patch('/:id/status', authenticate, (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'accepted', 'rejected', 'preparing', 'ready', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value.' });
    }

    const order = db.prepare(`
      SELECT o.*, r.name as restaurant_name, r.owner_id
      FROM orders o
      JOIN restaurants r ON (o.branch_id = r.id OR o.restaurant_id = r.id)
      WHERE o.id = ?
    `).get(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // Role verification: Super admin or owner/manager of this branch
    const isAuthorized = req.user.role === 'super_admin' ||
      order.owner_id === req.user.id ||
      (req.user.branch_id && (Number(req.user.branch_id) === Number(order.branch_id) || Number(req.user.branch_id) === Number(order.restaurant_id)));

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Access denied: order belongs to another restaurant branch.' });
    }

    db.prepare(`
      UPDATE orders
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, order.id);

    // Generate in-app notification if status is ready or accepted
    let notificationTitle = `Order Status: ${status.toUpperCase()}`;
    let notificationMsg = `Your order ${order.order_number} is now ${status}.`;
    let shouldVibrate = false;

    if (status === 'accepted') {
      notificationTitle = 'Order Accepted 👍';
      notificationMsg = `${order.restaurant_name} has accepted your order ${order.order_number} and will begin preparing it soon.`;
    } else if (status === 'preparing') {
      notificationTitle = 'Order in the Kitchen 👨‍🍳';
      notificationMsg = `${order.restaurant_name} is actively preparing order ${order.order_number}.`;
    } else if (status === 'ready') {
      notificationTitle = 'Your order is ready! 🔔';
      notificationMsg = `Order ${order.order_number} is ready for pickup at ${order.restaurant_name}. Please show your QR code at the counter!`;
      shouldVibrate = true;
    } else if (status === 'completed') {
      notificationTitle = 'Order Picked Up ✨';
      notificationMsg = `Order ${order.order_number} has been collected. Enjoy your meal!`;
    } else if (status === 'rejected') {
      notificationTitle = 'Order Declined ⚠️';
      notificationMsg = `Sorry, ${order.restaurant_name} could not accept order ${order.order_number}.`;
    }

    db.prepare(`
      INSERT INTO notifications (user_id, order_id, type, title, message)
      VALUES (?, ?, ?, ?, ?)
    `).run(order.customer_id, order.id, `order_${status}`, notificationTitle, notificationMsg);

    // Real-Time Socket Broadcast
    if (req.io) {
      const branchId = order.branch_id || order.restaurant_id;
      const payload = {
        id: order.id,
        orderId: order.id,
        order_id: order.id,
        order_number: order.order_number,
        restaurant_id: order.restaurant_id,
        branch_id: branchId,
        restaurant_name: order.restaurant_name,
        customer_id: order.customer_id,
        status,
        notification: {
          title: notificationTitle,
          message: notificationMsg,
          shouldVibrate,
          timestamp: new Date().toISOString()
        }
      };

      // Emit to general order room and customer personal room
      req.io.to(`order_${order.id}`).emit('order:status_updated', payload);
      req.io.to(`customer_${order.customer_id}`).emit('order:status_updated', payload);

      if (status === 'ready') {
        req.io.to(`customer_${order.customer_id}`).emit('order:ready', payload);
      }

      // Notify restaurant/branch channel for synchronized admin dashboard
      req.io.to(`branch:${branchId}`).emit('order:status_changed', payload);
      req.io.to(`branch:${branchId}`).emit('order:restaurant_status_updated', payload);
      req.io.to(`branch:${branchId}`).emit('order:status_updated', payload);

      req.io.to(`restaurant_${branchId}`).emit('order:status_changed', payload);
      req.io.to(`restaurant_${branchId}`).emit('order:restaurant_status_updated', payload);
      req.io.to(`restaurant_${branchId}`).emit('order:status_updated', payload);
      req.io.to('admin:super').emit('order:status_changed', payload);
      console.log(`[SOCKET] Emitted order:status_changed (${status}) for order #${order.id} to branch:${branchId} & restaurant_${branchId}`);
    }

    res.json({
      message: `Order status updated to ${status}`,
      status,
      order_id: order.id
    });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Failed to update order status.' });
  }
});

// Restaurant Staff: Verify QR code pickup
router.post('/verify-qr', authenticate, (req, res) => {
  try {
    const { qr_token, order_number, restaurant_id } = req.body;

    if (!qr_token && !order_number) {
      return res.status(400).json({ error: 'QR token or Order Number is required.' });
    }

    let query = `
      SELECT o.*, r.name as restaurant_name, r.owner_id, u.name as customer_name
      FROM orders o
      JOIN restaurants r ON (o.branch_id = r.id OR o.restaurant_id = r.id)
      JOIN users u ON o.customer_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (qr_token) {
      query += ' AND o.qr_code_token = ?';
      params.push(qr_token.trim());
    } else if (order_number) {
      query += ' AND o.order_number = ?';
      params.push(order_number.trim());
    }

    if (restaurant_id) {
      query += ' AND (o.restaurant_id = ? OR o.branch_id = ?)';
      params.push(restaurant_id, restaurant_id);
    }

    const order = db.prepare(query).get(...params);

    if (!order) {
      return res.status(404).json({ error: 'Invalid QR code. No matching order found.' });
    }

    // Authorization check: only authorized restaurant staff or super admin
    const isAuthorized = req.user.role === 'super_admin' ||
      order.owner_id === req.user.id ||
      (req.user.branch_id && (Number(req.user.branch_id) === Number(order.branch_id) || Number(req.user.branch_id) === Number(order.restaurant_id)));

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Access denied: this order is for a different restaurant branch.' });
    }

    // Check if already completed (prevent reuse)
    if (order.status === 'completed') {
      return res.status(400).json({
        error: 'ALREADY_COMPLETED',
        message: `Order ${order.order_number} has ALREADY been picked up and completed. QR code cannot be reused!`,
        order
      });
    }

    if (order.status !== 'ready') {
      return res.status(400).json({
        error: 'NOT_READY',
        message: `Order ${order.order_number} is currently "${order.status.toUpperCase()}". It must be marked READY before pickup verification.`,
        order
      });
    }

    // Valid pickup! Mark as completed
    db.prepare(`
      UPDATE orders
      SET status = 'completed', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(order.id);

    // Notification to customer
    db.prepare(`
      INSERT INTO notifications (user_id, order_id, type, title, message)
      VALUES (?, ?, 'order_completed', 'Order Collected! 🎉', ?)
    `).run(
      order.customer_id,
      order.id,
      `Your order ${order.order_number} was successfully verified and collected at ${order.restaurant_name}. Enjoy!`
    );

    // Broadcast real-time completion
    if (req.io) {
      const branchId = order.branch_id || order.restaurant_id;
      const payload = {
        order_id: order.id,
        order_number: order.order_number,
        status: 'completed',
        restaurant_id: order.restaurant_id,
        branch_id: branchId
      };
      req.io.to(`order_${order.id}`).emit('order:status_updated', payload);
      req.io.to(`customer_${order.customer_id}`).emit('order:status_updated', payload);
      req.io.to(`branch:${branchId}`).emit('order:restaurant_status_updated', payload);
      req.io.to(`restaurant_${branchId}`).emit('order:restaurant_status_updated', payload);
    }

    res.json({
      success: true,
      message: `Verified! Order ${order.order_number} successfully collected by ${order.customer_name}.`,
      order: {
        ...order,
        status: 'completed'
      }
    });
  } catch (err) {
    console.error('Verify QR error:', err);
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
});

module.exports = router;
