const express = require('express');
const router = express.Router();
const { db } = require('../db/database');
const { authenticate, requireRole } = require('../middleware/auth');

// Helper to verify if user manages the restaurant or brand
function checkCanManageRestaurant(user, restaurantId) {
  if (user.role === 'super_admin') return true;
  if (user.role !== 'restaurant_admin') return false;

  const rest = db.prepare('SELECT id, owner_id, brand_id FROM restaurants WHERE id = ?').get(restaurantId);
  if (!rest) return false;

  // Direct owner
  if (rest.owner_id === user.id) return true;

  // Brand owner
  if (rest.brand_id) {
    const brandMatch = db.prepare('SELECT id FROM restaurants WHERE brand_id = ? AND owner_id = ?').get(rest.brand_id, user.id);
    if (brandMatch) return true;
  }

  return false;
}

// -------------------------------------------------------------
// PUBLIC CUSTOMER ENDPOINT
// -------------------------------------------------------------
// Get all active showcases for the customer homepage carousel
router.get('/', (req, res) => {
  try {
    const showcases = db.prepare(`
      SELECT s.*,
             r.name as restaurant_name,
             r.branch_name,
             r.area,
             r.address,
             r.cover_image as restaurant_cover,
             r.logo as restaurant_logo,
             r.prep_time_minutes as restaurant_prep_minutes,
             r.queue_count as restaurant_queue_count,
             r.is_open,
             r.opening_time,
             r.closing_time,
             b.id as brand_id,
             b.name as brand_name,
             b.slug as brand_slug
      FROM restaurant_showcases s
      JOIN restaurants r ON s.restaurant_id = r.id
      LEFT JOIN brands b ON r.brand_id = b.id
      WHERE s.is_active = 1 AND r.is_approved = 1 AND r.is_suspended = 0
      ORDER BY s.display_order ASC, s.id ASC
    `).all();

    // Query live active orders in kitchen to compute real queue counts
    const activeOrderCountStmt = db.prepare(`
      SELECT COUNT(*) as live_count FROM orders
      WHERE restaurant_id = ? AND status IN ('pending', 'confirmed', 'preparing')
    `);

    const enriched = showcases.map(sc => {
      const liveOrdersRow = activeOrderCountStmt.get(sc.restaurant_id);
      const liveQueueCount = (liveOrdersRow && liveOrdersRow.live_count > 0)
        ? liveOrdersRow.live_count
        : (sc.restaurant_queue_count || 6);

      const prepMinutes = sc.custom_prep_minutes || sc.restaurant_prep_minutes || 15;

      const queueText = sc.custom_queue_text && sc.custom_queue_text.trim()
        ? sc.custom_queue_text.trim()
        : `${liveQueueCount} orders ahead in kitchen • Prepared fresh as you travel`;

      return {
        id: sc.id,
        restaurant_id: sc.restaurant_id,
        badge: sc.badge || '✦ BENGALURU DINING HERITAGE',
        promo_title: sc.promo_title,
        featured_dish: sc.featured_dish,
        description: sc.description,
        hero_image: sc.hero_image,
        pass_code: sc.pass_code || 'PASS CQ102',
        cta_text: sc.cta_text || 'Pre-order Now',
        display_order: sc.display_order,
        is_active: sc.is_active,
        // Enriched Restaurant & Queue properties
        restaurant_name: sc.restaurant_name,
        branch_name: sc.branch_name,
        area: sc.area,
        address: sc.address,
        brand_id: sc.brand_id,
        brand_name: sc.brand_name,
        brand_slug: sc.brand_slug || 'the-rameshwaram-cafe',
        live_queue_count: liveQueueCount,
        prep_minutes: prepMinutes,
        queue_text: queueText,
        is_open: sc.is_open,
        created_at: sc.created_at
      };
    });

    res.json({
      showcases: enriched,
      total: enriched.length
    });
  } catch (err) {
    console.error('Fetch showcases error:', err);
    res.status(500).json({ error: 'Failed to fetch restaurant showcase promotions.' });
  }
});

// -------------------------------------------------------------
// ADMIN ENDPOINTS (Authenticated)
// -------------------------------------------------------------

// Get showcases for authenticated manager's restaurant(s)
router.get('/admin', authenticate, requireRole('restaurant_admin', 'super_admin'), (req, res) => {
  try {
    let showcases = [];

    if (req.user.role === 'super_admin') {
      showcases = db.prepare(`
        SELECT s.*, r.name as restaurant_name, r.branch_name, b.name as brand_name, b.slug as brand_slug
        FROM restaurant_showcases s
        JOIN restaurants r ON s.restaurant_id = r.id
        LEFT JOIN brands b ON r.brand_id = b.id
        ORDER BY s.restaurant_id ASC, s.display_order ASC, s.id ASC
      `).all();
    } else {
      // Find restaurants the manager owns directly or via brand
      const ownedRests = db.prepare(`
        SELECT DISTINCT r.id FROM restaurants r
        WHERE r.owner_id = ?
           OR r.brand_id IN (SELECT brand_id FROM restaurants WHERE owner_id = ?)
      `).all(req.user.id, req.user.id);

      const restIds = ownedRests.map(r => r.id);
      if (restIds.length === 0) {
        return res.json({ showcases: [], total: 0 });
      }

      const placeholders = restIds.map(() => '?').join(',');
      showcases = db.prepare(`
        SELECT s.*, r.name as restaurant_name, r.branch_name, b.name as brand_name, b.slug as brand_slug
        FROM restaurant_showcases s
        JOIN restaurants r ON s.restaurant_id = r.id
        LEFT JOIN brands b ON r.brand_id = b.id
        WHERE s.restaurant_id IN (${placeholders})
        ORDER BY s.display_order ASC, s.id ASC
      `).all(...restIds);
    }

    res.json({
      showcases,
      total: showcases.length
    });
  } catch (err) {
    console.error('Fetch admin showcases error:', err);
    res.status(500).json({ error: 'Failed to load restaurant showcases.' });
  }
});

// Create new showcase promotion
router.post('/', authenticate, requireRole('restaurant_admin', 'super_admin'), (req, res) => {
  try {
    const {
      restaurant_id,
      badge = '✦ BENGALURU DINING HERITAGE',
      promo_title,
      featured_dish,
      description = '',
      hero_image,
      custom_queue_text = '',
      custom_prep_minutes = null,
      pass_code = 'PASS CQ102',
      cta_text = 'Pre-order Now',
      is_active = 1,
      display_order = 0
    } = req.body;

    let targetRestaurantId = restaurant_id;
    if (!targetRestaurantId) {
      const owned = db.prepare('SELECT id FROM restaurants WHERE owner_id = ? LIMIT 1').get(req.user.id);
      if (owned) {
        targetRestaurantId = owned.id;
      }
    }

    if (!targetRestaurantId) {
      return res.status(400).json({ error: 'Restaurant ID is required.' });
    }

    if (!promo_title || !featured_dish || !hero_image) {
      return res.status(400).json({ error: 'Promotional title, featured dish, and hero image URL are required.' });
    }

    // Strict security check: user can only add showcase for their own restaurant
    if (!checkCanManageRestaurant(req.user, targetRestaurantId)) {
      return res.status(403).json({ error: 'Access denied: You do not have permission to manage this restaurant.' });
    }

    const insertStmt = db.prepare(`
      INSERT INTO restaurant_showcases (
        restaurant_id, badge, promo_title, featured_dish, description,
        hero_image, custom_queue_text, custom_prep_minutes, pass_code, cta_text,
        is_active, display_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      targetRestaurantId,
      badge.trim(),
      promo_title.trim(),
      featured_dish.trim(),
      description.trim(),
      hero_image.trim(),
      custom_queue_text.trim() || null,
      custom_prep_minutes ? parseInt(custom_prep_minutes, 10) : null,
      pass_code.trim(),
      cta_text.trim(),
      is_active ? 1 : 0,
      parseInt(display_order, 10) || 0
    );

    const created = db.prepare('SELECT * FROM restaurant_showcases WHERE id = ?').get(result.lastInsertRowid);

    // Emit live Socket.IO update so customer landing page updates dynamically
    if (req.io) {
      req.io.emit('showcase:updated', {
        action: 'create',
        showcaseId: created.id,
        restaurantId: restaurant_id
      });
    }

    console.log(`[SHOWCASE] Created promotion #${created.id} ("${created.promo_title}") for restaurant #${restaurant_id}`);

    res.status(201).json({
      message: 'Showcase promotion created successfully',
      showcase: created
    });
  } catch (err) {
    console.error('Create showcase error:', err);
    res.status(500).json({ error: 'Failed to create showcase promotion.' });
  }
});

// Update existing showcase promotion
router.put('/:id', authenticate, requireRole('restaurant_admin', 'super_admin'), (req, res) => {
  try {
    const showcase = db.prepare('SELECT * FROM restaurant_showcases WHERE id = ?').get(req.params.id);
    if (!showcase) {
      return res.status(404).json({ error: 'Showcase not found.' });
    }

    // Strict security check: user can only edit their own restaurant's showcase
    if (!checkCanManageRestaurant(req.user, showcase.restaurant_id)) {
      return res.status(403).json({ error: 'Access denied: You do not have permission to manage this restaurant.' });
    }

    const {
      badge,
      promo_title,
      featured_dish,
      description,
      hero_image,
      custom_queue_text,
      custom_prep_minutes,
      pass_code,
      cta_text,
      is_active,
      display_order
    } = req.body;

    const updateStmt = db.prepare(`
      UPDATE restaurant_showcases
      SET badge = COALESCE(?, badge),
          promo_title = COALESCE(?, promo_title),
          featured_dish = COALESCE(?, featured_dish),
          description = COALESCE(?, description),
          hero_image = COALESCE(?, hero_image),
          custom_queue_text = ?,
          custom_prep_minutes = ?,
          pass_code = COALESCE(?, pass_code),
          cta_text = COALESCE(?, cta_text),
          is_active = COALESCE(?, is_active),
          display_order = COALESCE(?, display_order),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    updateStmt.run(
      badge !== undefined ? badge.trim() : null,
      promo_title !== undefined ? promo_title.trim() : null,
      featured_dish !== undefined ? featured_dish.trim() : null,
      description !== undefined ? description.trim() : null,
      hero_image !== undefined ? hero_image.trim() : null,
      custom_queue_text !== undefined ? (custom_queue_text.trim() || null) : showcase.custom_queue_text,
      custom_prep_minutes !== undefined ? (custom_prep_minutes ? parseInt(custom_prep_minutes, 10) : null) : showcase.custom_prep_minutes,
      pass_code !== undefined ? pass_code.trim() : null,
      cta_text !== undefined ? cta_text.trim() : null,
      is_active !== undefined ? (is_active ? 1 : 0) : null,
      display_order !== undefined ? parseInt(display_order, 10) : null,
      showcase.id
    );

    const updated = db.prepare('SELECT * FROM restaurant_showcases WHERE id = ?').get(showcase.id);

    // Broadcast live real-time update
    if (req.io) {
      req.io.emit('showcase:updated', {
        action: 'update',
        showcaseId: updated.id,
        restaurantId: updated.restaurant_id
      });
    }

    console.log(`[SHOWCASE] Updated promotion #${updated.id} ("${updated.promo_title}")`);

    res.json({
      message: 'Showcase promotion updated successfully',
      showcase: updated
    });
  } catch (err) {
    console.error('Update showcase error:', err);
    res.status(500).json({ error: 'Failed to update showcase promotion.' });
  }
});

// Toggle active/inactive status
router.patch('/:id/toggle', authenticate, requireRole('restaurant_admin', 'super_admin'), (req, res) => {
  try {
    const showcase = db.prepare('SELECT * FROM restaurant_showcases WHERE id = ?').get(req.params.id);
    if (!showcase) {
      return res.status(404).json({ error: 'Showcase not found.' });
    }

    if (!checkCanManageRestaurant(req.user, showcase.restaurant_id)) {
      return res.status(403).json({ error: 'Access denied: You do not have permission to manage this restaurant.' });
    }

    const newActive = showcase.is_active === 1 ? 0 : 1;
    db.prepare('UPDATE restaurant_showcases SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newActive, showcase.id);

    const updated = db.prepare('SELECT * FROM restaurant_showcases WHERE id = ?').get(showcase.id);

    if (req.io) {
      req.io.emit('showcase:updated', {
        action: 'toggle',
        showcaseId: updated.id,
        isActive: newActive
      });
    }

    res.json({
      message: `Showcase is now ${newActive ? 'active' : 'inactive'}`,
      showcase: updated
    });
  } catch (err) {
    console.error('Toggle showcase error:', err);
    res.status(500).json({ error: 'Failed to toggle showcase status.' });
  }
});

// Delete showcase promotion
router.delete('/:id', authenticate, requireRole('restaurant_admin', 'super_admin'), (req, res) => {
  try {
    const showcase = db.prepare('SELECT * FROM restaurant_showcases WHERE id = ?').get(req.params.id);
    if (!showcase) {
      return res.status(404).json({ error: 'Showcase not found.' });
    }

    if (!checkCanManageRestaurant(req.user, showcase.restaurant_id)) {
      return res.status(403).json({ error: 'Access denied: You do not have permission to manage this restaurant.' });
    }

    db.prepare('DELETE FROM restaurant_showcases WHERE id = ?').run(showcase.id);

    if (req.io) {
      req.io.emit('showcase:updated', {
        action: 'delete',
        showcaseId: showcase.id
      });
    }

    console.log(`[SHOWCASE] Deleted promotion #${showcase.id}`);

    res.json({
      message: 'Showcase promotion deleted successfully',
      id: showcase.id
    });
  } catch (err) {
    console.error('Delete showcase error:', err);
    res.status(500).json({ error: 'Failed to delete showcase promotion.' });
  }
});

module.exports = router;
