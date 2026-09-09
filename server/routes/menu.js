const express = require('express');
const { db } = require('../db/database');
const { authenticate, requireRestaurantOwner } = require('../middleware/auth');

const router = express.Router();

// Get full menu for a restaurant
router.get('/:restaurantId', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories WHERE restaurant_id = ? ORDER BY sort_order ASC').all(req.params.restaurantId);
    const items = db.prepare('SELECT * FROM menu_items WHERE restaurant_id = ? ORDER BY category_id ASC, id ASC').all(req.params.restaurantId);

    const formatted = items.map(item => ({
      ...item,
      customizations: JSON.parse(item.customizations_json || '[]')
    }));

    res.json({
      categories,
      items: formatted
    });
  } catch (err) {
    console.error('Fetch menu error:', err);
    res.status(500).json({ error: 'Failed to fetch menu.' });
  }
});

// Add Category
router.post('/:restaurantId/categories', authenticate, requireRestaurantOwner, (req, res) => {
  try {
    const { name, sort_order = 0 } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    const result = db.prepare(`
      INSERT INTO categories (restaurant_id, name, sort_order)
      VALUES (?, ?, ?)
    `).run(req.params.restaurantId, name.trim(), sort_order);

    const newCategory = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newCategory);
  } catch (err) {
    console.error('Add category error:', err);
    res.status(500).json({ error: 'Failed to add category.' });
  }
});

// Add Menu Item
router.post('/:restaurantId/items', authenticate, requireRestaurantOwner, (req, res) => {
  try {
    const {
      category_id,
      name,
      description,
      price,
      is_veg = 1,
      image,
      is_available = 1,
      customizations = []
    } = req.body;

    if (!name || price === undefined || !category_id) {
      return res.status(400).json({ error: 'Name, price, and category are required.' });
    }

    const defaultImg = is_veg 
      ? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600'
      : 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600';

    const result = db.prepare(`
      INSERT INTO menu_items (
        restaurant_id, category_id, name, description, price, is_veg, image, is_available, customizations_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.params.restaurantId,
      category_id,
      name.trim(),
      description || '',
      parseFloat(price),
      is_veg ? 1 : 0,
      image || defaultImg,
      is_available ? 1 : 0,
      JSON.stringify(customizations || [])
    );

    const newItem = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(result.lastInsertRowid);

    if (req.io) {
      req.io.to(`restaurant_${req.params.restaurantId}`).emit('menu:updated');
    }

    res.status(201).json({
      message: 'Item added successfully',
      item: {
        ...newItem,
        customizations: JSON.parse(newItem.customizations_json || '[]')
      }
    });
  } catch (err) {
    console.error('Add menu item error:', err);
    res.status(500).json({ error: 'Failed to add menu item.' });
  }
});

// Update Menu Item
router.put('/items/:id', authenticate, (req, res) => {
  try {
    const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Menu item not found.' });
    }

    // Check ownership
    const rest = db.prepare('SELECT owner_id FROM restaurants WHERE id = ?').get(item.restaurant_id);
    if (req.user.role !== 'super_admin' && (!rest || rest.owner_id !== req.user.id)) {
      return res.status(403).json({ error: 'Access denied: not authorized to edit this item.' });
    }

    const {
      category_id,
      name,
      description,
      price,
      is_veg,
      image,
      is_available,
      customizations
    } = req.body;

    db.prepare(`
      UPDATE menu_items
      SET category_id = COALESCE(?, category_id),
          name = COALESCE(?, name),
          description = COALESCE(?, description),
          price = COALESCE(?, price),
          is_veg = COALESCE(?, is_veg),
          image = COALESCE(?, image),
          is_available = COALESCE(?, is_available),
          customizations_json = COALESCE(?, customizations_json)
      WHERE id = ?
    `).run(
      category_id,
      name ? name.trim() : null,
      description,
      price !== undefined ? parseFloat(price) : null,
      is_veg !== undefined ? (is_veg ? 1 : 0) : null,
      image,
      is_available !== undefined ? (is_available ? 1 : 0) : null,
      customizations ? JSON.stringify(customizations) : null,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(req.params.id);

    if (req.io) {
      req.io.to(`restaurant_${item.restaurant_id}`).emit('menu:updated');
    }

    res.json({
      message: 'Item updated successfully',
      item: {
        ...updated,
        customizations: JSON.parse(updated.customizations_json || '[]')
      }
    });
  } catch (err) {
    console.error('Update item error:', err);
    res.status(500).json({ error: 'Failed to update item.' });
  }
});

// Toggle availability
router.patch('/items/:id/availability', authenticate, (req, res) => {
  try {
    const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    const rest = db.prepare('SELECT owner_id FROM restaurants WHERE id = ?').get(item.restaurant_id);
    if (req.user.role !== 'super_admin' && (!rest || rest.owner_id !== req.user.id)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const newAvailable = item.is_available ? 0 : 1;
    db.prepare('UPDATE menu_items SET is_available = ? WHERE id = ?').run(newAvailable, req.params.id);

    if (req.io) {
      req.io.emit('item:availability_changed', { id: item.id, is_available: newAvailable, restaurant_id: item.restaurant_id });
    }

    res.json({
      message: `Item marked as ${newAvailable ? 'Available' : 'Unavailable'}`,
      is_available: newAvailable
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle availability.' });
  }
});

// Delete item
router.delete('/items/:id', authenticate, (req, res) => {
  try {
    const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    const rest = db.prepare('SELECT owner_id FROM restaurants WHERE id = ?').get(item.restaurant_id);
    if (req.user.role !== 'super_admin' && (!rest || rest.owner_id !== req.user.id)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    db.prepare('DELETE FROM menu_items WHERE id = ?').run(req.params.id);

    if (req.io) {
      req.io.to(`restaurant_${item.restaurant_id}`).emit('menu:updated');
    }

    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete item.' });
  }
});

module.exports = router;
