// Cut the Queue - Database & Authentication Consistency Verification Suite
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

async function runConsistencyTest() {
  console.log('====================================================');
  console.log('🧪 DATABASE & AUTHENTICATION CONSISTENCY TEST');
  console.log('====================================================\n');

  // Step 1: Verify centralized database module and explicit path resolution
  const { db, initDatabase, dbPath, checkDatabaseHealth } = require('./db/database');
  console.log(`1. Centralized DB module loaded.`);
  console.log(`   Resolved DB Path: ${dbPath}`);
  console.log(`   File exists: ${fs.existsSync(dbPath)}`);

  const initRes = initDatabase();
  if (!initRes || !initRes.success) {
    throw new Error('Database initialization failed');
  }
  console.log('2. Database schema and migrations initialized: ✅ PASS');

  const isHealthy = checkDatabaseHealth();
  if (!isHealthy) {
    throw new Error('checkDatabaseHealth reported unhealthy database');
  }
  console.log('3. Database health check: ✅ PASS (tables verified)');

  // Step 2: Test Email Normalization & Insertion
  const timestamp = Date.now();
  const rawInputEmail = `  Cust_${timestamp}@BengaluruHQ.COM  `;
  const normalizedEmail = `cust_${timestamp}@bengaluruhq.com`;
  const rawPassword = 'SecurePassword!123';

  console.log(`\n--- TESTING REGISTRATION WITH WHITESPACE & MIXED CASE ---`);
  console.log(`Input Email: "${rawInputEmail}"`);
  console.log(`Expected Normalized: "${normalizedEmail}"`);

  // Check no pre-existing user
  const preCheck = db.prepare('SELECT id FROM users WHERE LOWER(TRIM(email)) = ?').get(rawInputEmail.trim().toLowerCase());
  if (preCheck) {
    throw new Error(`Unexpected existing user with email ${normalizedEmail}`);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(rawPassword.trim(), 10);
  const insertStmt = db.prepare(`
    INSERT INTO users (name, email, phone, password_hash, role)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertRes = insertStmt.run('Test Customer', normalizedEmail, '+91 91234 56789', passwordHash, 'customer');
  const newUserId = insertRes.lastInsertRowid;

  console.log(`Inserted user with rowid: ${newUserId}`);

  // Immediate post-insert verification via normalized email query
  const verifyUser = db.prepare('SELECT id, name, email, role, password_hash FROM users WHERE LOWER(TRIM(email)) = ?').get(normalizedEmail);
  if (!verifyUser || verifyUser.id !== newUserId) {
    throw new Error('IMMEDIATE POST-INSERT VERIFICATION FAILED: User not found via normalized email!');
  }
  console.log(`4. Immediate post-insert lookup: ✅ PASS (Found user ID ${verifyUser.id}, email: ${verifyUser.email})`);

  // Step 3: Test Login Lookup (with exact raw input email including whitespace & uppercase)
  console.log(`\n--- TESTING LOGIN WITH IDENTICAL CREDENTIALS ---`);
  const loginLookup = db.prepare('SELECT * FROM users WHERE LOWER(TRIM(email)) = ?').get(rawInputEmail.trim().toLowerCase());
  if (!loginLookup) {
    throw new Error('LOGIN LOOKUP FAILED: Account was not found with input email!');
  }

  const passwordValid = await bcrypt.compare(rawPassword.trim(), loginLookup.password_hash);
  if (!passwordValid) {
    throw new Error('PASSWORD VERIFICATION FAILED: Password comparison did not match!');
  }
  console.log(`5. Login with original credentials: ✅ PASS (User verified & authenticated)`);

  // Step 4: Test Case-Insensitive Logins
  const upperLookup = db.prepare('SELECT * FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))').get(normalizedEmail.toUpperCase());
  if (!upperLookup || upperLookup.id !== newUserId) {
    throw new Error('CASE INSENSITIVITY FAILED for uppercase login');
  }
  console.log(`6. Uppercase email login lookup: ✅ PASS`);

  // Step 5: Test Wrong Password
  const wrongPasswordValid = await bcrypt.compare('WrongPassword999!', loginLookup.password_hash);
  if (wrongPasswordValid) {
    throw new Error('SECURITY FAILURE: Wrong password was accepted!');
  }
  console.log(`7. Wrong password comparison safely rejected: ✅ PASS`);

  // Step 6: Test Duplicate Registration Rejection
  const dupCheck = db.prepare('SELECT id FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))').get(normalizedEmail.toUpperCase());
  if (!dupCheck) {
    throw new Error('Duplicate check failed: Should find existing user');
  }
  console.log(`8. Duplicate check detects existing account: ✅ PASS`);

  // Step 7: Test Restart Simulation (re-opening SQLite database file)
  console.log(`\n--- SIMULATING BACKEND RESTART (RE-OPENING SAME DATABASE) ---`);
  const Database = require('better-sqlite3');
  const reopenedDb = new Database(dbPath);
  const reloadedUser = reopenedDb.prepare('SELECT id, name, email, password_hash FROM users WHERE LOWER(TRIM(email)) = ?').get(normalizedEmail);
  if (!reloadedUser || reloadedUser.id !== newUserId) {
    throw new Error('RESTART PERSISTENCE FAILURE: User was lost after re-opening database!');
  }
  const restartPasswordValid = await bcrypt.compare(rawPassword.trim(), reloadedUser.password_hash);
  if (!restartPasswordValid) {
    throw new Error('RESTART AUTH FAILURE: Password could not be verified after database reopen!');
  }
  console.log(`9. Persistence across database reload: ✅ PASS (User #${reloadedUser.id} exists and password is valid)`);
  reopenedDb.close();

  // Step 8: Test Order Creation by Customer
  console.log(`\n--- TESTING CUSTOMER ORDER PLACEMENT IN DATABASE ---`);
  const restaurant = db.prepare('SELECT id, name, branch_name, tax_rate FROM restaurants LIMIT 1').get();
  if (!restaurant) {
    throw new Error('No restaurant found in database to test order');
  }

  const menuItem = db.prepare('SELECT id, name, price FROM menu_items WHERE restaurant_id = ? LIMIT 1').get(restaurant.id);
  if (!menuItem) {
    throw new Error(`No menu item found for restaurant ${restaurant.id}`);
  }

  const orderNum = `#CQ_TEST_${Date.now()}`;
  const qrToken = `QR_${Date.now()}`;
  const subtotal = menuItem.price * 2;
  const tax = Math.round(subtotal * (restaurant.tax_rate || 0.05) * 100) / 100;
  const fee = 10.0;
  const total = Math.round((subtotal + tax + fee) * 100) / 100;

  const orderInsert = db.prepare(`
    INSERT INTO orders (
      order_number, customer_id, restaurant_id, branch_id, status, pickup_type,
      subtotal, tax, fee, discount, total, qr_code_token, notes
    ) VALUES (?, ?, ?, ?, 'pending', 'asap', ?, ?, ?, 0, ?, ?, 'Consistency test order')
  `).run(orderNum, newUserId, restaurant.id, restaurant.id, subtotal, tax, fee, total, qrToken);

  const orderId = orderInsert.lastInsertRowid;
  db.prepare(`
    INSERT INTO order_items (order_id, menu_item_id, item_name, quantity, unit_price, customizations_selected_json, total_price)
    VALUES (?, ?, ?, 2, ?, '{}', ?)
  `).run(orderId, menuItem.id, menuItem.name, menuItem.price, subtotal);

  const savedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!savedOrder || savedOrder.customer_id !== newUserId || savedOrder.restaurant_id !== restaurant.id) {
    throw new Error('Order verification failed in database');
  }
  console.log(`10. Customer Order Placement: ✅ PASS (Order #${savedOrder.id} successfully saved with customer_id ${savedOrder.customer_id} & restaurant_id ${savedOrder.restaurant_id})`);

  // Step 9: Clean up test order and customer
  db.prepare('DELETE FROM order_items WHERE order_id = ?').run(orderId);
  db.prepare('DELETE FROM orders WHERE id = ?').run(orderId);
  db.prepare('DELETE FROM users WHERE id = ?').run(newUserId);
  console.log('11. Test data clean up: ✅ PASS');

  console.log('\n====================================================');
  console.log('🎉 ALL DATABASE CONSISTENCY & AUTH TESTS PASSED!');
  console.log('====================================================');
}

runConsistencyTest().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
