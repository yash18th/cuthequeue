const express = require('express');
const { db } = require('../db/database');
const { authenticate, requireRestaurantOwner } = require('../middleware/auth');

const router = express.Router();

// Helper to check if a user can manage a specific restaurant's menu
function canManageMenu(user, restaurantId) {
  if (!user) return false;
  if (user.role === 'super_admin' || user.role === 'restaurant_admin') return true;
  const rest = db.prepare('SELECT id, owner_id, brand_id FROM restaurants WHERE id = ?').get(restaurantId);
  if (!rest) return false;
  if (rest.owner_id === user.id) return true;
  if (user.branch_id && Number(user.branch_id) === Number(restaurantId)) return true;
  if (user.restaurant_id && (Number(user.restaurant_id) === Number(restaurantId) || Number(user.restaurant_id) === Number(rest.brand_id))) return true;
  return false;
}

// Helper to resolve or auto-create category
function resolveCategoryId(restaurantId, categoryId, categoryName) {
  if (categoryId) {
    const existing = db.prepare('SELECT id FROM categories WHERE id = ? AND restaurant_id = ?').get(categoryId, restaurantId);
    if (existing) return existing.id;
  }
  
  const catName = (categoryName && String(categoryName).trim()) || 'Mains';
  let category = db.prepare('SELECT id FROM categories WHERE restaurant_id = ? AND LOWER(name) = LOWER(?)').get(restaurantId, catName);
  if (!category) {
    const maxSort = db.prepare('SELECT MAX(sort_order) as max_sort FROM categories WHERE restaurant_id = ?').get(restaurantId);
    const nextSort = (maxSort?.max_sort || 0) + 1;
    const res = db.prepare('INSERT INTO categories (restaurant_id, name, sort_order) VALUES (?, ?, ?)').run(restaurantId, catName, nextSort);
    return res.lastInsertRowid;
  }
  return category.id;
}

// Get full menu for a restaurant / branch
router.get('/:restaurantId', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories WHERE restaurant_id = ? ORDER BY sort_order ASC').all(req.params.restaurantId);
    const items = db.prepare(`
      SELECT m.*, c.name AS category_name, COALESCE(c.name, 'Mains') AS category
      FROM menu_items m
      LEFT JOIN categories c ON m.category_id = c.id
      WHERE m.restaurant_id = ?
      ORDER BY m.category_id ASC, m.id ASC
    `).all(req.params.restaurantId);

    const formatted = items.map(item => ({
      ...item,
      is_available: Boolean(item.is_available),
      is_veg: Boolean(item.is_veg),
      customizations: JSON.parse(item.customizations_json || '[]')
    }));

    res.json({
      categories,
      items: formatted,
      menu_items: formatted
    });
  } catch (err) {
    console.error('Fetch menu error:', err);
    res.status(500).json({ error: 'Failed to fetch menu.' });
  }
});

// Add Category
router.post('/:restaurantId/categories', authenticate, (req, res) => {
  try {
    if (!canManageMenu(req.user, req.params.restaurantId)) {
      return res.status(403).json({ error: 'Access denied: not authorized to manage this restaurant.' });
    }

    const { name, sort_order = 0 } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    const existing = db.prepare('SELECT * FROM categories WHERE restaurant_id = ? AND LOWER(name) = LOWER(?)').get(req.params.restaurantId, name.trim());
    if (existing) {
      return res.json(existing);
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
router.post('/:restaurantId/items', authenticate, (req, res) => {
  try {
    if (!canManageMenu(req.user, req.params.restaurantId)) {
      return res.status(403).json({ error: 'Access denied: not authorized to add items to this branch.' });
    }

    const {
      category_id,
      category,
      category_name,
      name,
      description,
      price,
      is_veg = true,
      image,
      is_available = true,
      customizations = []
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Dish name is required.' });
    }

    if (price === undefined || price === null || price === '' || isNaN(parseFloat(price))) {
      return res.status(400).json({ error: 'A valid price is required.' });
    }

    const resolvedCategoryId = resolveCategoryId(
      req.params.restaurantId,
      category_id,
      category || category_name || 'Mains'
    );

    const defaultImg = (is_veg === true || is_veg === 1 || is_veg === '1' || is_veg === 'veg')
      ? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600'
      : 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600';

    const result = db.prepare(`
      INSERT INTO menu_items (
        restaurant_id, category_id, name, description, price, is_veg, image, is_available, customizations_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.params.restaurantId,
      resolvedCategoryId,
      name.trim(),
      description ? description.trim() : '',
      parseFloat(price),
      (is_veg === true || is_veg === 1 || is_veg === '1' || is_veg === 'veg') ? 1 : 0,
      image || defaultImg,
      (is_available !== false && is_available !== 0 && is_available !== '0') ? 1 : 0,
      JSON.stringify(customizations || [])
    );

    const newItem = db.prepare(`
      SELECT m.*, c.name AS category_name, COALESCE(c.name, 'Mains') AS category
      FROM menu_items m
      LEFT JOIN categories c ON m.category_id = c.id
      WHERE m.id = ?
    `).get(result.lastInsertRowid);

    if (req.io) {
      req.io.to(`restaurant_${req.params.restaurantId}`).emit('menu:updated');
      req.io.emit('menu:updated');
    }

    res.status(201).json({
      message: 'Item added successfully',
      item: {
        ...newItem,
        is_available: Boolean(newItem.is_available),
        is_veg: Boolean(newItem.is_veg),
        customizations: JSON.parse(newItem.customizations_json || '[]')
      },
      menu_item: {
        ...newItem,
        is_available: Boolean(newItem.is_available),
        is_veg: Boolean(newItem.is_veg),
        customizations: JSON.parse(newItem.customizations_json || '[]')
      }
    });
  } catch (err) {
    console.error('Add menu item error:', err);
    res.status(500).json({ error: err.message || 'Failed to add menu item.' });
  }
});

// Update Menu Item
router.put('/items/:id', authenticate, (req, res) => {
  try {
    const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Menu item not found.' });
    }

    if (!canManageMenu(req.user, item.restaurant_id)) {
      return res.status(403).json({ error: 'Access denied: not authorized to edit this item.' });
    }

    const {
      category_id,
      category,
      category_name,
      name,
      description,
      price,
      is_veg,
      image,
      is_available,
      customizations
    } = req.body;

    let resolvedCategoryId = item.category_id;
    if (category_id || category || category_name) {
      resolvedCategoryId = resolveCategoryId(
        item.restaurant_id,
        category_id,
        category || category_name
      );
    }

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
      resolvedCategoryId,
      name ? name.trim() : null,
      description !== undefined ? description : null,
      (price !== undefined && price !== null && !isNaN(parseFloat(price))) ? parseFloat(price) : null,
      is_veg !== undefined ? ((is_veg === true || is_veg === 1 || is_veg === '1' || is_veg === 'veg') ? 1 : 0) : null,
      image !== undefined ? image : null,
      is_available !== undefined ? ((is_available !== false && is_available !== 0 && is_available !== '0') ? 1 : 0) : null,
      customizations ? JSON.stringify(customizations) : null,
      req.params.id
    );

    const updated = db.prepare(`
      SELECT m.*, c.name AS category_name, COALESCE(c.name, 'Mains') AS category
      FROM menu_items m
      LEFT JOIN categories c ON m.category_id = c.id
      WHERE m.id = ?
    `).get(req.params.id);

    if (req.io) {
      req.io.to(`restaurant_${item.restaurant_id}`).emit('menu:updated');
      req.io.emit('menu:updated');
    }

    res.json({
      message: 'Item updated successfully',
      item: {
        ...updated,
        is_available: Boolean(updated.is_available),
        is_veg: Boolean(updated.is_veg),
        customizations: JSON.parse(updated.customizations_json || '[]')
      }
    });
  } catch (err) {
    console.error('Update item error:', err);
    res.status(500).json({ error: 'Failed to update item.' });
  }
});

// Toggle availability handler (supports /availability and /toggle)
const handleToggleAvailability = (req, res) => {
  try {
    const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    if (!canManageMenu(req.user, item.restaurant_id)) {
      return res.status(403).json({ error: 'Access denied: not authorized to update this item.' });
    }

    let newAvailable;
    if (req.body && req.body.is_available !== undefined) {
      newAvailable = (req.body.is_available === true || req.body.is_available === 1 || req.body.is_available === '1') ? 1 : 0;
    } else {
      newAvailable = item.is_available ? 0 : 1;
    }

    db.prepare('UPDATE menu_items SET is_available = ? WHERE id = ?').run(newAvailable, req.params.id);

    const updatedItem = db.prepare(`
      SELECT m.*, c.name AS category_name, COALESCE(c.name, 'Mains') AS category
      FROM menu_items m
      LEFT JOIN categories c ON m.category_id = c.id
      WHERE m.id = ?
    `).get(req.params.id);

    if (req.io) {
      req.io.emit('item:availability_changed', { id: item.id, is_available: Boolean(newAvailable), restaurant_id: item.restaurant_id });
      req.io.to(`restaurant_${item.restaurant_id}`).emit('menu:updated');
      req.io.emit('menu:updated');
    }

    res.json({
      success: true,
      message: `Item marked as ${newAvailable ? 'In Stock (Available)' : 'Sold Out (Unavailable)'}`,
      is_available: Boolean(newAvailable),
      item: {
        ...updatedItem,
        is_available: Boolean(updatedItem.is_available),
        is_veg: Boolean(updatedItem.is_veg),
        customizations: JSON.parse(updatedItem.customizations_json || '[]')
      }
    });
  } catch (err) {
    console.error('Toggle availability error:', err);
    res.status(500).json({ error: 'Failed to toggle availability.' });
  }
};

router.patch('/items/:id/availability', authenticate, handleToggleAvailability);
router.patch('/items/:id/toggle', authenticate, handleToggleAvailability);

// Delete item
router.delete('/items/:id', authenticate, (req, res) => {
  try {
    const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    if (!canManageMenu(req.user, item.restaurant_id)) {
      return res.status(403).json({ error: 'Access denied: not authorized to delete this item.' });
    }

    db.prepare('DELETE FROM menu_items WHERE id = ?').run(req.params.id);

    if (req.io) {
      req.io.to(`restaurant_${item.restaurant_id}`).emit('menu:updated');
      req.io.emit('menu:updated');
    }

    res.json({ message: 'Item deleted successfully', id: req.params.id });
  } catch (err) {
    console.error('Delete item error:', err);
    res.status(500).json({ error: 'Failed to delete item.' });
  }
});

module.exports = router;
