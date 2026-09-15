/**
 * Automated Verification Script: Restaurant Admin Authentication & Branch Routing
 */
const http = require('http');
const { db } = require('./db/database');

const BASE_URL = 'http://localhost:5001';

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

function loginUser(email, password) {
  return request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email, password });
}

async function runTests() {
  console.log('====================================================');
  console.log('RESTAURANT ADMIN AUTHENTICATION & BRANCH ROUTING TEST');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // TEST 1: Rameshwaram Admin Login & Context
  console.log('--- Test Group 1: Rameshwaram Cafe Authentication ---');
  const ramLogin = await loginUser('campus@demo.com', 'password123');
  assert(ramLogin.status === 200, 'Rameshwaram login returns 200');
  assert(ramLogin.data.user.branch_id === 20, `Rameshwaram branch_id is 20 (got ${ramLogin.data.user?.branch_id})`);
  assert(ramLogin.data.user.brand_id === 1, `Rameshwaram brand_id is 1 (got ${ramLogin.data.user?.brand_id})`);
  assert(ramLogin.data.restaurant?.brand_name === 'The Rameshwaram Cafe', `Rameshwaram brand_name is correct`);
  assert(ramLogin.data.restaurant?.branch_name === 'Indiranagar', `Rameshwaram branch_name is Indiranagar`);
  assert(ramLogin.data.restaurant?.branch_slug === 'rameshwaram-indiranagar', `Rameshwaram branch_slug is rameshwaram-indiranagar`);

  // TEST 2: Empire Restaurant Admin Login & Context
  console.log('\n--- Test Group 2: Empire Restaurant Authentication ---');
  const empLogin = await loginUser('spice@demo.com', 'password123');
  assert(empLogin.status === 200, 'Empire login returns 200');
  assert(empLogin.data.user.branch_id === 24, `Empire branch_id is 24 (got ${empLogin.data.user?.branch_id})`);
  assert(empLogin.data.user.brand_id === 2, `Empire brand_id is 2 (got ${empLogin.data.user?.brand_id})`);
  assert(empLogin.data.restaurant?.brand_name === 'Empire Restaurant', `Empire brand_name is correct`);
  assert(empLogin.data.restaurant?.branch_name === 'Church Street', `Empire branch_name is Church Street`);
  assert(empLogin.data.restaurant?.branch_slug === 'empire-church-street', `Empire branch_slug is empire-church-street`);

  // TEST 3: Meghana Foods Admin Login & Context
  console.log('\n--- Test Group 3: Meghana Foods Authentication ---');
  const megLogin = await loginUser('meghana@demo.com', 'password123');
  assert(megLogin.status === 200, 'Meghana login returns 200');
  assert(megLogin.data.user.branch_id === 29, `Meghana branch_id is 29 (got ${megLogin.data.user?.branch_id})`);
  assert(megLogin.data.user.brand_id === 3, `Meghana brand_id is 3 (got ${megLogin.data.user?.brand_id})`);
  assert(megLogin.data.restaurant?.brand_name === 'Meghana Foods', `Meghana brand_name is correct`);
  assert(megLogin.data.restaurant?.branch_name === 'Koramangala', `Meghana branch_name is Koramangala`);
  assert(megLogin.data.restaurant?.branch_slug === 'meghana-koramangala', `Meghana branch_slug is meghana-koramangala`);

  // TEST 4: Super Admin Login
  console.log('\n--- Test Group 4: Super Admin Authentication ---');
  const saLogin = await loginUser('admin@cutthequeue.com', 'admin123');
  assert(saLogin.status === 200, 'Super admin login returns 200');
  assert(saLogin.data.user.role === 'super_admin', 'User role is super_admin');

  // TEST 5: Verify /api/auth/me retains exact branch & brand info
  console.log('\n--- Test Group 5: /api/auth/me Verification ---');
  const empMe = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/auth/me',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${empLogin.data.token}` }
  });
  assert(empMe.status === 200, 'GET /api/auth/me returns 200');
  assert(empMe.data.user.branch_id === 24, 'GET /api/auth/me user.branch_id is 24');
  assert(empMe.data.restaurant?.brand_name === 'Empire Restaurant', 'GET /api/auth/me brand_name is Empire Restaurant');

  // TEST 6: Customer Order Creation mapped to Empire Branch 24
  console.log('\n--- Test Group 6: Customer Order Creation & Scoping ---');
  const custLogin = await loginUser('customer@demo.com', 'password123');
  assert(custLogin.status === 200, 'Customer login returns 200');

  // Find a menu item from Empire Church Street (restaurant_id = 24)
  const menuItem = db.prepare('SELECT * FROM menu_items WHERE restaurant_id = 24 AND is_available = 1 LIMIT 1').get();
  assert(!!menuItem, `Found available menu item for Empire Church Street (Item: ${menuItem?.name}, ID: ${menuItem?.id})`);

  const orderRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/orders',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${custLogin.data.token}`
    }
  }, {
    restaurant_id: 2, // Brand ID
    branch_id: 24,   // Branch ID
    items: [{
      menu_item_id: menuItem.id,
      quantity: 1,
      customizations_selected: {}
    }],
    pickup_type: 'asap',
    payment_method: 'upi'
  });

  assert(orderRes.status === 200 || orderRes.status === 201, `Order creation returns success (status ${orderRes.status})`);
  const createdOrder = orderRes.data.order;
  assert(createdOrder?.branch_id === 24, `Created order branch_id is 24 (got ${createdOrder?.branch_id})`);
  assert(createdOrder?.brand_id === 2, `Created order brand_id is 2 (got ${createdOrder?.brand_id})`);

  // TEST 7: Empire Manager fetches orders for Branch 24 -> MUST include created order
  console.log('\n--- Test Group 7: Branch Admin Order Fetch & Isolation ---');
  const empOrders = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/orders/restaurant/24',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${empLogin.data.token}` }
  });
  assert(empOrders.status === 200, 'Empire manager GET /api/orders/restaurant/24 returns 200');
  const hasOrderInEmpire = Array.isArray(empOrders.data) && empOrders.data.some(o => o.id === createdOrder.id);
  assert(hasOrderInEmpire, `Created order #${createdOrder.order_number} is found in Empire Church Street orders`);

  // TEST 8: Rameshwaram Manager tries to fetch Empire Branch 24 orders -> MUST RETURN 403 FORBIDDEN
  console.log('\n--- Test Group 8: Cross-Branch Authorization Defense ---');
  const ramCrossFetch = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/orders/restaurant/24',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${ramLogin.data.token}` }
  });
  assert(ramCrossFetch.status === 403, `Rameshwaram manager fetching Empire orders is rejected with 403 Forbidden (got ${ramCrossFetch.status})`);

  // TEST 9: Empire Manager tries to fetch Rameshwaram Branch 20 orders -> MUST RETURN 403 FORBIDDEN
  const empCrossFetch = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/orders/restaurant/20',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${empLogin.data.token}` }
  });
  assert(empCrossFetch.status === 403, `Empire manager fetching Rameshwaram orders is rejected with 403 Forbidden (got ${empCrossFetch.status})`);

  // TEST 10: Super Admin can access any branch
  const saFetch = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/orders/restaurant/24',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${saLogin.data.token}` }
  });
  assert(saFetch.status === 200, `Super Admin GET /api/orders/restaurant/24 returns 200`);

  // TEST 11: Branch Slug resolution in public API
  console.log('\n--- Test Group 9: Branch Slug API Resolution ---');
  const branchBySlug = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/restaurants/empire-church-street',
    method: 'GET'
  });
  assert(branchBySlug.status === 200, 'GET /api/restaurants/empire-church-street returns 200');
  assert(branchBySlug.data?.restaurant?.id === 24, `Resolved branch ID is 24 (got ${branchBySlug.data?.restaurant?.id})`);
  assert(branchBySlug.data?.restaurant?.branch_name === 'Church Street', `Resolved branch name is Church Street`);

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
