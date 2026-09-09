const bcrypt = require('bcryptjs');
const { db } = require('./database');

async function seed() {
  console.log('Seeding database with realistic CutTheQueue Bangalore restaurants...');

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

  const yashvanthUser = insertUser.run(
    'Yashvanth Nayak',
    'yashvanthnayak1104@gmail.com',
    '+91 98765 00001',
    passwordHash,
    'customer',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    JSON.stringify({ push: true, sound: true, vibration: true })
  );

  // 2. Prepare restaurant, category, and menu item inserters
  const insertRestaurant = db.prepare(`
    INSERT INTO restaurants (
      name, description, cuisine, rating, logo, cover_image, address, location,
      latitude, longitude, contact_phone, opening_time, closing_time, is_open, is_approved,
      prep_time_minutes, min_order_amount, tax_rate, distance_km, owner_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertCategory = db.prepare(`
    INSERT INTO categories (restaurant_id, name, sort_order) VALUES (?, ?, ?)
  `);

  const insertMenuItem = db.prepare(`
    INSERT INTO menu_items (
      restaurant_id, category_id, name, description, price, is_veg, image, is_available, customizations_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Helper customizations
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
      name: 'Add-ons',
      type: 'multiple',
      required: false,
      options: [
        { label: 'Extra Ice Scoop', price: 15 },
        { label: 'Oat Milk Sub', price: 30 }
      ]
    }
  ]);

  const burgerCustomizations = JSON.stringify([
    {
      name: 'Size',
      type: 'single',
      required: true,
      options: [
        { label: 'Regular', price: 0 },
        { label: 'Double Layer', price: 45 }
      ]
    },
    {
      name: 'Cheese & Add-ons',
      type: 'multiple',
      required: false,
      options: [
        { label: 'Extra Cheddar Slice', price: 25 },
        { label: 'Caramelized Onions', price: 20 },
        { label: 'Jalapeno Relish', price: 15 }
      ]
    }
  ]);

  const dosaCustomizations = JSON.stringify([
    {
      name: 'Preparation Style',
      type: 'single',
      required: true,
      options: [
        { label: 'Crispy Butter Roast', price: 0 },
        { label: 'Special Ghee Roast', price: 20 },
        { label: 'Soft Pudi Roast', price: 15 }
      ]
    },
    {
      name: 'Accompaniments',
      type: 'multiple',
      required: false,
      options: [
        { label: 'Extra Coconut Chutney', price: 10 },
        { label: 'Extra Gunpowder Pudi', price: 15 }
      ]
    }
  ]);

  // ==========================================
  // 1. Green Leaf Cafe — Indiranagar — Cafe
  // ==========================================
  const r1 = insertRestaurant.run(
    'Green Leaf Cafe',
    'Chic artisanal cafe offering specialty coffees, sourdough delights, and fresh South Indian fusion bowls. Walk in and collect without the wait.',
    'South Indian • Cafe • Breakfast & Beverages',
    4.8,
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=120',
    'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=1000',
    '100 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038',
    'Indiranagar, Bengaluru',
    12.9784,
    77.6408,
    '+91 80 4123 4567',
    '07:30',
    '23:00',
    1,
    1,
    12,
    0,
    0.05,
    1.8,
    campusAdmin.lastInsertRowid
  );
  const r1Id = r1.lastInsertRowid;
  const c1_1 = insertCategory.run(r1Id, 'Signature Brews', 1).lastInsertRowid;
  const c1_2 = insertCategory.run(r1Id, 'Artisanal Breakfast', 2).lastInsertRowid;
  const c1_3 = insertCategory.run(r1Id, 'Pastries & Desserts', 3).lastInsertRowid;

  insertMenuItem.run(r1Id, c1_1, 'Cold Brew Tonic', 'Slow-steeped single-origin Arabica coffee topped with sparkling botanical tonic and orange peel.', 160, 1, 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600', 1, drinkCustomizations);
  insertMenuItem.run(r1Id, c1_1, 'Classic Cortado', 'Equal parts rich double espresso and velvety textured microfoam steamed whole milk.', 130, 1, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600', 1, drinkCustomizations);
  insertMenuItem.run(r1Id, c1_2, 'Avocado Sourdough Toast', 'Toasted rustic sourdough slices topped with smashed Hass avocado, cherry tomatoes, and microgreens.', 210, 1, 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600', 1, '[]');
  insertMenuItem.run(r1Id, c1_2, 'Ghee Roast Pudi Dosa', 'Golden Indiranagar style crispy crepe smeared with aromatic spicy chutney powder and clarified butter.', 135, 1, 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600', 1, dosaCustomizations);
  insertMenuItem.run(r1Id, c1_3, 'Warm Cinnamon Roll', 'Freshly baked brioche roll swirled with Ceylon cinnamon sugar and glazed with cream cheese frosting.', 120, 1, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600', 1, '[]');

  // ==========================================
  // 2. Bangalore Darshini — Jayanagar — South Indian
  // ==========================================
  const r2 = insertRestaurant.run(
    'Bangalore Darshini',
    'Legendary quick-service South Indian tiffin room serving steaming hot Thatte idlis, crispy vadas, and authentic Mysore filter coffee.',
    'South Indian • Pure Veg • Tiffin',
    4.7,
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=120',
    'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=1000',
    '4th Block, 11th Main Road, Jayanagar, Bengaluru, Karnataka 560011',
    'Jayanagar, Bengaluru',
    12.9308,
    77.5838,
    '+91 80 2658 9876',
    '06:30',
    '22:30',
    1,
    1,
    8,
    0,
    0.05,
    3.2,
    spiceAdmin.lastInsertRowid
  );
  const r2Id = r2.lastInsertRowid;
  const c2_1 = insertCategory.run(r2Id, 'Tiffin Specialties', 1).lastInsertRowid;
  const c2_2 = insertCategory.run(r2Id, 'Crispy Dosas', 2).lastInsertRowid;
  const c2_3 = insertCategory.run(r2Id, 'Beverages', 3).lastInsertRowid;

  insertMenuItem.run(r2Id, c2_1, 'Steaming Thatte Idli (Pair)', 'Two fluffy plate idlis soaked in freshly melted dairy ghee, served with coconut chutney & piping sambar.', 70, 1, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600', 1, '[]');
  insertMenuItem.run(r2Id, c2_1, 'Crispy Medu Vada (2 Pcs)', 'Crunchy golden lentil fritters spiced with whole black pepper and fresh curry leaves.', 60, 1, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600', 1, '[]');
  insertMenuItem.run(r2Id, c2_2, 'Masala Dosa with Red Chutney', 'Traditional Bengaluru red garlic paste lined crispy fermented crepe with spiced potato filling.', 95, 1, 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600', 1, dosaCustomizations);
  insertMenuItem.run(r2Id, c2_2, 'Open Butter Masala Dosa', 'Thick sponge base pancake roasted in fragrant country butter, topped with potato mash & chutney powder.', 110, 1, 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600', 1, dosaCustomizations);
  insertMenuItem.run(r2Id, c2_3, 'Mysore Filter Coffee', 'Freshly brewed chicory-roasted decoction blended with frothy boiled milk in traditional brass davarah.', 35, 1, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600', 1, '[]');

  // ==========================================
  // 3. Urban Burger House — Koramangala — Burgers
  // ==========================================
  const r3 = insertRestaurant.run(
    'Urban Burger House',
    'Gourmet smashed beef-alternative and crispy chicken burgers served with hand-cut rosemary fries and thick milkshakes.',
    'Burgers • Fast Food • American',
    4.6,
    'https://images.unsplash.com/photo-1550547660-d9450f859349?w=120',
    'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=1000',
    '80 Feet Road, 4th Block, Koramangala, Bengaluru, Karnataka 560034',
    'Koramangala, Bengaluru',
    12.9352,
    77.6245,
    '+91 80 4222 7890',
    '11:00',
    '23:45',
    1,
    1,
    15,
    0,
    0.05,
    2.5,
    campusAdmin.lastInsertRowid
  );
  const r3Id = r3.lastInsertRowid;
  const c3_1 = insertCategory.run(r3Id, 'Smashed Burgers', 1).lastInsertRowid;
  const c3_2 = insertCategory.run(r3Id, 'Sides & Fries', 2).lastInsertRowid;
  const c3_3 = insertCategory.run(r3Id, 'Shakes', 3).lastInsertRowid;

  insertMenuItem.run(r3Id, c3_1, 'Smash Chicken Bacon Melt', 'Double charred chicken patties with melted Monterey Jack cheese, smoky aioli, and brioche bun.', 239, 0, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600', 1, burgerCustomizations);
  insertMenuItem.run(r3Id, c3_1, 'Truffle Mushroom Veg Burger', 'Portobello mushroom & lentil patty infused with black truffle emulsion and Swiss melted cheese.', 199, 1, 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600', 1, burgerCustomizations);
  insertMenuItem.run(r3Id, c3_2, 'Peri-Peri Crinkle Fries', 'Crinkle-cut Idaho potatoes tossed in fiery African peri-peri spices with garlic cheese dip.', 119, 1, 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600', 1, '[]');
  insertMenuItem.run(r3Id, c3_3, 'Salted Caramel Thick Shake', 'Rich Madagascar vanilla ice cream churned with sea salt caramel ribbon and butter waffle crumbs.', 159, 1, 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600', 1, drinkCustomizations);

  // ==========================================
  // 4. Spice Route — Whitefield — Indian
  // ==========================================
  const r4 = insertRestaurant.run(
    'Spice Route',
    'Authentic royal North Indian curries, dum biryanis, and tandoor-charred kebabs prepared fresh for quick pickup by tech park commuters.',
    'Indian • North Indian • Biryani • Mughlai',
    4.5,
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=120',
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1000',
    'ITPL Main Road, KIADB Industrial Area, Whitefield, Bengaluru, Karnataka 560066',
    'Whitefield, Bengaluru',
    12.9863,
    77.7342,
    '+91 80 4333 1122',
    '11:30',
    '23:00',
    1,
    1,
    18,
    0,
    0.05,
    8.4,
    spiceAdmin.lastInsertRowid
  );
  const r4Id = r4.lastInsertRowid;
  const c4_1 = insertCategory.run(r4Id, 'Dum Biryani Specials', 1).lastInsertRowid;
  const c4_2 = insertCategory.run(r4Id, 'Tandoor & Curries', 2).lastInsertRowid;
  const c4_3 = insertCategory.run(r4Id, 'Breads & Accompaniments', 3).lastInsertRowid;

  insertMenuItem.run(r4Id, c4_1, 'Awadhi Chicken Dum Biryani', 'Long-grain fragrant basmati rice slow-cooked on dum with tender spiced chicken cuts and saffron.', 269, 0, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600', 1, '[]');
  insertMenuItem.run(r4Id, c4_1, 'Paneer Tikka Dum Biryani', 'Marinated tandoori cottage cheese cubes layered with caramelized onions and scented basmati rice.', 229, 1, 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=600', 1, '[]');
  insertMenuItem.run(r4Id, c4_2, 'Butter Chicken Delhi Style', 'Smoked shredded chicken simmered in rich velvety tomato cashew gravy with fenugreek butter.', 259, 0, 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600', 1, '[]');
  insertMenuItem.run(r4Id, c4_2, 'Paneer Butter Masala', 'Fresh farm paneer cubes steeped in aromatic buttery tomato sauce laced with cream.', 219, 1, 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600', 1, '[]');
  insertMenuItem.run(r4Id, c4_3, 'Butter Garlic Naan (2 Pcs)', 'Clay oven charred leavened flatbread brushed generously with garlic cloves and melted butter.', 65, 1, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600', 1, '[]');

  // ==========================================
  // 5. Dosa Corner — Malleshwaram — South Indian
  // ==========================================
  const r5 = insertRestaurant.run(
    'Dosa Corner',
    'Malleshwarams pride since 1982. World-famous Benne Dosas roasted in pure Davangere country butter and served with spicy potato saagu.',
    'South Indian • Traditional • Pure Veg',
    4.9,
    'https://images.unsplash.com/photo-1552611052-33e04de081de?w=120',
    'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=1000',
    'Margosa Road, Between 7th & 8th Cross, Malleshwaram, Bengaluru, Karnataka 560003',
    'Malleshwaram, Bengaluru',
    13.0031,
    77.5704,
    '+91 80 2334 5678',
    '07:00',
    '22:00',
    1,
    1,
    10,
    0,
    0.05,
    4.1,
    campusAdmin.lastInsertRowid
  );
  const r5Id = r5.lastInsertRowid;
  const c5_1 = insertCategory.run(r5Id, 'Benne Specialties', 1).lastInsertRowid;
  const c5_2 = insertCategory.run(r5Id, 'Traditional Tiffins', 2).lastInsertRowid;

  insertMenuItem.run(r5Id, c5_1, 'Davangere Benne Dosa', 'Fluffy inside, crisp outside pancake made on heavy cast-iron tawa with dollops of white butter.', 105, 1, 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600', 1, dosaCustomizations);
  insertMenuItem.run(r5Id, c5_1, 'Benne Masala Dosa', 'Crispy folded butter dosa generously stuffed with tempered spiced potato filling and served with coconut chutney.', 115, 1, 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600', 1, dosaCustomizations);
  insertMenuItem.run(r5Id, c5_2, 'Mangalore Buns (2 Pcs)', 'Sweet banana-fermented deep fried fluffy poori served with fiery coconut chutney & vegetable saagu.', 65, 1, 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600', 1, '[]');
  insertMenuItem.run(r5Id, c5_2, 'Filter Kaapi', 'Strong south Indian chicory coffee frothed in traditional tumbler.', 30, 1, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600', 1, '[]');

  // ==========================================
  // 6. Brew & Bites — HSR Layout — Cafe
  // ==========================================
  const r6 = insertRestaurant.run(
    'Brew & Bites',
    'Vibrant contemporary cafe in HSR Sector 3 serving cold brews, pressed paninis, and artisanal baked cheesecakes for quick pick-up.',
    'Cafe • Artisanal Coffee • Desserts & Bakery',
    4.7,
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=120',
    'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1000',
    'Sector 3, 27th Main Road, HSR Layout, Bengaluru, Karnataka 560102',
    'HSR Layout, Bengaluru',
    12.9116,
    77.6389,
    '+91 80 4555 6789',
    '08:00',
    '23:30',
    1,
    1,
    12,
    0,
    0.05,
    3.5,
    spiceAdmin.lastInsertRowid
  );
  const r6Id = r6.lastInsertRowid;
  const c6_1 = insertCategory.run(r6Id, 'Handcrafted Coffee', 1).lastInsertRowid;
  const c6_2 = insertCategory.run(r6Id, 'Gourmet Sandwiches', 2).lastInsertRowid;
  const c6_3 = insertCategory.run(r6Id, 'Bakery', 3).lastInsertRowid;

  insertMenuItem.run(r6Id, c6_1, 'Iced Spanish Hazelnut Latte', 'Espresso layered with condensed milk, toasted hazelnut syrup, and iced creamy milk.', 165, 1, 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600', 1, drinkCustomizations);
  insertMenuItem.run(r6Id, c6_1, 'Cappuccino Double Shot', 'Robust double shot espresso with velvety aerated microfoam.', 135, 1, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600', 1, drinkCustomizations);
  insertMenuItem.run(r6Id, c6_2, 'Pesto Mozzarella Panini', 'Pressed focaccia bread filled with sun-dried tomatoes, fresh mozzarella, and basil walnut pesto.', 185, 1, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600', 1, '[]');
  insertMenuItem.run(r6Id, c6_3, 'New York Blueberry Cheesecake', 'Silky baked cream cheese cake on butter graham cracker crust topped with wild blueberry compote.', 175, 1, 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600', 1, '[]');

  // ==========================================
  // 7. Pizza Hub — Koramangala — Pizza
  // ==========================================
  const r7 = insertRestaurant.run(
    'Pizza Hub',
    'Crisp hand-stretched sourdough pizzas, loaded calzones, and garlic pull-aparts baked to bubbly perfection in stone deck ovens.',
    'Pizza • Italian • Fast Food',
    4.6,
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=120',
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1000',
    '5th Block, Jyoti Nivas College Road, Koramangala, Bengaluru, Karnataka 560095',
    'Koramangala, Bengaluru',
    12.9344,
    77.6186,
    '+91 80 4666 7788',
    '11:00',
    '23:30',
    1,
    1,
    16,
    0,
    0.05,
    2.1,
    campusAdmin.lastInsertRowid
  );
  const r7Id = r7.lastInsertRowid;
  const c7_1 = insertCategory.run(r7Id, 'Artisanal Pizzas', 1).lastInsertRowid;
  const c7_2 = insertCategory.run(r7Id, 'Garlic Breads & Sides', 2).lastInsertRowid;

  insertMenuItem.run(r7Id, c7_1, 'Margherita Burrata Pizza (10 inch)', 'San Marzano plum tomato sauce, fior di latte mozzarella, whole creamy burrata cheese ball, and fresh basil.', 299, 1, 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=600', 1, '[]');
  insertMenuItem.run(r7Id, c7_1, 'Fiery Peri-Peri Chicken Pizza (10 inch)', 'Charcoal roast chicken chunks, spicy jalapenos, red paprika, and stretchy mozzarella.', 339, 0, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600', 1, '[]');
  insertMenuItem.run(r7Id, c7_1, 'Farmhouse Garden Supreme (10 inch)', 'Baby corn, black olives, crisp bell peppers, button mushrooms, and melted cheddar mozzarella blend.', 289, 1, 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=600', 1, '[]');
  insertMenuItem.run(r7Id, c7_2, 'Stuffed Cheesy Garlic Bread', 'Freshly baked baguette packed with herb garlic butter, sweet corn, and stringy mozzarella cheese.', 149, 1, 'https://images.unsplash.com/photo-1619881589772-a169b5f543fb?w=600', 1, '[]');

  // ==========================================
  // 8. Campus Cafe — Electronic City — Cafe
  // ==========================================
  const r8 = insertRestaurant.run(
    'Campus Cafe',
    'The premier hangout for tech professionals and students in Electronic City. Handcrafted burgers, iced frappes, and quick pickup bites.',
    'Cafe • Burgers • Fast Food • Beverages',
    4.8,
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=120',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000',
    'Phase 1, Electronic City, Bengaluru, Karnataka 560100',
    'Electronic City, Bengaluru',
    12.8452,
    77.6602,
    '+91 80 4777 8899',
    '08:00',
    '23:00',
    1,
    1,
    14,
    0,
    0.05,
    9.2,
    campusAdmin.lastInsertRowid
  );
  const r8Id = r8.lastInsertRowid;
  const c8_1 = insertCategory.run(r8Id, 'Burgers & Wraps', 1).lastInsertRowid;
  const c8_2 = insertCategory.run(r8Id, 'Quick Snacks', 2).lastInsertRowid;
  const c8_3 = insertCategory.run(r8Id, 'Iced Beverages', 3).lastInsertRowid;

  const zingerItem = insertMenuItem.run(r8Id, c8_1, 'Crispy Zinger Chicken Burger', 'Golden spiced crispy chicken fillet, fresh lettuce, and house chipotle dressing in sesame bun.', 169, 0, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600', 1, burgerCustomizations);
  const paneerItem = insertMenuItem.run(r8Id, c8_1, 'Paneer Crunch Burger', 'Herb-coated panko cottage cheese steak with mint mayonnaise and crunchy onions.', 149, 1, 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600', 1, burgerCustomizations);
  const nachosItem = insertMenuItem.run(r8Id, c8_2, 'Loaded Cheesy Nachos', 'Corn tortilla chips smothered in warm melted cheese sauce, salsa, and pickled jalapenos.', 139, 1, 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=600', 1, '[]');
  const frappeItem = insertMenuItem.run(r8Id, c8_3, 'Iced Caramel Frappe', 'Blended iced coffee with rich caramel fudge, topped with fluffy whipped cream.', 140, 1, 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600', 1, drinkCustomizations);

  // 3. Demo Orders for Campus Cafe (Order Flow & Tracking test)
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

  // Order 1: Past completed order
  const order1 = insertOrder.run(
    '#CQ1038',
    customerUser.lastInsertRowid,
    r8Id,
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
    zingerItem.lastInsertRowid,
    'Crispy Zinger Chicken Burger',
    1,
    169,
    JSON.stringify({ Size: 'Regular' }),
    169
  );

  insertPayment.run(
    order1.lastInsertRowid,
    259.9,
    'successful',
    'upi',
    'TXN_UPI_98371923',
    '-2 hours'
  );

  // Order 2: Active preparing order
  const order2 = insertOrder.run(
    '#CQ1042',
    customerUser.lastInsertRowid,
    r8Id,
    'preparing',
    'asap',
    null,
    308,
    15.4,
    10,
    0,
    333.4,
    'QR_CQ1042_READY_SECURE_TOKEN',
    'Extra napkins please',
    '-12 minutes',
    '-5 minutes'
  );

  insertOrderItem.run(
    order2.lastInsertRowid,
    zingerItem.lastInsertRowid,
    'Crispy Zinger Chicken Burger',
    1,
    169,
    JSON.stringify({ Size: 'Double Layer', 'Cheese & Add-ons': ['Extra Cheddar Slice'] }),
    214
  );

  insertOrderItem.run(
    order2.lastInsertRowid,
    nachosItem.lastInsertRowid,
    'Loaded Cheesy Nachos',
    1,
    139,
    JSON.stringify({}),
    139
  );

  insertPayment.run(
    order2.lastInsertRowid,
    333.4,
    'successful',
    'upi',
    'TXN_UPI_10429381',
    '-12 minutes'
  );

  db.prepare(`
    INSERT INTO notifications (user_id, order_id, type, title, message)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    customerUser.lastInsertRowid,
    order2.lastInsertRowid,
    'order_preparing',
    'Order Being Prepared 👨‍🍳',
    'Campus Cafe is currently preparing your pre-order #CQ1042. Head over when notified!'
  );

  console.log('✅ Database seeded successfully with 8 Bangalore restaurants!');
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
