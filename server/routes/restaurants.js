const express = require('express');
const { db } = require('../db/database');
const { authenticate, requireRole, requireRestaurantOwner } = require('../middleware/auth');

const router = express.Router();

// Helper to calculate whether a restaurant is currently open based on is_open and operational hours
function checkIsCurrentlyOpen(r) {
  if (!r.is_open) return false;
  if (!r.opening_time || !r.closing_time) return true;

  try {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [openH, openM] = r.opening_time.split(':').map(Number);
    const [closeH, closeM] = r.closing_time.split(':').map(Number);

    const openMinutes = openH * 60 + (openM || 0);
    const closeMinutes = closeH * 60 + (closeM || 0);

    if (openMinutes <= closeMinutes) {
      return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
    } else {
      // Over midnight (e.g., 18:00 to 02:00)
      return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
    }
  } catch {
    return !!r.is_open;
  }
}

// Get all restaurants (Public, filterable)
router.get('/', (req, res) => {
  try {
    const { search, cuisine, open_only } = req.query;

    let query = 'SELECT * FROM restaurants WHERE is_approved = 1 AND is_suspended = 0';
    const params = [];

    // Filter out invalid/empty strings
    const validSearch = search && typeof search === 'string' && search.trim() !== '' && search !== 'undefined' && search !== 'null' ? search.trim() : null;
    const validCuisine = cuisine && typeof cuisine === 'string' && cuisine.trim() !== '' && cuisine !== 'All' && cuisine !== 'undefined' && cuisine !== 'null' ? cuisine.trim() : null;

    if (validSearch) {
      query += ` AND (
        restaurants.name LIKE ? 
        OR restaurants.cuisine LIKE ? 
        OR restaurants.description LIKE ? 
        OR restaurants.address LIKE ? 
        OR EXISTS (
          SELECT 1 FROM menu_items mi 
          WHERE mi.restaurant_id = restaurants.id 
          AND (mi.name LIKE ? OR mi.description LIKE ?)
        )
        OR EXISTS (
          SELECT 1 FROM categories c 
          WHERE c.restaurant_id = restaurants.id 
          AND c.name LIKE ?
        )
      )`;
      const term = `%${validSearch}%`;
      params.push(term, term, term, term, term, term, term);
    }

    if (validCuisine) {
      query += ` AND (
        restaurants.cuisine LIKE ?
        OR EXISTS (
          SELECT 1 FROM categories c 
          WHERE c.restaurant_id = restaurants.id 
          AND c.name LIKE ?
        )
        OR EXISTS (
          SELECT 1 FROM menu_items mi 
          WHERE mi.restaurant_id = restaurants.id 
          AND (mi.name LIKE ? OR mi.description LIKE ?)
        )
      )`;
      const cuisineTerm = `%${validCuisine}%`;
      params.push(cuisineTerm, cuisineTerm, cuisineTerm, cuisineTerm);
    }

    if (open_only === 'true') {
      query += ' AND is_open = 1';
    }

    query += ' ORDER BY rating DESC, is_open DESC';

    const restaurants = db.prepare(query).all(...params);

    // Attach active item counts and computed live open status
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM menu_items WHERE restaurant_id = ? AND is_available = 1');
    let result = restaurants.map(r => ({
      ...r,
      is_currently_open: checkIsCurrentlyOpen(r),
      available_items_count: countStmt.get(r.id).count
    }));

    // If open_only requested, additionally filter out closed by hours
    if (open_only === 'true') {
      result = result.filter(r => r.is_currently_open);
    }

    res.json(result);
  } catch (err) {
    console.error('Fetch restaurants error:', err);
    res.status(500).json({ error: 'Failed to fetch restaurants.' });
  }
});

// Get single restaurant details + categories + menu items
router.get('/:id', (req, res) => {
  try {
    const restaurant = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found.' });
    }

    const categories = db.prepare('SELECT * FROM categories WHERE restaurant_id = ? ORDER BY sort_order ASC').all(restaurant.id);
    const menuItems = db.prepare('SELECT * FROM menu_items WHERE restaurant_id = ? ORDER BY id ASC').all(restaurant.id);

    const formattedItems = menuItems.map(item => ({
      ...item,
      customizations: JSON.parse(item.customizations_json || '[]')
    }));

    // Group items by category
    const categorized = categories.map(cat => ({
      ...cat,
      items: formattedItems.filter(item => item.category_id === cat.id)
    }));

    res.json({
      restaurant,
      categories: categorized,
      allItems: formattedItems
    });
  } catch (err) {
    console.error('Fetch restaurant details error:', err);
    res.status(500).json({ error: 'Failed to fetch restaurant details.' });
  }
});

// Update restaurant settings (Owner / Super Admin)
router.put('/:id/settings', authenticate, requireRestaurantOwner, (req, res) => {
  try {
    const {
      name,
      description,
      cuisine,
      address,
      contact_phone,
      opening_time,
      closing_time,
      is_open,
      prep_time_minutes,
      min_order_amount,
      tax_rate,
      cover_image,
      logo
    } = req.body;

    db.prepare(`
      UPDATE restaurants
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          cuisine = COALESCE(?, cuisine),
          address = COALESCE(?, address),
          contact_phone = COALESCE(?, contact_phone),
          opening_time = COALESCE(?, opening_time),
          closing_time = COALESCE(?, closing_time),
          is_open = COALESCE(?, is_open),
          prep_time_minutes = COALESCE(?, prep_time_minutes),
          min_order_amount = COALESCE(?, min_order_amount),
          tax_rate = COALESCE(?, tax_rate),
          cover_image = COALESCE(?, cover_image),
          logo = COALESCE(?, logo)
      WHERE id = ?
    `).run(
      name, description, cuisine, address, contact_phone,
      opening_time, closing_time, is_open, prep_time_minutes,
      min_order_amount, tax_rate, cover_image, logo,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(req.params.id);

    // Emit live update via Socket.io if open/closed state toggled
    if (req.io) {
      req.io.emit('restaurant:updated', { id: updated.id, is_open: updated.is_open, prep_time_minutes: updated.prep_time_minutes });
    }

    res.json({ message: 'Restaurant settings updated successfully', restaurant: updated });
  } catch (err) {
    console.error('Update restaurant settings error:', err);
    res.status(500).json({ error: 'Failed to update settings.' });
  }
});

// Quick toggle open/closed status
router.patch('/:id/toggle-status', authenticate, requireRestaurantOwner, (req, res) => {
  try {
    const restaurant = db.prepare('SELECT is_open FROM restaurants WHERE id = ?').get(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found.' });
    }

    const newStatus = restaurant.is_open ? 0 : 1;
    db.prepare('UPDATE restaurants SET is_open = ? WHERE id = ?').run(newStatus, req.params.id);

    if (req.io) {
      req.io.emit('restaurant:status_changed', { id: Number(req.params.id), is_open: newStatus });
    }

    res.json({ message: `Restaurant is now ${newStatus ? 'Open' : 'Closed'}`, is_open: newStatus });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle restaurant status.' });
  }
});

module.exports = router;
