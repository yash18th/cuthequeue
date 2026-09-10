const bcrypt = require('bcryptjs');
const { db, initDatabase } = require('./database');

async function seed(options = {}) {
  const { forceClean = false } = options;

  // 1. Ensure database schema and migrations exist
  initDatabase();

  if (forceClean) {
    console.log('[Seed] Force clean enabled. Wiping existing data tables...');
    db.exec(`
      DELETE FROM notifications;
      DELETE FROM payments;
      DELETE FROM order_items;
      DELETE FROM orders;
      DELETE FROM menu_items;
      DELETE FROM categories;
      DELETE FROM restaurants;
      DELETE FROM brands;
      DELETE FROM users;
    `);
  }

  const passwordHash = await bcrypt.hash('password123', 10);

  // 2. Idempotent User Upserter
  const getUserStmt = db.prepare('SELECT id, email, role, password_hash FROM users WHERE email = ?');
  const updatePasswordOnlyStmt = db.prepare('UPDATE users SET password_hash = ?, is_suspended = 0 WHERE id = ?');
  const insertUserStmt = db.prepare(`
    INSERT INTO users (name, email, phone, password_hash, role, avatar, notification_preferences, is_suspended)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0)
  `);
  const updateUserStmt = db.prepare(`
    UPDATE users SET name = ?, phone = ?, role = ?, is_suspended = 0 WHERE id = ?
  `);

  async function upsertUser(name, email, phone, role, avatar, expectedPassword = 'password123') {
    const cleanEmail = email.toLowerCase().trim();
    const existing = getUserStmt.get(cleanEmail);
    if (existing) {
      // Safely verify if existing password hash already matches expectedPassword
      let isValidPassword = false;
      try {
        if (existing.password_hash) {
          isValidPassword = await bcrypt.compare(expectedPassword, existing.password_hash);
        }
      } catch (err) {
        isValidPassword = false;
      }

      // If existing demo account has a mismatched or invalid hash, update ONLY the password hash
      if (!isValidPassword) {
        const freshHash = await bcrypt.hash(expectedPassword, 10);
        updatePasswordOnlyStmt.run(freshHash, existing.id);
        console.log(`[Seed] Safely updated password hash for demo account: ${cleanEmail}`);
      }

      // Keep user profile up to date without modifying other tables or deleting user
      updateUserStmt.run(name, phone, role, existing.id);
      return existing.id;
    } else {
      const freshHash = await bcrypt.hash(expectedPassword, 10);
      const res = insertUserStmt.run(
        name,
        cleanEmail,
        phone,
        freshHash,
        role,
        avatar,
        JSON.stringify({ push: true, sound: true, vibration: true })
      );
      return res.lastInsertRowid;
    }
  }

  const superAdminId = await upsertUser(
    'System Administrator',
    'admin@cutthequeue.com',
    '+91 99999 00000',
    'super_admin',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    'password123'
  );

  const rameshwaramAdminId = await upsertUser(
    'Rohan Sharma (The Rameshwaram Cafe)',
    'campus@demo.com',
    '+91 98765 11111',
    'restaurant_admin',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    'password123'
  );

  const empireAdminId = await upsertUser(
    'Farhan Khan (Empire Restaurant)',
    'spice@demo.com',
    '+91 98765 22222',
    'restaurant_admin',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    'password123'
  );

  const meghanaAdminId = await upsertUser(
    'Arjun Rao (Meghana Foods)',
    'meghana@demo.com',
    '+91 98765 33333',
    'restaurant_admin',
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150',
    'password123'
  );

  const customerUserId = await upsertUser(
    'Alex Morgan',
    'customer@demo.com',
    '+91 98765 43210',
    'customer',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    'password123'
  );

  await upsertUser(
    'Yashvanth Nayak',
    'yashvanthnayak1104@gmail.com',
    '+91 98765 00001',
    'customer',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    'password123'
  );

  // 3. Idempotent Brand Upserter
  const getBrandStmt = db.prepare('SELECT id FROM brands WHERE slug = ?');
  const insertBrandStmt = db.prepare(`
    INSERT INTO brands (name, slug, tagline, description, cuisine, heritage_since, logo, cover_image, rating)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  function upsertBrand(name, slug, tagline, description, cuisine, heritage_since, logo, cover_image, rating) {
    const existing = getBrandStmt.get(slug);
    if (existing) {
      return existing.id;
    }
    const res = insertBrandStmt.run(name, slug, tagline, description, cuisine, heritage_since, logo, cover_image, rating);
    return res.lastInsertRowid;
  }

  // 4. Idempotent Restaurant Upserter
  const getRestStmt = db.prepare('SELECT id, owner_id FROM restaurants WHERE brand_id = ? AND branch_name = ?');
  const insertRestStmt = db.prepare(`
    INSERT INTO restaurants (
      brand_id, name, branch_name, area, description, cuisine, rating, logo, cover_image, address, location,
      latitude, longitude, contact_phone, opening_time, closing_time, is_open, is_approved,
      prep_time_minutes, min_order_amount, tax_rate, distance_km, queue_status, queue_count, owner_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const updateRestOwnerStmt = db.prepare('UPDATE restaurants SET owner_id = ? WHERE id = ?');

  function upsertRestaurant(brandId, name, branch, ownerId) {
    const existing = getRestStmt.get(brandId, branch.branch_name);
    if (existing) {
      if (ownerId && existing.owner_id !== ownerId) {
        updateRestOwnerStmt.run(ownerId, existing.id);
      }
      return existing.id;
    }
    const res = insertRestStmt.run(
      brandId,
      name,
      branch.branch_name,
      branch.area,
      branch.description || '',
      branch.cuisine || '',
      branch.rating || 4.7,
      branch.logo || '',
      branch.cover_image || '',
      branch.address,
      branch.location,
      branch.latitude,
      branch.longitude,
      branch.contact_phone,
      branch.opening_time,
      branch.closing_time,
      1,
      1,
      branch.prep_time_minutes,
      0,
      0.05,
      branch.distance_km,
      branch.queue_status,
      branch.queue_count,
      ownerId
    );
    return res.lastInsertRowid;
  }

  // 5. Idempotent Categories & Menu Items
  const getCatStmt = db.prepare('SELECT id FROM categories WHERE restaurant_id = ? AND name = ?');
  const insertCatStmt = db.prepare('INSERT INTO categories (restaurant_id, name, sort_order) VALUES (?, ?, ?)');

  const getItemStmt = db.prepare('SELECT id FROM menu_items WHERE restaurant_id = ? AND name = ?');
  const insertItemStmt = db.prepare(`
    INSERT INTO menu_items (
      restaurant_id, category_id, name, description, price, is_veg, image, is_available, customizations_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  function upsertDishes(restId, dishGroups) {
    let sortOrder = 1;
    for (const group of dishGroups) {
      let catId;
      const existingCat = getCatStmt.get(restId, group.cat);
      if (existingCat) {
        catId = existingCat.id;
      } else {
        const catRes = insertCatStmt.run(restId, group.cat, sortOrder++);
        catId = catRes.lastInsertRowid;
      }

      for (const item of group.items) {
        const existingItem = getItemStmt.get(restId, item.name);
        if (!existingItem) {
          insertItemStmt.run(
            restId,
            catId,
            item.name,
            item.desc,
            item.price,
            item.is_veg,
            item.img,
            1,
            '[]'
          );
        }
      }
    }
  }

  // =========================================================================
  // BRAND 1: THE RAMESHWARAM CAFE
  // =========================================================================
  const b1Id = upsertBrand(
    'The Rameshwaram Cafe',
    'the-rameshwaram-cafe',
    'Authentic South Indian Heritage • Pure Dairy Ghee Goodness',
    'Bengaluru’s legendary premium South Indian breakfast and tiffin destination. Celebrated for pure dairy ghee podi dosas, piping hot button thatte idlis, and traditional Mysore filter coffee in traditional brassware.',
    'Pure Veg • South Indian • Breakfast & Tiffin',
    '2021',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=180',
    'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=1200',
    4.8
  );

  const rameshwaramBranches = [
    {
      branch_name: 'Indiranagar',
      area: 'Indiranagar',
      address: 'Plot No. 2984, 12th Main Rd, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560008',
      location: 'Indiranagar, Bengaluru',
      latitude: 12.9719,
      longitude: 77.6412,
      contact_phone: '+91 80 4123 4567',
      opening_time: '06:30',
      closing_time: '01:00',
      queue_status: 'busy',
      queue_count: 14,
      prep_time_minutes: 15,
      distance_km: 1.8,
      owner_id: rameshwaramAdminId,
      description: 'Bengaluru’s legendary premium South Indian breakfast and tiffin destination. Famous for fragrant pure dairy ghee delicacies, crispy Podi dosas, and filter coffee.',
      cuisine: 'Pure Veg • South Indian • Tiffin',
      rating: 4.8,
      logo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=180',
      cover_image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=1200'
    },
    {
      branch_name: 'JP Nagar',
      area: 'JP Nagar',
      address: '52, 2nd Phase, 15th Cross Rd, JP Nagar, Bengaluru, Karnataka 560078',
      location: 'JP Nagar, Bengaluru',
      latitude: 12.9105,
      longitude: 77.5857,
      contact_phone: '+91 80 4123 4568',
      opening_time: '06:30',
      closing_time: '01:00',
      queue_status: 'moderate',
      queue_count: 8,
      prep_time_minutes: 12,
      distance_km: 5.4,
      owner_id: null,
      description: 'The Rameshwaram Cafe JP Nagar branch offering warm South Indian breakfast and fresh ghee roasted dosas.',
      cuisine: 'Pure Veg • South Indian • Tiffin',
      rating: 4.7,
      logo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=180',
      cover_image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=1200'
    },
    {
      branch_name: 'Brookfield / Whitefield',
      area: 'Whitefield',
      address: 'ITPL Main Rd, Kundalahalli Colony, Brookefield, Bengaluru, Karnataka 560066',
      location: 'Whitefield, Bengaluru',
      latitude: 12.9698,
      longitude: 77.7144,
      contact_phone: '+91 80 4123 4569',
      opening_time: '06:30',
      closing_time: '01:00',
      queue_status: 'moderate',
      queue_count: 7,
      prep_time_minutes: 12,
      distance_km: 9.8,
      owner_id: null,
      description: 'Whitefield flagship outpost of The Rameshwaram Cafe.',
      cuisine: 'Pure Veg • South Indian • Tiffin',
      rating: 4.8,
      logo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=180',
      cover_image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=1200'
    },
    {
      branch_name: 'Rajajinagar',
      area: 'Rajajinagar',
      address: 'Dr. Rajkumar Rd, 2nd Block, Rajajinagar, Bengaluru, Karnataka 560010',
      location: 'Rajajinagar, Bengaluru',
      latitude: 12.9982,
      longitude: 77.5530,
      contact_phone: '+91 80 4123 4570',
      opening_time: '06:30',
      closing_time: '01:00',
      queue_status: 'low',
      queue_count: 4,
      prep_time_minutes: 10,
      distance_km: 7.2,
      owner_id: null,
      description: 'Rajajinagar branch serving pure ghee dosas and traditional degree filter coffee.',
      cuisine: 'Pure Veg • South Indian • Tiffin',
      rating: 4.7,
      logo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=180',
      cover_image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=1200'
    }
  ];

  const rameshwaramDishes = [
    {
      cat: 'Heritage Tiffin Specialties',
      items: [
        { name: 'Ghee Podi Idli (2 Pcs)', desc: 'Two fluffy steamed rice idlis generously bathed in hot dairy ghee and coated with signature spicy gun powder chutney pudi.', price: 110, is_veg: 1, img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600' },
        { name: 'Ghee Pudi Button Idlis (14 Pcs)', desc: 'Mini bite-sized idlis tossed in melted golden ghee and aromatic heritage podi with fresh grated coconut.', price: 125, is_veg: 1, img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600' },
        { name: 'Crispy Medu Vada (2 Pcs)', desc: 'Golden lentil fritters spiced with whole peppercorns and fresh curry leaves, served with coconut chutney and piping hot sambar.', price: 65, is_veg: 1, img: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=600' },
        { name: 'Steaming Thatte Idli with Vada', desc: 'Large Karnataka style flat plate idli topped with a dollop of white country butter and served alongside a crunchy vada.', price: 95, is_veg: 1, img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600' }
      ]
    },
    {
      cat: 'Signature Dosas & Crisps',
      items: [
        { name: 'Ghee Podi Masala Dosa', desc: 'The house benchmark. Crispy fermented rice crepe smeared with fiery red chutney, potato masala, and drenched in aromatic ghee.', price: 145, is_veg: 1, img: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600' },
        { name: 'Open Butter Masala Dosa', desc: 'Thick Bengaluru style golden sponge base roasted with country butter, topped with spiced potato mash and podi.', price: 135, is_veg: 1, img: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600' },
        { name: 'Ghee Plain Roast Dosa', desc: 'Paper thin golden roasted dosa made exclusively with pure butter-fat ghee and served with 3 signature house chutneys.', price: 110, is_veg: 1, img: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600' }
      ]
    },
    {
      cat: 'Beverages & Sweets',
      items: [
        { name: 'Authentic Degree Filter Coffee', desc: 'Freshly roasted chicory-blend decoction frothed with boiled full-cream milk in traditional brass davarah.', price: 40, is_veg: 1, img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600' },
        { name: 'Warm Ghee Badam Halwa', desc: 'Rich traditional dessert prepared with slow-roasted almond paste, saffron strands, and clarified butter.', price: 90, is_veg: 1, img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600' }
      ]
    }
  ];

  for (const branch of rameshwaramBranches) {
    const restId = upsertRestaurant(b1Id, `The Rameshwaram Cafe - ${branch.branch_name}`, branch, branch.owner_id);
    upsertDishes(restId, rameshwaramDishes);
  }

  // =========================================================================
  // BRAND 2: EMPIRE RESTAURANT
  // =========================================================================
  const b2Id = upsertBrand(
    'Empire Restaurant',
    'empire-restaurant',
    'The Taste of Bengaluru Since 1966 • Iconic Late-Night Dining',
    'An iconic institution of Bengaluru nightlife and comforting Mughlai feasts since 1966. Famous across generations for Empire Special Chicken Kebab, layered coin parottas, ghee rice with dal, and flavorful biryanis.',
    'North Indian • Mughlai • Arabian • Biryani',
    '1966',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=180',
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200',
    4.6
  );

  const empireBranches = [
    {
      branch_name: 'Church Street',
      area: 'Church Street',
      address: '36, Church St, Shanthala Nagar, Ashok Nagar, Bengaluru, Karnataka 560001',
      location: 'Church Street, Bengaluru',
      latitude: 12.9750,
      longitude: 77.6045,
      contact_phone: '+91 80 4041 4041',
      opening_time: '11:00',
      closing_time: '02:00',
      queue_status: 'busy',
      queue_count: 12,
      prep_time_minutes: 18,
      distance_km: 2.1,
      owner_id: empireAdminId,
      description: 'Iconic institution of Bengaluru nightlife and comforting Mughlai feasts since 1966. Famous for Empire Special Chicken Kebab, Coin Parottas, and Biryani.',
      cuisine: 'North Indian • Mughlai • Arabian • Biryani',
      rating: 4.6,
      logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=180',
      cover_image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200'
    },
    {
      branch_name: 'Koramangala',
      area: 'Koramangala',
      address: '103, Industrial Area, 5th Block, Koramangala, Bengaluru, Karnataka 560095',
      location: 'Koramangala, Bengaluru',
      latitude: 12.9352,
      longitude: 77.6180,
      contact_phone: '+91 80 4041 4042',
      opening_time: '11:00',
      closing_time: '02:00',
      queue_status: 'moderate',
      queue_count: 8,
      prep_time_minutes: 15,
      distance_km: 4.2,
      owner_id: null,
      description: 'Late night food lovers landmark in 5th Block Koramangala.',
      cuisine: 'North Indian • Mughlai • Arabian • Biryani',
      rating: 4.5,
      logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=180',
      cover_image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200'
    },
    {
      branch_name: 'Indiranagar',
      area: 'Indiranagar',
      address: '80 Feet Rd, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038',
      location: 'Indiranagar, Bengaluru',
      latitude: 12.9734,
      longitude: 77.6450,
      contact_phone: '+91 80 4041 4043',
      opening_time: '11:00',
      closing_time: '02:00',
      queue_status: 'moderate',
      queue_count: 9,
      prep_time_minutes: 15,
      distance_km: 1.6,
      owner_id: null,
      description: '80 Feet Road Indiranagar hub for delicious kebab platters and biryani.',
      cuisine: 'North Indian • Mughlai • Arabian • Biryani',
      rating: 4.6,
      logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=180',
      cover_image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200'
    },
    {
      branch_name: 'Jayanagar',
      area: 'Jayanagar',
      address: '37th Cross Rd, 9th Block, Jayanagar, Bengaluru, Karnataka 560069',
      location: 'Jayanagar, Bengaluru',
      latitude: 12.9180,
      longitude: 77.5925,
      contact_phone: '+91 80 4041 4044',
      opening_time: '11:00',
      closing_time: '01:30',
      queue_status: 'low',
      queue_count: 5,
      prep_time_minutes: 12,
      distance_km: 6.8,
      owner_id: null,
      description: 'Family dining favorite in Jayanagar 9th Block.',
      cuisine: 'North Indian • Mughlai • Arabian • Biryani',
      rating: 4.5,
      logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=180',
      cover_image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200'
    },
    {
      branch_name: 'Kammanahalli',
      area: 'Kammanahalli',
      address: 'CMR Road, HRBR Layout 2nd Block, Kalyan Nagar, Bengaluru, Karnataka 560043',
      location: 'Kammanahalli, Bengaluru',
      latitude: 13.0098,
      longitude: 77.6480,
      contact_phone: '+91 80 4041 4045',
      opening_time: '11:00',
      closing_time: '01:30',
      queue_status: 'low',
      queue_count: 3,
      prep_time_minutes: 12,
      distance_km: 8.5,
      owner_id: null,
      description: 'CMR Road Kammanahalli outlet for late evening rolls and meals.',
      cuisine: 'North Indian • Mughlai • Arabian • Biryani',
      rating: 4.5,
      logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=180',
      cover_image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200'
    }
  ];

  const empireDishes = [
    {
      cat: 'Empire Legendary Starters',
      items: [
        { name: 'Empire Special Chicken Kebab', desc: 'The timeless classic. Boneless chicken cubes marinated in heritage red spices and fried to crispy succulent perfection.', price: 220, is_veg: 0, img: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600' },
        { name: 'Arabian Jumbo Chicken Shawarma Roll', desc: 'Thin rumali roti rolled with slow-roasted shredded rotisserie chicken, garlic toum, and mild pickled veggies.', price: 140, is_veg: 0, img: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600' },
        { name: 'Paneer Ghee Roast', desc: 'Fresh cottage cheese cubes tossed in Kundapur style roasted whole red chilli masala with pure clarified butter.', price: 210, is_veg: 1, img: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600' }
      ]
    },
    {
      cat: 'Biryani, Ghee Rice & Curries',
      items: [
        { name: 'Empire Dum Chicken Biryani', desc: 'Aromatic seeraga samba rice cooked with whole spices, tender chicken cuts, mint, and saffron milk.', price: 240, is_veg: 0, img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600' },
        { name: 'Fragrant Ghee Rice with Yellow Dal', desc: 'Short-grain Jeerakasala rice sautéed with whole cashews and ghee, served with homestyle tadka yellow dal.', price: 160, is_veg: 1, img: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600' },
        { name: 'Kerala Coin Parotta (Pair)', desc: 'Two multi-layered flaky golden griddled parottas, crisp on the edges and soft inside.', price: 50, is_veg: 1, img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600' },
        { name: 'Old Delhi Butter Chicken', desc: 'Charcoal roasted tandoori chicken cooked in a velvety tomato, honey, and fresh cream gravy.', price: 260, is_veg: 0, img: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600' }
      ]
    }
  ];

  for (const branch of empireBranches) {
    const restId = upsertRestaurant(b2Id, `Empire Restaurant - ${branch.branch_name}`, branch, branch.owner_id);
    upsertDishes(restId, empireDishes);
  }

  // =========================================================================
  // BRAND 3: MEGHANA FOODS
  // =========================================================================
  const b3Id = upsertBrand(
    'Meghana Foods',
    'meghana-foods',
    'Bengaluru’s Iconic Andhra Biryani & Spice Master',
    'Synonymous with fiery Andhra cuisine and legendary long-grain Biryanis across Bengaluru since 2006. Cooked with authentic Guntur spices, tender marinated boneless cuts, and fragrant basmati.',
    'Andhra • Biryani Specialist • Spicy South Indian',
    '2006',
    'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=180',
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=1200',
    4.7
  );

  const meghanaBranches = [
    {
      branch_name: 'Koramangala',
      area: 'Koramangala',
      address: '124, 1st Cross Rd, 5th Block, Koramangala, Bengaluru, Karnataka 560095',
      location: 'Koramangala, Bengaluru',
      latitude: 12.9344,
      longitude: 77.6178,
      contact_phone: '+91 80 4110 4455',
      opening_time: '11:30',
      closing_time: '23:30',
      queue_status: 'very_busy',
      queue_count: 18,
      prep_time_minutes: 20,
      distance_km: 3.8,
      owner_id: meghanaAdminId,
      description: 'Synonymous with fiery Andhra cuisine and legendary long-grain Biryanis across Bengaluru since 2006. Cooked with authentic Guntur spices and basmati.',
      cuisine: 'Andhra • Biryani Specialist • Spicy South Indian',
      rating: 4.7,
      logo: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=180',
      cover_image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=1200'
    },
    {
      branch_name: 'Indiranagar',
      area: 'Indiranagar',
      address: '544, Chinmaya Mission Hospital Rd, Indiranagar, Bengaluru, Karnataka 560038',
      location: 'Indiranagar, Bengaluru',
      latitude: 12.9782,
      longitude: 77.6420,
      contact_phone: '+91 80 4110 4456',
      opening_time: '11:30',
      closing_time: '23:30',
      queue_status: 'busy',
      queue_count: 14,
      prep_time_minutes: 18,
      distance_km: 1.5,
      owner_id: null,
      description: 'CMH Road Indiranagar branch of Meghana Foods serving spicy boneless biryani.',
      cuisine: 'Andhra • Biryani Specialist • Spicy South Indian',
      rating: 4.7,
      logo: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=180',
      cover_image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=1200'
    },
    {
      branch_name: 'Jayanagar',
      area: 'Jayanagar',
      address: '11th Main, 4th Block, Jayanagar, Bengaluru, Karnataka 560011',
      location: 'Jayanagar, Bengaluru',
      latitude: 12.9298,
      longitude: 77.5830,
      contact_phone: '+91 80 4110 4457',
      opening_time: '11:30',
      closing_time: '23:30',
      queue_status: 'moderate',
      queue_count: 9,
      prep_time_minutes: 15,
      distance_km: 6.2,
      owner_id: null,
      description: 'Jayanagar 4th block hotspot for hot chilli chicken and paneer biryani.',
      cuisine: 'Andhra • Biryani Specialist • Spicy South Indian',
      rating: 4.6,
      logo: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=180',
      cover_image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=1200'
    },
    {
      branch_name: 'Residency Road',
      area: 'Residency Road',
      address: '57/1, Residency Rd, Ashok Nagar, Bengaluru, Karnataka 560025',
      location: 'Residency Road, Bengaluru',
      latitude: 12.9692,
      longitude: 77.6050,
      contact_phone: '+91 80 4110 4458',
      opening_time: '11:30',
      closing_time: '23:30',
      queue_status: 'moderate',
      queue_count: 8,
      prep_time_minutes: 15,
      distance_km: 2.8,
      owner_id: null,
      description: 'Residency Road CBD outlet serving busy business lunch crowds.',
      cuisine: 'Andhra • Biryani Specialist • Spicy South Indian',
      rating: 4.7,
      logo: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=180',
      cover_image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=1200'
    },
    {
      branch_name: 'Marathahalli',
      area: 'Marathahalli',
      address: 'Outer Ring Rd, Marathahalli Village, Bengaluru, Karnataka 560037',
      location: 'Marathahalli, Bengaluru',
      latitude: 12.9555,
      longitude: 77.7011,
      contact_phone: '+91 80 4110 4459',
      opening_time: '11:30',
      closing_time: '23:30',
      queue_status: 'low',
      queue_count: 5,
      prep_time_minutes: 12,
      distance_km: 8.9,
      owner_id: null,
      description: 'Marathahalli bridge outlet catering to eastern IT corridor.',
      cuisine: 'Andhra • Biryani Specialist • Spicy South Indian',
      rating: 4.6,
      logo: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=180',
      cover_image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=1200'
    }
  ];

  const meghanaDishes = [
    {
      cat: 'Meghana Famous Biryanis',
      items: [
        { name: 'Meghana Special Chicken Biryani (Boneless)', desc: 'The city favorite. Succulent boneless chicken pieces fried with hot green chillies, served over richly spiced Andhra dum biryani rice with raita & gravy.', price: 320, is_veg: 0, img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600' },
        { name: 'Andhra Chicken Biryani', desc: 'Classic bone-in chicken biryani cooked with Guntur red spices, fresh mint, coriander, and aged long-grain basmati.', price: 290, is_veg: 0, img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600' },
        { name: 'Meghana Paneer Biryani', desc: 'Generous cubes of soft malai paneer roasted in spicy Andhra masala layered over spiced basmati dum rice.', price: 260, is_veg: 1, img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600' }
      ]
    },
    {
      cat: 'Fiery Andhra Starters',
      items: [
        { name: 'Andhra Chilli Chicken', desc: 'Tender chicken cubes tossed with diced green chillies, garlic, and curry leaves. Fiery and intensely flavorful.', price: 250, is_veg: 0, img: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600' },
        { name: 'Crispy Chicken 65', desc: 'South Indian style deep-fried marinated chicken morsels tempered with mustard seeds and fresh curry leaves.', price: 240, is_veg: 0, img: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600' },
        { name: 'Tangy Lemon Chicken', desc: 'Wok-tossed chicken bites with fresh lime juice, crushed black pepper, and slivered ginger.', price: 240, is_veg: 0, img: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600' },
        { name: 'Andhra Dal Fry with Ghee', desc: 'Homestyle yellow toor dal tempered with mustard, cumin, dried red chillies, and melted ghee.', price: 150, is_veg: 1, img: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600' }
      ]
    }
  ];

  for (const branch of meghanaBranches) {
    const restId = upsertRestaurant(b3Id, `Meghana Foods - ${branch.branch_name}`, branch, branch.owner_id);
    upsertDishes(restId, meghanaDishes);
  }

  // 6. Safe Initial Demo Orders (Only created if zero orders exist)
  const orderCountRow = db.prepare('SELECT count(*) as count FROM orders').get();
  if (!orderCountRow || orderCountRow.count === 0) {
    const firstBranch = db.prepare('SELECT id FROM restaurants WHERE name LIKE ?').get('%Rameshwaram%Indiranagar%');
    if (firstBranch) {
      const firstMenuItem = db.prepare('SELECT id, name, price FROM menu_items WHERE restaurant_id = ? LIMIT 1').get(firstBranch.id);
      if (firstMenuItem) {
        const insertOrder = db.prepare(`
          INSERT INTO orders (
            order_number, customer_id, restaurant_id, status, pickup_type,
            subtotal, tax, fee, total, qr_code_token, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const insertOrderItem = db.prepare(`
          INSERT INTO order_items (order_id, menu_item_id, item_name, quantity, unit_price, total_price)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        const order1 = insertOrder.run(
          'CQ1042',
          customerUserId,
          firstBranch.id,
          'preparing',
          'asap',
          255,
          12.75,
          0,
          267.75,
          'CQ_DEMO_QR_1042_TOKEN',
          'Extra podi on the side please'
        );
        insertOrderItem.run(order1.lastInsertRowid, firstMenuItem.id, firstMenuItem.name, 2, firstMenuItem.price, firstMenuItem.price * 2);

        const order2 = insertOrder.run(
          'CQ1038',
          customerUserId,
          firstBranch.id,
          'completed',
          'asap',
          145,
          7.25,
          0,
          152.25,
          'CQ_DEMO_QR_1038_TOKEN',
          'Dine-in pickup'
        );
        insertOrderItem.run(order2.lastInsertRowid, firstMenuItem.id, firstMenuItem.name, 1, firstMenuItem.price, firstMenuItem.price);
      }
    }
  }

  // 7. Seed Initial Dynamic Restaurant Showcase Promotions
  const showcaseCountRow = db.prepare('SELECT count(*) as count FROM restaurant_showcases').get();
  if (!showcaseCountRow || showcaseCountRow.count === 0) {
    const insertShowcase = db.prepare(`
      INSERT INTO restaurant_showcases (
        restaurant_id, badge, promo_title, featured_dish, description,
        hero_image, custom_queue_text, custom_prep_minutes, pass_code, cta_text,
        is_active, display_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);

    const rameshwaramBranch = db.prepare("SELECT id FROM restaurants WHERE name LIKE '%Rameshwaram%Indiranagar%'").get();
    const empireBranch = db.prepare("SELECT id FROM restaurants WHERE name LIKE '%Empire%Church%'").get();
    const meghanaBranch = db.prepare("SELECT id FROM restaurants WHERE name LIKE '%Meghana%Koramangala%'").get();

    let order = 1;

    if (rameshwaramBranch) {
      insertShowcase.run(
        rameshwaramBranch.id,
        '✦ BENGALURU DINING HERITAGE',
        'Legendary Pure Dairy Ghee Podi Delicacies',
        'Ghee Podi Masala Dosa + Degree Filter Coffee',
        'Golden crisp fermented rice crepe bathed in pure clarified butter, smeared with fiery gun-powder chutney and served with traditional brassware decoction coffee.',
        'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=1200',
        '8 orders ahead in kitchen • Prepared fresh as you travel',
        12,
        'PASS CQ102',
        'Pre-order Now',
        order++
      );

      insertShowcase.run(
        rameshwaramBranch.id,
        '✦ INSTANT MORNING TIFFIN',
        'Steaming Hot Thatte Idlis & Crispy Medu Vadas',
        'Steaming Thatte Idli with Crunchy Vada',
        'Fluffy Karnataka plate idli crowned with fresh churned country white butter, paired with freshly ground coconut chutney and piping hot drumstick sambar.',
        'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=1200',
        '4 orders ahead in kitchen • Zero waiting at counter',
        10,
        'PASS CQ105',
        'Pre-order Breakfast',
        order++
      );
    }

    if (empireBranch) {
      insertShowcase.run(
        empireBranch.id,
        '✦ THE TASTE OF BENGALURU SINCE 1966',
        'Iconic Late-Night Feasts on Church Street',
        'Empire Special Chicken Kebab & Layered Coin Parotta',
        'Bengaluru’s legendary deep-marinated crisp fried spiced chicken morsels served alongside flaky multi-layered Malabar coin parottas and mint chutney.',
        'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200',
        '6 orders ahead • Fresh tandoor & grill dispatch',
        15,
        'PASS CQ201',
        'Order Feasts Now',
        order++
      );

      insertShowcase.run(
        empireBranch.id,
        '✦ MIDNIGHT COMFORT CLASSIC',
        'Fragrant Jeera Samba Ghee Rice & Mutton Sukka',
        'Empire Ghee Rice Combo with Homestyle Dal',
        'Short-grain fragrant rice gently roasted with whole aromatics and golden fried shallots, served with slow-simmered yellow toor dal.',
        'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=1200',
        '5 orders ahead • Ready in 12 mins',
        12,
        'PASS CQ204',
        'Pre-order Now',
        order++
      );
    }

    if (meghanaBranch) {
      insertShowcase.run(
        meghanaBranch.id,
        '✦ BENGALURU’S CULT BIRYANI INSTITUTION',
        'Cult-Favorite Andhra Boneless Chicken Dum Biryani',
        'Meghana Special Boneless Chicken Biryani',
        'Aromatic aged basmati layered with intensely marinated fiery Andhra boneless chicken pieces and drizzled with saffron ghee.',
        'https://images.unsplash.com/photo-1562967914-608f82629710?w=1200',
        '9 orders ahead • Straight from simmering handi',
        18,
        'PASS CQ301',
        'Pre-order Biryani',
        order++
      );

      insertShowcase.run(
        meghanaBranch.id,
        '✦ FIERY ANDHRA STARTERS',
        'Signature Andhra Chilli Chicken & Paneer 65',
        'Andhra Chilli Chicken with Curry Leaves',
        'Wok-tossed chicken bites with slivered green chillies, garlic cloves, crushed black pepper, and fragrant fresh curry leaves.',
        'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=1200',
        '7 orders ahead • Wok tossed live',
        14,
        'PASS CQ305',
        'Pre-order Starters',
        order++
      );
    }
    console.log(`[Seed] Seeded ${order - 1} dynamic restaurant showcase promotions`);
  }

  return { success: true };
}

if (require.main === module) {
  seed().then(() => {
    console.log('Database seed completed');
  }).catch(console.error);
}

module.exports = { seed };
