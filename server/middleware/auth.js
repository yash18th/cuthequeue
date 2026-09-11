const jwt = require('jsonwebtoken');
const { db } = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'cut-the-queue-super-secret-key-2026';

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare(`
      SELECT id, name, email, phone, role, avatar, notification_preferences, is_suspended, restaurant_id, branch_id 
      FROM users 
      WHERE id = ?
    `).get(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'User not found or session expired.' });
    }

    if (user.is_suspended) {
      return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied: insufficient permissions.' });
    }
    next();
  };
}

function requireRestaurantOwner(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  if (req.user.role === 'super_admin') {
    return next();
  }

  if (req.user.role !== 'restaurant_admin') {
    return res.status(403).json({ error: 'Access denied: restaurant manager credentials required.' });
  }

  const restaurantId = Number(req.params.restaurantId || req.params.branchId || req.params.id || req.body.restaurant_id || req.body.branch_id);
  if (!restaurantId) {
    return res.status(400).json({ error: 'Restaurant/Branch ID is required.' });
  }

  const restaurant = db.prepare('SELECT id, owner_id, brand_id FROM restaurants WHERE id = ?').get(restaurantId);
  if (!restaurant) {
    return res.status(404).json({ error: 'Restaurant or branch not found.' });
  }

  // Strictly enforce branch ownership: must be the direct owner or user assigned to this branch
  if (restaurant.owner_id === req.user.id || (req.user.branch_id && Number(req.user.branch_id) === Number(restaurant.id))) {
    return next();
  }

  return res.status(403).json({ error: 'Access denied: you do not manage this restaurant branch.' });
}

module.exports = {
  JWT_SECRET,
  authenticate,
  requireRole,
  requireRestaurantOwner
};
