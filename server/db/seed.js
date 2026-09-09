const bcrypt = require('bcryptjs');
const { db } = require('./database');

async function seed() {
  console.log('Seeding database with realistic demo data...');

  // Clear existing data safely
  db.exec(`
    DELETE FROM notifications;
    DELETE FROM payments;
    DELETE FROM order_items;
    DELETE FROM orders;
    DELETE FROM menu_items;
    DELETE FROM categories;
    DELETE FROM restaurants;
    DELETE FROM users;
  `);

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Insert Users
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, phone, password_hash, role, avatar, notification_preferences)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const superAdmin = insertUser.run(
    'System Administrator',
    'admin@cutthequeue.com',
    '+91 99999 00000',
    passwordHash,
    'super_admin',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    JSON.stringify({ push: true, sound: true, vibration: true })
  );

  const campusAdmin = insertUser.run(
    'Rohan Sharma',
    'campus@demo.com',
    '+91 98765 11111',
    passwordHash,
    'restaurant_admin',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    JSON.stringify({ push: true, sound: true, vibration: true })
  );

  const spiceAdmin = insertUser.run(
    'Priya Patel',
    'spice@demo.com',
    '+91 98765 22222',
    passwordHash,
    'restaurant_admin',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    JSON.stringify({ push: true, sound: true, vibration: true })
  );

  const customerUser = insertUser.run(
    'Alex Morgan',
    'customer@demo.com',
    '+91 98765 43210',
    passwordHash,
    'customer',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    JSON.stringify({ push: true, sound: true, vibration: true })
  );

  // 2. Insert Restaurants
  const insertRestaurant = db.prepare(`
    INSERT INTO restaurants (
      name, description, cuisine, rating, logo, cover_image, address, contact_phone,
      opening_time, closing_time, is_open, prep_time_minutes, min_order_amount, tax_rate, distance_km, owner_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const campusCafe = insertRestaurant.run(
    'Campus Cafe',
    'The premier campus hangout for gourmet burgers, crispy snacks, and signature iced brews.',
    'Burgers • Fast Food • Beverages',
    4.8,
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=120',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000',
    'Student Center, 1st Floor, Main Campus',
    '+91 98765 11111',
    '08:30',
    '23:00',
    1,
    15,
    0,
    0.05,
    0.4,
    campusAdmin.lastInsertRowid
  );

  const spiceCorner = insertRestaurant.run(
    'Spice Corner',
    'Authentic buttery dosas, char-grilled paneer rolls, and comforting hot filter coffees.',
    'South Indian • Street Food • Rolls',
    4.6,
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=120',
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1000',
    'Food Court Block B, Gate No. 3',
    '+91 98765 22222',
    '09:00',
    '22:00',
    1,
    20,
    50,
    0.05,
    0.9,
    spiceAdmin.lastInsertRowid
  );

  const quickBites = insertRestaurant.run(
    'Quick Bites',
    'Freshly pressed juices, sourdough toasted sandwiches, and nutritious smoothie bowls on the go.',
    'Sandwiches • Fresh Juices • Healthy Bowls',
    4.4,
    'https://images.unsplash.com/photo-1552611052-33e04de081de?w=120',
    'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1000',
    'North Wing Corridor, Near Library',
    '+91 98765 33333',
    '08:00',
    '20:00',
    1,
    10,
    0,
    0.05,
    0.2,
    campusAdmin.lastInsertRowid
  );

  // 3. Insert Categories & Menu Items for Campus Cafe
  const insertCategory = db.prepare(`
    INSERT INTO categories (restaurant_id, name, sort_order) VALUES (?, ?, ?)
  `);

  const insertMenuItem = db.prepare(`
    INSERT INTO menu_items (
      restaurant_id, category_id, name, description, price, is_veg, image, is_available, customizations_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Campus Cafe Categories
  const catPopular = insertCategory.run(campusCafe.lastInsertRowid, 'Popular', 1);
  const catBurgers = insertCategory.run(campusCafe.lastInsertRowid, 'Burgers', 2);
  const catSnacks = insertCategory.run(campusCafe.lastInsertRowid, 'Snacks', 3);
  const catBeverages = insertCategory.run(campusCafe.lastInsertRowid, 'Beverages', 4);
  const catDesserts = insertCategory.run(campusCafe.lastInsertRowid, 'Desserts', 5);

  const burgerCustomizations = JSON.stringify([
    {
      name: 'Size',
      type: 'single',
      required: true,
      options: [
        { label: 'Regular', price: 0 },
        { label: 'Large (Double Layer)', price: 40 }
      ]
    },
    {
      name: 'Extras & Add-ons',
      type: 'multiple',
      required: false,
      options: [
        { label: 'Cheddar Cheese Slice', price: 20 },
        { label: 'Extra Patty', price: 50 },
        { label: 'Jalapeno & Chili Sauce', price: 10 }
      ]
    }
  ]);

  const drinkCustomizations = JSON.stringify([
    {
      name: 'Sugar Level',
      type: 'single',
      required: true,
      options: [
        { label: 'Standard Sweet', price: 0 },
        { label: 'Less Sugar', price: 0 },
        { label: 'Sugar Free', price: 0 }
      ]
    },
    {
      name: 'Toppings',
      type: 'multiple',
      required: false,
      options: [
        { label: 'Extra Scoop Vanilla Ice Cream', price: 25 },
        { label: 'Whipped Cream & Chocolate Drizzle', price: 20 }
      ]
    }
  ]);

  insertMenuItem.run(
    campusCafe.lastInsertRowid,
    catPopular.lastInsertRowid,
    'Chicken Burger',
    'Crispy golden spiced chicken patty with fresh lettuce, farm tomatoes, and garlic herb mayo.',
    149,
    0,
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600',
    1,
    burgerCustomizations
  );

  insertMenuItem.run(
    campusCafe.lastInsertRowid,
    catBurgers.lastInsertRowid,
    'Veg Supreme Burger',
    'Herb potato and sweet corn patty topped with crunchy onions and tangy smoky mustard.',
    119,
    1,
    'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600',
    1,
    burgerCustomizations
  );

  insertMenuItem.run(
    campusCafe.lastInsertRowid,
    catSnacks.lastInsertRowid,
    'French Fries (Peri-Peri)',
    'Crispy crinkle-cut golden potato fries tossed in fiery African peri-peri dust.',
    89,
    1,
    'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600',
    1,
    JSON.stringify([
      {
        name: 'Dipping Sauce',
        type: 'multiple',
        required: false,
        options: [
          { label: 'Cheesy Jalapeno Dip', price: 20 },
          { label: 'Creamy Garlic Aioli', price: 15 }
        ]
      }
    ])
  );

  insertMenuItem.run(
    campusCafe.lastInsertRowid,
    catSnacks.lastInsertRowid,
    'Loaded Cheesy Nachos',
    'Crisp corn tortilla chips smothered in warm cheddar sauce, fresh salsa, and jalapenos.',
    129,
    1,
    'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=600',
    1,
    '[]'
  );

  insertMenuItem.run(
    campusCafe.lastInsertRowid,
    catBeverages.lastInsertRowid,
    'Cold Coffee with Ice Cream',
    'Creamy thick iced espresso shake crowned with a generous scoop of vanilla ice cream.',
    99,
    1,
    'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600',
    1,
    drinkCustomizations
  );

  insertMenuItem.run(
    campusCafe.lastInsertRowid,
    catBeverages.lastInsertRowid,
    'Chocolate Brownie Shake',
    'Decadent Belgian chocolate shake blended with crushed oven-baked fudge brownies.',
    139,
    1,
    'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600',
    1,
    drinkCustomizations
  );

  insertMenuItem.run(
    campusCafe.lastInsertRowid,
    catDesserts.lastInsertRowid,
    'Choco Lava Cake',
    'Warm individual chocolate sponge cake with an irresistible warm molten chocolate lava center.',
    89,
    1,
    'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600',
    1,
    '[]'
  );

  // Spice Corner Categories & Menu Items
  const scPopular = insertCategory.run(spiceCorner.lastInsertRowid, 'Popular', 1);
  const scDosa = insertCategory.run(spiceCorner.lastInsertRowid, 'Dosa & Tiffin', 2);
  const scRolls = insertCategory.run(spiceCorner.lastInsertRowid, 'Rolls & Wraps', 3);
  const scDrinks = insertCategory.run(spiceCorner.lastInsertRowid, 'Beverages', 4);

  insertMenuItem.run(
    spiceCorner.lastInsertRowid,
    scPopular.lastInsertRowid,
    'Butter Masala Dosa',
    'Crispy golden fermented rice-lentil crepe stuffed with aromatic spiced potato mash, served with coconut chutney & sambar.',
    110,
    1,
    'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600',
    1,
    JSON.stringify([
      {
        name: 'Preparation',
        type: 'single',
        required: true,
        options: [
          { label: 'Medium Butter', price: 0 },
          { label: 'Extra Ghee & Butter Roast', price: 20 }
        ]
      }
    ])
  );

  insertMenuItem.run(
    spiceCorner.lastInsertRowid,
    scRolls.lastInsertRowid,
    'Paneer Tikka Kathi Roll',
    'Tandoor spiced paneer cubes tossed with crunchy bell peppers rolled in a flaky butter paratha with mint relish.',
    130,
    1,
    'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600',
    1,
    JSON.stringify([
      {
        name: 'Add Cheese',
        type: 'multiple',
        required: false,
        options: [{ label: 'Grated Amul Cheese', price: 25 }]
      }
    ])
  );

  insertMenuItem.run(
    spiceCorner.lastInsertRowid,
    scRolls.lastInsertRowid,
    'Chicken Tikka Roll',
    'Marinated charred chicken chunks with zesty pickled onions, rolled in flaky paratha.',
    150,
    0,
    'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=600',
    1,
    '[]'
  );

  insertMenuItem.run(
    spiceCorner.lastInsertRowid,
    scDrinks.lastInsertRowid,
    'Madras Filter Coffee',
    'Authentic South Indian chicory-blend coffee frothed to perfection with boiling fresh milk.',
    45,
    1,
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600',
    1,
    '[]'
  );

  // Quick Bites Items
  const qbSandwiches = insertCategory.run(quickBites.lastInsertRowid, 'Sandwiches', 1);
  const qbJuices = insertCategory.run(quickBites.lastInsertRowid, 'Fresh Juices', 2);

  insertMenuItem.run(
    quickBites.lastInsertRowid,
    qbSandwiches.lastInsertRowid,
    'Grilled Cheese & Corn Sandwich',
    'Toasted sourdough sandwich loaded with sweet American corn and mozzarella cheese.',
    99,
    1,
    'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600',
    1,
    '[]'
  );

  insertMenuItem.run(
    quickBites.lastInsertRowid,
    qbJuices.lastInsertRowid,
    'Fresh Watermelon Cooler',
    '100% freshly pressed hydrating watermelon juice with a hint of fresh mint and lime.',
    69,
    1,
    'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?w=600',
    1,
    '[]'
  );

  // 4. Insert Demo Completed and Active Orders for Campus Cafe
  const insertOrder = db.prepare(`
    INSERT INTO orders (
      order_number, customer_id, restaurant_id, status, pickup_type, scheduled_time,
      subtotal, tax, fee, discount, total, qr_code_token, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?), datetime('now', ?))
  `);

  const insertOrderItem = db.prepare(`
    INSERT INTO order_items (
      order_id, menu_item_id, item_name, quantity, unit_price, customizations_selected_json, total_price
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertPayment = db.prepare(`
    INSERT INTO payments (
      order_id, amount, status, method, transaction_ref, created_at
    ) VALUES (?, ?, ?, ?, ?, datetime('now', ?))
  `);

  // Past completed order 1
  const order1 = insertOrder.run(
    '#CQ1038',
    customerUser.lastInsertRowid,
    campusCafe.lastInsertRowid,
    'completed',
    'asap',
    null,
    238,
    11.9,
    10,
    0,
    259.9,
    'QR_CQ1038_COMPLETED',
    'Less spicy please',
    '-2 hours',
    '-1 hour'
  );

  insertOrderItem.run(
    order1.lastInsertRowid,
    1,
    'Chicken Burger',
    1,
    149,
    JSON.stringify({ Size: 'Regular' }),
    149
  );

  insertOrderItem.run(
    order1.lastInsertRowid,
    3,
    'French Fries (Peri-Peri)',
    1,
    89,
    JSON.stringify({}),
    89
  );

  insertPayment.run(
    order1.lastInsertRowid,
    259.9,
    'successful',
    'upi',
    'TXN_UPI_98371923',
    '-2 hours'
  );

  // Active preparing order 2
  const order2 = insertOrder.run(
    '#CQ1042',
    customerUser.lastInsertRowid,
    campusCafe.lastInsertRowid,
    'preparing',
    'asap',
    null,
    337,
    16.85,
    10,
    0,
    363.85,
    'QR_CQ1042_READY_SECURE_TOKEN',
    'Extra napkins',
    '-12 minutes',
    '-5 minutes'
  );

  insertOrderItem.run(
    order2.lastInsertRowid,
    1,
    'Chicken Burger',
    1,
    149,
    JSON.stringify({ Size: 'Large (Double Layer)', 'Extras & Add-ons': ['Cheddar Cheese Slice'] }),
    209
  );

  insertOrderItem.run(
    order2.lastInsertRowid,
    4,
    'Loaded Cheesy Nachos',
    1,
    129,
    JSON.stringify({}),
    129
  );

  insertPayment.run(
    order2.lastInsertRowid,
    363.85,
    'successful',
    'upi',
    'TXN_UPI_10429381',
    '-12 minutes'
  );

  // Insert notification for order2
  db.prepare(`
    INSERT INTO notifications (user_id, order_id, type, title, message)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    customerUser.lastInsertRowid,
    order2.lastInsertRowid,
    'order_preparing',
    'Order Being Prepared 👨‍🍳',
    'Campus Cafe is currently preparing your order #CQ1042.'
  );

  console.log('Database seeded successfully!');
  console.log('Demo Credentials:');
  console.log('  Customer:         customer@demo.com / password123');
  console.log('  Campus Admin:     campus@demo.com / password123');
  console.log('  Spice Admin:      spice@demo.com / password123');
  console.log('  Super Admin:      admin@cutthequeue.com / password123');
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}

module.exports = { seed };
