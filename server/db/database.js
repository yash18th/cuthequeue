const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const defaultDbPath = path.join(__dirname, '../../data/cutthequeue.db');
const dbPath = process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : defaultDbPath;
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable WAL mode and foreign key constraints for high concurrency and relational safety
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('customer', 'restaurant_admin', 'super_admin')),
      avatar TEXT,
      notification_preferences TEXT DEFAULT '{"push":true,"sound":true,"vibration":true}',
      is_suspended INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      tagline TEXT,
      description TEXT,
      cuisine TEXT,
      heritage_since TEXT,
      logo TEXT,
      cover_image TEXT,
      rating REAL DEFAULT 4.8,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS restaurants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      cuisine TEXT,
      rating REAL DEFAULT 4.5,
      logo TEXT,
      cover_image TEXT,
      address TEXT NOT NULL,
      location TEXT,
      latitude REAL,
      longitude REAL,
      contact_phone TEXT,
      opening_time TEXT DEFAULT '08:00',
      closing_time TEXT DEFAULT '23:30',
      is_open INTEGER DEFAULT 1,
      is_approved INTEGER DEFAULT 1,
      is_suspended INTEGER DEFAULT 0,
      prep_time_minutes INTEGER DEFAULT 15,
      min_order_amount REAL DEFAULT 0,
      tax_rate REAL DEFAULT 0.05,
      distance_km REAL DEFAULT 1.2,
      owner_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      is_veg INTEGER DEFAULT 1,
      image TEXT,
      is_available INTEGER DEFAULT 1,
      customizations_json TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL UNIQUE,
      customer_id INTEGER NOT NULL,
      restaurant_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected', 'preparing', 'ready', 'completed', 'cancelled')),
      pickup_type TEXT NOT NULL DEFAULT 'asap' CHECK(pickup_type IN ('asap', 'scheduled')),
      scheduled_time TEXT,
      subtotal REAL NOT NULL,
      tax REAL NOT NULL,
      fee REAL NOT NULL,
      discount REAL DEFAULT 0,
      total REAL NOT NULL,
      qr_code_token TEXT NOT NULL UNIQUE,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      menu_item_id INTEGER,
      item_name TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL,
      customizations_selected_json TEXT DEFAULT '{}',
      total_price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'successful', 'failed', 'refunded')),
      method TEXT NOT NULL DEFAULT 'upi',
      transaction_ref TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      order_id INTEGER,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS restaurant_showcases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER NOT NULL,
      badge TEXT DEFAULT 'BENGALURU DINING HERITAGE',
      promo_title TEXT NOT NULL,
      featured_dish TEXT NOT NULL,
      description TEXT,
      hero_image TEXT NOT NULL,
      custom_queue_text TEXT,
      custom_prep_minutes INTEGER,
      pass_code TEXT DEFAULT 'PASS CQ102',
      cta_text TEXT DEFAULT 'Pre-order Now',
      is_active INTEGER DEFAULT 1,
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
    );
  `);

  // Run migrations for backwards compatibility with existing SQLite files
  const restaurantCols = db.prepare("PRAGMA table_info(restaurants)").all().map(c => c.name);
  if (!restaurantCols.includes('location')) {
    db.exec('ALTER TABLE restaurants ADD COLUMN location TEXT;');
  }
  if (!restaurantCols.includes('latitude')) {
    db.exec('ALTER TABLE restaurants ADD COLUMN latitude REAL;');
  }
  if (!restaurantCols.includes('longitude')) {
    db.exec('ALTER TABLE restaurants ADD COLUMN longitude REAL;');
  }
  if (!restaurantCols.includes('brand_id')) {
    db.exec('ALTER TABLE restaurants ADD COLUMN brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL;');
  }
  if (!restaurantCols.includes('branch_name')) {
    db.exec('ALTER TABLE restaurants ADD COLUMN branch_name TEXT;');
  }
  if (!restaurantCols.includes('area')) {
    db.exec('ALTER TABLE restaurants ADD COLUMN area TEXT;');
  }
  if (!restaurantCols.includes('queue_status')) {
    db.exec("ALTER TABLE restaurants ADD COLUMN queue_status TEXT DEFAULT 'moderate';");
  }
  if (!restaurantCols.includes('queue_count')) {
    db.exec('ALTER TABLE restaurants ADD COLUMN queue_count INTEGER DEFAULT 6;');
  }

  // Users table branch migrations
  const userCols = db.prepare("PRAGMA table_info(users)").all().map(c => c.name);
  if (!userCols.includes('restaurant_id')) {
    db.exec('ALTER TABLE users ADD COLUMN restaurant_id INTEGER REFERENCES brands(id) ON DELETE SET NULL;');
  }
  if (!userCols.includes('branch_id')) {
    db.exec('ALTER TABLE users ADD COLUMN branch_id INTEGER REFERENCES restaurants(id) ON DELETE SET NULL;');
  }

  // Orders table branch migrations
  const orderCols = db.prepare("PRAGMA table_info(orders)").all().map(c => c.name);
  if (!orderCols.includes('branch_id')) {
    db.exec('ALTER TABLE orders ADD COLUMN branch_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE;');
  }
  // Backfill legacy orders with branch_id = restaurant_id if null
  db.exec('UPDATE orders SET branch_id = restaurant_id WHERE branch_id IS NULL;');

  // Create branches view for clean relational model access
  db.exec(`
    CREATE VIEW IF NOT EXISTS branches AS
    SELECT 
      id,
      COALESCE(brand_id, id) AS restaurant_id,
      COALESCE(branch_name, name) AS name,
      address,
      area,
      location,
      latitude,
      longitude,
      contact_phone,
      opening_time,
      closing_time,
      is_open,
      is_approved,
      is_suspended,
      prep_time_minutes,
      queue_status,
      queue_count,
      rating,
      owner_id,
      created_at
    FROM restaurants;
  `);

  // Normalize any existing emails in the database for case-insensitive consistency
  try {
    db.exec(`UPDATE users SET email = LOWER(TRIM(email)) WHERE email != LOWER(TRIM(email)) OR email LIKE ' %' OR email LIKE '% ';`);
  } catch (normErr) {
    console.warn('[Database] Email normalization note:', normErr.message);
  }

  // Create performance indexes if not exists
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(LOWER(TRIM(email)));
    CREATE INDEX IF NOT EXISTS idx_users_branch_id ON users(branch_id);
    CREATE INDEX IF NOT EXISTS idx_restaurants_brand_id ON restaurants(brand_id);
    CREATE INDEX IF NOT EXISTS idx_restaurants_owner_id ON restaurants(owner_id);
    CREATE INDEX IF NOT EXISTS idx_categories_restaurant ON categories(restaurant_id);
    CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);
    CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON orders(restaurant_id);
    CREATE INDEX IF NOT EXISTS idx_orders_branch_id ON orders(branch_id);
    CREATE INDEX IF NOT EXISTS idx_showcases_restaurant ON restaurant_showcases(restaurant_id);
    CREATE INDEX IF NOT EXISTS idx_showcases_active ON restaurant_showcases(is_active);
  `);

  console.log(`[Database] Connected to SQLite database: ${dbPath}`);
  return { success: true, dbPath };
}

module.exports = { db, initDatabase, dbPath };
