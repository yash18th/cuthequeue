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

// Helper to calculate Haversine distance in km
function calculateHaversineKm(lat1, lon1, lat2, lon2) {
  if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return null;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// -------------------------------------------------------------
// BRAND ENDPOINTS
// -------------------------------------------------------------

// Get all restaurant brands
router.get('/brands', (req, res) => {
  try {
    const brands = db.prepare('SELECT * FROM brands ORDER BY id ASC').all();
    const branchStmt = db.prepare(`
      SELECT id, brand_id, name, branch_name, area, address, location, latitude, longitude,
             opening_time, closing_time, is_open, prep_time_minutes, distance_km, queue_status, queue_count, rating
      FROM restaurants
      WHERE brand_id = ? AND is_approved = 1 AND is_suspended = 0
      ORDER BY id ASC
    `);

    const enrichedBrands = brands.map(b => {
      const branches = branchStmt.all(b.id).map(br => ({
        ...br,
        is_currently_open: checkIsCurrentlyOpen(br)
      }));

      const areas = [...new Set(branches.map(br => br.area).filter(Boolean))];

      return {
        ...b,
        branch_count: branches.length,
        areas,
        branches
      };
    });

    res.json({ brands: enrichedBrands, total: enrichedBrands.length });
  } catch (err) {
    console.error('Fetch brands error:', err);
    res.status(500).json({ error: 'Failed to fetch restaurant brands.' });
  }
});

// Get single brand with all its branches
router.get('/brands/:brandIdOrSlug', (req, res) => {
  try {
    const param = req.params.brandIdOrSlug;
    const isNumeric = /^\d+$/.test(param);

    const brand = isNumeric
      ? db.prepare('SELECT * FROM brands WHERE id = ?').get(param)
      : db.prepare(`
          SELECT * FROM brands 
          WHERE slug = ? 
             OR slug = ? 
             OR slug = ?
             OR LOWER(name) = ?
             OR LOWER(name) LIKE ?
          LIMIT 1
        `).get(
          param,
          `the-${param}`,
          param.replace(/^the-/, ''),
          param.toLowerCase().replace(/-/g, ' '),
          `%${param.toLowerCase().replace(/-/g, ' ')}%`
        );

    if (!brand) {
      return res.status(404).json({ error: 'Restaurant brand not found.' });
    }

    const branches = db.prepare(`
      SELECT id, brand_id, name, branch_name, area, address, location, latitude, longitude,
             contact_phone, opening_time, closing_time, is_open, prep_time_minutes,
             distance_km, queue_status, queue_count, rating, cover_image, logo
      FROM restaurants
      WHERE brand_id = ? AND is_approved = 1 AND is_suspended = 0
      ORDER BY id ASC
    `).all(brand.id).map(br => ({
      ...br,
      is_currently_open: checkIsCurrentlyOpen(br)
    }));

    const areas = [...new Set(branches.map(br => br.area).filter(Boolean))];

    res.json({
      brand: {
        ...brand,
        branch_count: branches.length,
        areas
      },
      branches
    });
  } catch (err) {
    console.error('Fetch brand error:', err);
    res.status(500).json({ error: 'Failed to fetch restaurant brand.' });
  }
});

// Get all restaurants (Public, filterable)
router.get('/', (req, res) => {
  try {
    const rawSearch = req.query.q || req.query.search;
    const rawCuisine = req.query.category || req.query.cuisine;
    const rawLocation = req.query.location || req.query.area;
    const brandParam = req.query.brand || req.query.brand_id;
    const openNow = req.query.openNow === 'true' || req.query.open_only === 'true';
    const userLat = req.query.lat ? parseFloat(req.query.lat) : null;
    const userLng = req.query.lng ? parseFloat(req.query.lng) : null;

    let query = `
      SELECT restaurants.*,
             brands.name as brand_name,
             brands.slug as brand_slug,
             brands.logo as brand_logo,
             brands.cuisine as brand_cuisine,
             brands.heritage_since as brand_heritage_since
      FROM restaurants
      LEFT JOIN brands ON restaurants.brand_id = brands.id
      WHERE restaurants.is_approved = 1 AND restaurants.is_suspended = 0
    `;
    const params = [];

    // Filter by brand
    if (brandParam) {
      if (/^\d+$/.test(brandParam)) {
        query += ' AND restaurants.brand_id = ?';
        params.push(Number(brandParam));
      } else {
        query += ' AND (brands.slug = ? OR LOWER(brands.name) = ?)';
        params.push(brandParam.toLowerCase(), brandParam.toLowerCase());
      }
    }

    // 1. Multi-token partial search across name, cuisine, location, address, description, menu_items, categories
    if (rawSearch && typeof rawSearch === 'string') {
      const searchStr = rawSearch.trim();
      if (searchStr !== '' && searchStr !== 'undefined' && searchStr !== 'null') {
        const tokens = searchStr.toLowerCase().split(/\s+/).filter(Boolean);
        
        tokens.forEach(token => {
          const isGenericRestaurantWord = token === 'restaurant' || token === 'restaurants' || token === 'kitchen' || token === 'kitchens';
          const isBangalore = token === 'bangalore' || token === 'bengaluru';
          
          if (isGenericRestaurantWord) {
            // General intent word for all dining establishments on the platform
            query += ' AND 1=1';
          } else if (isBangalore) {
            query += ` AND (
              LOWER(restaurants.name) LIKE '%bangalore%' OR LOWER(restaurants.name) LIKE '%bengaluru%'
              OR LOWER(COALESCE(restaurants.location, '')) LIKE '%bangalore%' OR LOWER(COALESCE(restaurants.location, '')) LIKE '%bengaluru%'
              OR LOWER(restaurants.address) LIKE '%bangalore%' OR LOWER(restaurants.address) LIKE '%bengaluru%'
              OR LOWER(restaurants.cuisine) LIKE '%bangalore%' OR LOWER(restaurants.cuisine) LIKE '%bengaluru%'
              OR LOWER(COALESCE(restaurants.description, '')) LIKE '%bangalore%' OR LOWER(COALESCE(restaurants.description, '')) LIKE '%bengaluru%'
            )`;
          } else {
            const pattern = `%${token}%`;
            query += ` AND (
              LOWER(restaurants.name) LIKE ?
              OR LOWER(COALESCE(brands.name, '')) LIKE ?
              OR LOWER(COALESCE(restaurants.branch_name, '')) LIKE ?
              OR LOWER(COALESCE(restaurants.area, '')) LIKE ?
              OR LOWER(restaurants.cuisine) LIKE ?
              OR LOWER(COALESCE(restaurants.location, '')) LIKE ?
              OR LOWER(restaurants.address) LIKE ?
              OR LOWER(COALESCE(restaurants.description, '')) LIKE ?
              OR EXISTS (
                SELECT 1 FROM menu_items mi 
                WHERE mi.restaurant_id = restaurants.id 
                AND (LOWER(mi.name) LIKE ? OR LOWER(COALESCE(mi.description, '')) LIKE ?)
              )
              OR EXISTS (
                SELECT 1 FROM categories c 
                WHERE c.restaurant_id = restaurants.id 
                AND LOWER(c.name) LIKE ?
              )
            )`;
            params.push(pattern, pattern, pattern, pattern, pattern, pattern, pattern, pattern, pattern, pattern, pattern);
          }
        });
      }
    }

    // 2. Specific Location Filter
    if (rawLocation && typeof rawLocation === 'string') {
      const loc = rawLocation.trim().toLowerCase();
      if (loc !== '' && loc !== 'all' && loc !== 'undefined' && loc !== 'null') {
        if (loc === 'bangalore' || loc === 'bengaluru') {
          query += ` AND (
            LOWER(COALESCE(restaurants.location, '')) LIKE '%bangalore%' 
            OR LOWER(COALESCE(restaurants.location, '')) LIKE '%bengaluru%'
            OR LOWER(restaurants.address) LIKE '%bangalore%' 
            OR LOWER(restaurants.address) LIKE '%bengaluru%'
          )`;
        } else {
          const locPattern = `%${loc}%`;
          query += ` AND (
            LOWER(COALESCE(restaurants.location, '')) LIKE ? 
            OR LOWER(restaurants.address) LIKE ?
          )`;
          params.push(locPattern, locPattern);
        }
      }
    }

    // 3. Category / Cuisine Filter
    if (rawCuisine && typeof rawCuisine === 'string') {
      const c = rawCuisine.trim().toLowerCase();
      if (c !== '' && c !== 'all' && c !== 'undefined' && c !== 'null') {
        const cPattern = `%${c}%`;
        query += ` AND (
          LOWER(restaurants.cuisine) LIKE ?
          OR EXISTS (
            SELECT 1 FROM categories c 
            WHERE c.restaurant_id = restaurants.id 
            AND LOWER(c.name) LIKE ?
          )
          OR EXISTS (
            SELECT 1 FROM menu_items mi 
            WHERE mi.restaurant_id = restaurants.id 
            AND (LOWER(mi.name) LIKE ? OR LOWER(COALESCE(mi.description, '')) LIKE ?)
          )
        )`;
        params.push(cPattern, cPattern, cPattern, cPattern);
      }
    }

    // 4. Open status
    if (openNow) {
      query += ' AND is_open = 1';
    }

    query += ' ORDER BY rating DESC, is_open DESC';

    const restaurants = db.prepare(query).all(...params);

    // Attach active item counts, computed live open status, distance, and CutTheQueue badge
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM menu_items WHERE restaurant_id = ? AND is_available = 1');
    let result = restaurants.map(r => {
      const isCurrentlyOpen = checkIsCurrentlyOpen(r);
      let calculatedDist = null;
      if (userLat !== null && userLng !== null && !isNaN(userLat) && !isNaN(userLng) && r.latitude && r.longitude) {
        calculatedDist = calculateHaversineKm(userLat, userLng, r.latitude, r.longitude);
      }

      return {
        ...r,
        isOpen: isCurrentlyOpen,
        is_currently_open: isCurrentlyOpen,
        available_items_count: countStmt.get(r.id).count,
        available_on_cutthequeue: true,
        calculatedDistance: calculatedDist !== null ? calculatedDist : (r.distance_km || null)
      };
    });

    if (openNow) {
      result = result.filter(r => r.is_currently_open);
    }

    if (userLat !== null && userLng !== null && !isNaN(userLat) && !isNaN(userLng)) {
      result.sort((a, b) => {
        const distA = a.calculatedDistance !== null ? a.calculatedDistance : 999;
        const distB = b.calculatedDistance !== null ? b.calculatedDistance : 999;
        return distA - distB;
      });
    }

    console.log(`[Restaurants] Search: ${rawSearch ? `"${rawSearch}"` : 'none'} | Results: ${result.length}`);

    // Return structured JSON with restaurants array and total count
    res.json({
      restaurants: result,
      total: result.length
    });
  } catch (err) {
    console.error('Fetch restaurants error:', err);
    res.status(500).json({ error: 'Failed to fetch restaurants.' });
  }
});

// Get single restaurant details + categories + menu items
router.get('/:id', (req, res) => {
  try {
    const isNumeric = /^\d+$/.test(req.params.id);
    let restaurant = isNumeric
      ? db.prepare(`
          SELECT r.*,
                 b.name as brand_name,
                 b.slug as brand_slug,
                 b.tagline as brand_tagline,
                 b.description as brand_description,
                 b.cuisine as brand_cuisine,
                 b.heritage_since as brand_heritage_since,
                 b.logo as brand_logo
          FROM restaurants r
          LEFT JOIN brands b ON r.brand_id = b.id
          WHERE r.id = ?
        `).get(req.params.id)
      : db.prepare(`
          SELECT r.*,
                 b.name as brand_name,
                 b.slug as brand_slug,
                 b.tagline as brand_tagline,
                 b.description as brand_description,
                 b.cuisine as brand_cuisine,
                 b.heritage_since as brand_heritage_since,
                 b.logo as brand_logo
          FROM restaurants r
          LEFT JOIN brands b ON r.brand_id = b.id
          WHERE b.slug = ? OR b.slug = ? OR b.slug = ? OR LOWER(r.name) LIKE ?
          ORDER BY r.id ASC LIMIT 1
        `).get(req.params.id, `the-${req.params.id}`, req.params.id.replace(/^the-/, ''), `%${req.params.id.replace(/-/g, ' ')}%`);

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
      restaurant: {
        ...restaurant,
        is_currently_open: checkIsCurrentlyOpen(restaurant)
      },
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
