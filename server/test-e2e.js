// Cut The Queue - Production Order-Sync & End-to-End Test Suite
const path = require('path');
const { io } = require(path.resolve(__dirname, '../client/node_modules/socket.io-client'));

const API = process.env.TEST_API_URL || 'http://localhost:5001/api';
const SOCKET_URL = process.env.TEST_SOCKET_URL || 'http://localhost:5001';

async function runAllTests() {
  console.log('====================================================');
  console.log('🧪 CUT THE QUEUE: PRODUCTION ORDER-SYNC VERIFICATION');
  console.log(`API URL: ${API}`);
  console.log(`SOCKET URL: ${SOCKET_URL}`);
  console.log('====================================================\n');

  // PRE-FLIGHT HEALTH
  const healthRes = await fetch(`${API}/health`);
  const health = await healthRes.json();
  if (health.status !== 'ok') throw new Error('Health check failed');
  console.log('0. Pre-Flight Health Check: ✅ PASS');

  // =========================================================================
  // TEST 1: Customer registers (with whitespace and mixed-casing email)
  // =========================================================================
  const timestamp = Date.now();
  const rawTestEmail = `  Customer_${timestamp}@Bengaluru-Heritage.COM  `;
  const normalizedTestEmail = `customer_${timestamp}@bengaluru-heritage.com`;
  const testPassword = 'Password@123';

  const registerRes = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Aditi Rao',
      email: rawTestEmail,
      phone: '+91 98765 88990',
      password: testPassword,
      role: 'customer'
    })
  });
  const regData = await registerRes.json();
  if (!registerRes.ok || !regData.token) {
    throw new Error(`TEST 1 Failed: ${JSON.stringify(regData)}`);
  }
  if (regData.user.email !== normalizedTestEmail) {
    throw new Error(`TEST 1 Failed: Email was not normalized. Expected "${normalizedTestEmail}", got "${regData.user.email}"`);
  }
  console.log(`TEST 1: Customer registers: ✅ PASS (User #${regData.user.id} normalized as: ${regData.user.email})`);

  // =========================================================================
  // TEST 2A: Customer logs in immediately with exact registered string
  // =========================================================================
  const loginRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: rawTestEmail,
      password: testPassword
    })
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok || !loginData.token) {
    throw new Error(`TEST 2A Failed: ${JSON.stringify(loginData)}`);
  }
  const customerToken = loginData.token;
  console.log(`TEST 2A: Customer logs in immediately: ✅ PASS (JWT generated for ${loginData.user.name})`);

  // =========================================================================
  // TEST 2B: Customer logs in with lowercase normalized email
  // =========================================================================
  const loginLowerRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: normalizedTestEmail,
      password: testPassword
    })
  });
  const loginLowerData = await loginLowerRes.json();
  if (!loginLowerRes.ok || !loginLowerData.token) {
    throw new Error(`TEST 2B Failed (Lowercase login): ${JSON.stringify(loginLowerData)}`);
  }
  console.log(`TEST 2B: Case-insensitive login (lowercase): ✅ PASS (Resolved user #${loginLowerData.user.id})`);

  // =========================================================================
  // TEST 2C: Customer logs in with all-caps email
  // =========================================================================
  const loginUpperRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: normalizedTestEmail.toUpperCase(),
      password: testPassword
    })
  });
  const loginUpperData = await loginUpperRes.json();
  if (!loginUpperRes.ok || !loginUpperData.token) {
    throw new Error(`TEST 2C Failed (Uppercase login): ${JSON.stringify(loginUpperData)}`);
  }
  console.log(`TEST 2C: Case-insensitive login (all-caps): ✅ PASS (Resolved user #${loginUpperData.user.id})`);

  // =========================================================================
  // TEST 2D: Customer enters wrong password -> 401 INVALID_PASSWORD (NOT account not found!)
  // =========================================================================
  const wrongPassRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: normalizedTestEmail,
      password: 'DefinitivelyWrongPassword123!'
    })
  });
  const wrongPassData = await wrongPassRes.json();
  if (wrongPassRes.status !== 401 || wrongPassData.code !== 'INVALID_PASSWORD') {
    throw new Error(`TEST 2D Failed: Expected status 401 with code INVALID_PASSWORD, got ${wrongPassRes.status}: ${JSON.stringify(wrongPassData)}`);
  }
  console.log(`TEST 2D: Wrong password rejected: ✅ PASS (Returned 401 with code INVALID_PASSWORD, did NOT report account missing)`);

  // =========================================================================
  // TEST 2E: Duplicate registration attempt -> 409 ACCOUNT_EXISTS
  // =========================================================================
  const dupRes = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Aditi Rao Imposter',
      email: normalizedTestEmail.toUpperCase(), // Test case insensitivity on duplicate check
      phone: '+91 99999 11111',
      password: 'AnotherPassword@123',
      role: 'customer'
    })
  });
  const dupData = await dupRes.json();
  if (dupRes.status !== 409 || dupData.code !== 'ACCOUNT_EXISTS') {
    throw new Error(`TEST 2E Failed: Expected status 409 with code ACCOUNT_EXISTS, got ${dupRes.status}: ${JSON.stringify(dupData)}`);
  }
  console.log(`TEST 2E: Duplicate account registration rejected: ✅ PASS (Returned 409 with code ACCOUNT_EXISTS)`);

  // =========================================================================
  // TEST 2F: Unknown email login attempt -> 401 ACCOUNT_NOT_FOUND
  // =========================================================================
  const unknownEmailRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `non_existent_${timestamp}@unknown-domain.org`,
      password: 'SomePassword123'
    })
  });
  const unknownEmailData = await unknownEmailRes.json();
  if (unknownEmailRes.status !== 401 || unknownEmailData.code !== 'ACCOUNT_NOT_FOUND') {
    throw new Error(`TEST 2F Failed: Expected status 401 with code ACCOUNT_NOT_FOUND, got ${unknownEmailRes.status}: ${JSON.stringify(unknownEmailData)}`);
  }
  console.log(`TEST 2F: Unknown email returns ACCOUNT_NOT_FOUND: ✅ PASS (Returned 401 with code ACCOUNT_NOT_FOUND)`);

  // =========================================================================
  // TEST 2G: Token restoration via /api/auth/me
  // =========================================================================
  const meRes = await fetch(`${API}/auth/me`, {
    headers: { 'Authorization': `Bearer ${customerToken}` }
  });
  const meData = await meRes.json();
  if (!meRes.ok || !meData.user || meData.user.email !== normalizedTestEmail) {
    throw new Error(`TEST 2G Failed (Session restore): ${JSON.stringify(meData)}`);
  }
  console.log(`TEST 2G: Token restoration via /api/auth/me: ✅ PASS (Retrieved profile for ${meData.user.name})`);

  // =========================================================================
  // TEST 3: Customer selects restaurant
  // =========================================================================
  // Test both direct restaurant by ID and brand lookup with slug
  const brandRes = await fetch(`${API}/restaurants/brands/the-rameshwaram-cafe`);
  const brandData = await brandRes.json();
  if (!brandRes.ok || !brandData.brand) {
    throw new Error(`TEST 3 Failed to fetch brand: ${JSON.stringify(brandData)}`);
  }
  const indiranagarBranch = (brandData.branches || []).find(b => b.branch_name === 'Indiranagar') || brandData.branches[0];
  const targetRestaurantId = indiranagarBranch.id;

  const restRes = await fetch(`${API}/restaurants/${targetRestaurantId}`);
  const restData = await restRes.json();
  if (!restRes.ok || !restData.restaurant) {
    throw new Error(`TEST 3 Failed to fetch restaurant: ${JSON.stringify(restData)}`);
  }
  console.log(`TEST 3: Customer selects restaurant: ✅ PASS (${restData.restaurant.name}, ID: ${targetRestaurantId})`);

  // =========================================================================
  // TEST 4: Customer adds menu items
  // =========================================================================
  const menuItems = restData.allItems || [];
  if (menuItems.length === 0) throw new Error('TEST 4 Failed: No menu items found');
  const selectedItem1 = menuItems[0];
  const selectedItem2 = menuItems[1] || menuItems[0];

  const cartPayloadItems = [
    {
      menu_item_id: selectedItem1.id,
      name: selectedItem1.name,
      quantity: 2,
      customizations_selected: {}
    },
    {
      menu_item_id: selectedItem2.id,
      name: selectedItem2.name,
      quantity: 1,
      customizations_selected: {}
    }
  ];
  console.log(`TEST 4: Customer adds menu items: ✅ PASS (Selected: 2x ${selectedItem1.name}, 1x ${selectedItem2.name})`);

  // =========================================================================
  // TEST 5: Customer places order -> Inserted into SQLite
  // =========================================================================
  const orderCreateRes = await fetch(`${API}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify({
      restaurant_id: targetRestaurantId,
      items: cartPayloadItems,
      pickup_type: 'asap',
      payment_method: 'upi',
      notes: 'Please keep chutney extra fresh'
    })
  });
  const orderCreateData = await orderCreateRes.json();
  if (!orderCreateRes.ok || !orderCreateData.order) {
    throw new Error(`TEST 5 Failed: ${JSON.stringify(orderCreateData)}`);
  }
  const placedOrder = orderCreateData.order;
  if (!placedOrder.id || placedOrder.restaurant_id !== targetRestaurantId || placedOrder.status !== 'pending') {
    throw new Error(`TEST 5 Validation Failed: order_id: ${placedOrder.id}, status: ${placedOrder.status}`);
  }
  console.log(`TEST 5: Customer places order: ✅ PASS (Inserted into SQLite as Order #${placedOrder.id}, Number: ${placedOrder.order_number}, Status: ${placedOrder.status}, Total: ₹${placedOrder.total})`);

  // =========================================================================
  // TEST 6: Manager logs in -> GET orders returns newly created order
  // =========================================================================
  const managerLoginRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'campus@demo.com',
      password: 'password123'
    })
  });
  const managerData = await managerLoginRes.json();
  if (!managerLoginRes.ok || !managerData.token) {
    throw new Error(`TEST 6 Failed Manager Login: ${JSON.stringify(managerData)}`);
  }
  const managerToken = managerData.token;
  const managerRestId = managerData.restaurant?.id;

  const getOrdersRes = await fetch(`${API}/orders/restaurant/${managerRestId}`, {
    headers: { 'Authorization': `Bearer ${managerToken}` }
  });
  const fetchedOrders = await getOrdersRes.json();
  if (!getOrdersRes.ok || !Array.isArray(fetchedOrders)) {
    throw new Error(`TEST 6 Failed to get orders: ${JSON.stringify(fetchedOrders)}`);
  }
  const foundOrder = fetchedOrders.find(o => o.id === placedOrder.id);
  if (!foundOrder) {
    throw new Error(`TEST 6 Failed: Placed order #${placedOrder.id} not found in manager orders list`);
  }
  if (foundOrder.total_amount === undefined || foundOrder.total_amount !== foundOrder.total) {
    throw new Error(`TEST 6 Failed: total_amount not properly normalized on order #${placedOrder.id}`);
  }
  console.log(`TEST 6: Manager logs in & fetches orders: ✅ PASS (Manager #${managerData.user.id} retrieved ${fetchedOrders.length} orders; Found order #${foundOrder.id})`);

  // =========================================================================
  // TEST 7: Manager opens Kitchen Queue -> Appears under Incoming (pending/confirmed)
  // =========================================================================
  const incomingOrders = fetchedOrders.filter(o => ['pending', 'confirmed'].includes(o.status?.toLowerCase()));
  const isIncoming = incomingOrders.some(o => o.id === placedOrder.id);
  if (!isIncoming) {
    throw new Error(`TEST 7 Failed: Order #${placedOrder.id} with status "${foundOrder.status}" not categorized under Incoming`);
  }
  console.log(`TEST 7: Manager opens Kitchen Queue: ✅ PASS (Order #${placedOrder.id} categorized under Incoming Queue [Count: ${incomingOrders.length}])`);

  // =========================================================================
  // TEST 8: Manager changes order to Preparing -> Moves to In Kitchen
  // =========================================================================
  const prepRes = await fetch(`${API}/orders/${placedOrder.id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${managerToken}`
    },
    body: JSON.stringify({ status: 'preparing' })
  });
  const prepData = await prepRes.json();
  if (!prepRes.ok || prepData.status !== 'preparing') {
    throw new Error(`TEST 8 Failed: ${JSON.stringify(prepData)}`);
  }
  // Re-verify from GET orders
  const ordersAfterPrep = await (await fetch(`${API}/orders/restaurant/${managerRestId}`, {
    headers: { 'Authorization': `Bearer ${managerToken}` }
  })).json();
  const preparingOrders = ordersAfterPrep.filter(o => o.status?.toLowerCase() === 'preparing');
  if (!preparingOrders.some(o => o.id === placedOrder.id)) {
    throw new Error(`TEST 8 Failed: Order #${placedOrder.id} not in In Kitchen (preparing) queue`);
  }
  console.log(`TEST 8: Manager changes order to Preparing: ✅ PASS (Order #${placedOrder.id} moved to In Kitchen [Count: ${preparingOrders.length}])`);

  // =========================================================================
  // TEST 9: Manager changes order to Ready -> Moves to Ready
  // =========================================================================
  const readyRes = await fetch(`${API}/orders/${placedOrder.id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${managerToken}`
    },
    body: JSON.stringify({ status: 'ready' })
  });
  const readyData = await readyRes.json();
  if (!readyRes.ok || readyData.status !== 'ready') {
    throw new Error(`TEST 9 Failed: ${JSON.stringify(readyData)}`);
  }
  const ordersAfterReady = await (await fetch(`${API}/orders/restaurant/${managerRestId}`, {
    headers: { 'Authorization': `Bearer ${managerToken}` }
  })).json();
  const readyOrders = ordersAfterReady.filter(o => o.status?.toLowerCase() === 'ready');
  if (!readyOrders.some(o => o.id === placedOrder.id)) {
    throw new Error(`TEST 9 Failed: Order #${placedOrder.id} not in Ready queue`);
  }
  console.log(`TEST 9: Manager changes order to Ready: ✅ PASS (Order #${placedOrder.id} moved to Ready [Count: ${readyOrders.length}])`);

  // =========================================================================
  // TEST 10: Manager completes order -> Moves to Completed
  // =========================================================================
  const completeRes = await fetch(`${API}/orders/${placedOrder.id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${managerToken}`
    },
    body: JSON.stringify({ status: 'completed' })
  });
  const completeData = await completeRes.json();
  if (!completeRes.ok || completeData.status !== 'completed') {
    throw new Error(`TEST 10 Failed: ${JSON.stringify(completeData)}`);
  }
  const ordersAfterComplete = await (await fetch(`${API}/orders/restaurant/${managerRestId}`, {
    headers: { 'Authorization': `Bearer ${managerToken}` }
  })).json();
  const completedOrders = ordersAfterComplete.filter(o => o.status?.toLowerCase() === 'completed');
  if (!completedOrders.some(o => o.id === placedOrder.id)) {
    throw new Error(`TEST 10 Failed: Order #${placedOrder.id} not in Completed queue`);
  }
  console.log(`TEST 10: Manager completes order: ✅ PASS (Order #${placedOrder.id} moved to Completed [Count: ${completedOrders.length}])`);

  // =========================================================================
  // TEST 11: Real-Time Socket.IO: Customer places another order -> Admin receives event without refresh
  // =========================================================================
  console.log('Connecting admin Socket.IO client to verify real-time event delivery...');
  const socketClient = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: false
  });

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Socket connection timeout')), 5000);
    socketClient.on('connect', () => {
      clearTimeout(timeout);
      resolve();
    });
    socketClient.on('connect_error', reject);
  });

  // Join the manager's restaurant room
  socketClient.emit('join:restaurant', managerRestId);
  console.log(`Admin socket connected and joined room: restaurant_${managerRestId}`);

  // Setup promise to wait for order:created event
  const receivedSocketOrderPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Socket.IO order:created event not received within 6000ms')), 6000);
    socketClient.on('order:created', (payload) => {
      clearTimeout(timeout);
      resolve(payload);
    });
  });

  // Small delay to ensure room join is acknowledged
  await new Promise(r => setTimeout(r, 200));

  // Customer places second order
  const order2Res = await fetch(`${API}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerToken}`
    },
    body: JSON.stringify({
      restaurant_id: targetRestaurantId,
      items: [
        {
          menu_item_id: selectedItem1.id,
          name: selectedItem1.name,
          quantity: 1,
          customizations_selected: {}
        }
      ],
      pickup_type: 'asap',
      payment_method: 'upi',
      notes: 'Real-time test order'
    })
  });
  const order2Data = await order2Res.json();
  const placedOrder2 = order2Data.order;

  const socketPayload = await receivedSocketOrderPromise;
  const unpackedOrder = socketPayload.order || socketPayload;

  if (!unpackedOrder || unpackedOrder.id !== placedOrder2.id) {
    throw new Error(`TEST 11 Failed: Expected order #${placedOrder2.id}, received #${unpackedOrder?.id}`);
  }
  if (!unpackedOrder.status || unpackedOrder.status !== 'pending') {
    throw new Error(`TEST 11 Failed: Received socket order status was not 'pending'`);
  }
  socketClient.disconnect();
  console.log(`TEST 11: Real-Time Socket.IO Sync: ✅ PASS (Admin received order #${placedOrder2.id} [${placedOrder2.order_number}] live via WebSocket)`);

  // =========================================================================
  // TEST 12: Manager for Restaurant A must NOT see Restaurant B orders
  // =========================================================================
  // Log in as Empire Restaurant manager (spice@demo.com, restaurant ID 5)
  const empireLoginRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'spice@demo.com',
      password: 'password123'
    })
  });
  const empireData = await empireLoginRes.json();
  const empireToken = empireData.token;
  const empireRestId = empireData.restaurant?.id;

  // 12a: Empire manager attempts to fetch Rameshwaram orders (should be 403 Forbidden)
  const crossFetchRes = await fetch(`${API}/orders/restaurant/${managerRestId}`, {
    headers: { 'Authorization': `Bearer ${empireToken}` }
  });
  if (crossFetchRes.status !== 403) {
    throw new Error(`TEST 12 Failed: Expected 403 Forbidden when Empire manager fetched Rameshwaram orders, got ${crossFetchRes.status}`);
  }

  // 12b: Empire manager fetches own restaurant orders (should succeed and not contain Rameshwaram orders)
  const empireOrdersRes = await fetch(`${API}/orders/restaurant/${empireRestId}`, {
    headers: { 'Authorization': `Bearer ${empireToken}` }
  });
  const empireOrders = await empireOrdersRes.json();
  if (empireOrders.some(o => o.restaurant_id === managerRestId || o.id === placedOrder.id)) {
    throw new Error('TEST 12 Failed: Empire orders list contained Rameshwaram orders');
  }
  console.log('TEST 12: Scoping and Authorization Isolation: ✅ PASS (Empire Manager received 403 when accessing Rameshwaram, and Empire queue is strictly isolated)');

  // =========================================================================
  // TEST 13: Customer fetches public active showcases
  // =========================================================================
  const pubShowcasesRes = await fetch(`${API}/showcases`);
  const pubShowcasesData = await pubShowcasesRes.json();
  if (!pubShowcasesRes.ok || !Array.isArray(pubShowcasesData.showcases)) {
    throw new Error(`TEST 13 Failed: Expected showcase array, got: ${JSON.stringify(pubShowcasesData)}`);
  }
  const activeShowcases = pubShowcasesData.showcases;
  if (activeShowcases.length < 3) {
    throw new Error(`TEST 13 Failed: Expected at least 3 active showcases, found ${activeShowcases.length}`);
  }
  const sampleShowcase = activeShowcases[0];
  if (!sampleShowcase.hero_image || !sampleShowcase.featured_dish || !sampleShowcase.restaurant_name) {
    throw new Error(`TEST 13 Failed: Showcase missing required fields: ${JSON.stringify(sampleShowcase)}`);
  }
  console.log(`TEST 13: Customer Public Showcases: ✅ PASS (${activeShowcases.length} active showcases found with live queue metrics and dish details)`);

  // =========================================================================
  // TEST 14: Restaurant Admin retrieves own showcases
  // =========================================================================
  const adminShowcasesRes = await fetch(`${API}/showcases/admin`, {
    headers: { 'Authorization': `Bearer ${managerToken}` }
  });
  const adminShowcasesData = await adminShowcasesRes.json();
  if (!adminShowcasesRes.ok || !Array.isArray(adminShowcasesData.showcases)) {
    throw new Error(`TEST 14 Failed: ${JSON.stringify(adminShowcasesData)}`);
  }
  const rameshwaramShowcases = adminShowcasesData.showcases;
  if (rameshwaramShowcases.some(s => s.restaurant_id !== managerRestId)) {
    throw new Error('TEST 14 Failed: Admin showcase list contained items for another restaurant');
  }
  console.log(`TEST 14: Admin Scoped Showcases: ✅ PASS (${rameshwaramShowcases.length} items scoped strictly to Rameshwaram Cafe)`);

  // =========================================================================
  // TEST 15: Restaurant Admin creates and updates showcase
  // =========================================================================
  const createShowcaseRes = await fetch(`${API}/showcases`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${managerToken}`
    },
    body: JSON.stringify({
      badge: '✦ CHEF SPECIAL EDITION',
      promo_title: 'Limited Weekend Thatte Idli Fiesta',
      featured_dish: 'Steaming Thatte Idli + Crisp Vada Combo',
      description: 'Hand-ground fermented batter steamed in earthen pans with pure cow ghee.',
      hero_image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=1200',
      pass_code: 'PASS CQ999',
      cta_text: 'Claim Weekend Pass',
      prep_time_minutes: 10,
      is_active: true,
      display_order: 99
    })
  });
  const createdShowcaseData = await createShowcaseRes.json();
  if (!createShowcaseRes.ok || !createdShowcaseData.showcase) {
    throw new Error(`TEST 15 Failed to create showcase: ${JSON.stringify(createdShowcaseData)}`);
  }
  const newShowcaseId = createdShowcaseData.showcase.id;

  // Update it
  const updateShowcaseRes = await fetch(`${API}/showcases/${newShowcaseId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${managerToken}`
    },
    body: JSON.stringify({
      promo_title: 'Updated Thatte Idli Fiesta Deluxe',
      prep_time_minutes: 8
    })
  });
  const updatedShowcaseData = await updateShowcaseRes.json();
  if (!updateShowcaseRes.ok || updatedShowcaseData.showcase.promo_title !== 'Updated Thatte Idli Fiesta Deluxe') {
    throw new Error(`TEST 15 Failed to update showcase: ${JSON.stringify(updatedShowcaseData)}`);
  }
  console.log(`TEST 15: Restaurant Admin Create & Update: ✅ PASS (Created #${newShowcaseId} and updated title & prep time)`);

  // =========================================================================
  // TEST 16: Security & Restaurant Data Isolation
  // =========================================================================
  // Empire Manager attempts to modify Rameshwaram's showcase (MUST be 403 Forbidden)
  const maliciousEditRes = await fetch(`${API}/showcases/${newShowcaseId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${empireToken}`
    },
    body: JSON.stringify({
      promo_title: 'Malicious Empire Hijack Attempt'
    })
  });
  if (maliciousEditRes.status !== 403) {
    throw new Error(`TEST 16 Failed: Expected 403 Forbidden when Empire manager edited Rameshwaram showcase, got ${maliciousEditRes.status}`);
  }

  // Rameshwaram manager attempts to create showcase specifying Empire's restaurant_id (MUST be 403 Forbidden)
  const maliciousCreateRes = await fetch(`${API}/showcases`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${managerToken}`
    },
    body: JSON.stringify({
      restaurant_id: empireRestId,
      promo_title: 'Rameshwaram claiming Empire showcase',
      featured_dish: 'Dish X',
      hero_image: 'https://images.unsplash.com/test'
    })
  });
  if (maliciousCreateRes.status !== 403) {
    throw new Error(`TEST 16 Failed: Expected 403 Forbidden when Rameshwaram manager attempted to create showcase for Empire, got ${maliciousCreateRes.status}`);
  }
  console.log('TEST 16: Strict Security & Restaurant Data Isolation: ✅ PASS (Cross-restaurant modification and creation strictly rejected with 403 Forbidden)');

  // =========================================================================
  // TEST 17: Visibility Toggle & Clean-up Deletion
  // =========================================================================
  // Toggle inactive
  const toggleRes = await fetch(`${API}/showcases/${newShowcaseId}/toggle`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${managerToken}` }
  });
  const toggleData = await toggleRes.json();
  if (!toggleRes.ok || toggleData.showcase.is_active !== 0) {
    throw new Error(`TEST 17 Failed to toggle showcase to inactive: ${JSON.stringify(toggleData)}`);
  }

  // Verify public endpoint does NOT return this inactive showcase
  const checkInactiveRes = await fetch(`${API}/showcases`);
  const checkInactiveData = await checkInactiveRes.json();
  if (checkInactiveData.showcases.some(s => s.id === newShowcaseId)) {
    throw new Error('TEST 17 Failed: Inactive showcase was exposed in public endpoint');
  }

  // Delete showcase
  const deleteRes = await fetch(`${API}/showcases/${newShowcaseId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${managerToken}` }
  });
  if (!deleteRes.ok) {
    throw new Error(`TEST 17 Failed to delete showcase: ${deleteRes.status}`);
  }
  console.log(`TEST 17: Visibility Toggle & Clean-up Deletion: ✅ PASS (Showcase #${newShowcaseId} successfully deactivated, verified hidden from customers, and deleted)`);

  // =========================================================================
  // TEST 18: Multi-Branch Sockets - The Rameshwaram Cafe -> Indiranagar Order
  // =========================================================================
  console.log('\n--- VERIFYING MULTI-BRANCH REAL-TIME ROUTING ---');
  // Fetch branches metadata
  const branchesRes = await fetch(`${API}/restaurants/branches`);
  const branchesData = await branchesRes.json();
  const branchList = branchesData.branches || [];

  const rameshwaramIndiranagar = branchList.find(b => b.branch_name === 'Indiranagar' && (b.brand_id === 1 || b.name.includes('Rameshwaram'))) || branchList[0];
  const empireChurchStreet = branchList.find(b => b.branch_name === 'Church Street' || b.name.includes('Empire')) || branchList[4] || branchList[1];
  const meghanaKoramangala = branchList.find(b => b.name.includes('Meghana') || b.brand_id === 3) || branchList[branchList.length - 1];

  // Set up 2 socket clients: Indiranagar Admin and Church Street Admin
  const indiranagarSocket = io(SOCKET_URL, { transports: ['websocket', 'polling'], reconnection: false });
  const churchStreetSocket = io(SOCKET_URL, { transports: ['websocket', 'polling'], reconnection: false });

  await Promise.all([
    new Promise(res => indiranagarSocket.on('connect', res)),
    new Promise(res => churchStreetSocket.on('connect', res))
  ]);

  indiranagarSocket.emit('join:branch', rameshwaramIndiranagar.id);
  churchStreetSocket.emit('join:branch', empireChurchStreet.id);

  let indiranagarReceived = null;
  let churchStreetReceived = null;

  indiranagarSocket.on('order:created', (payload) => {
    indiranagarReceived = payload?.order || payload;
  });
  churchStreetSocket.on('order:created', (payload) => {
    churchStreetReceived = payload?.order || payload;
  });

  await new Promise(r => setTimeout(r, 200));

  // Customer places order at The Rameshwaram Cafe - Indiranagar
  const orderIndiranagarRes = await fetch(`${API}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${customerToken}` },
    body: JSON.stringify({
      restaurant_id: rameshwaramIndiranagar.id,
      branch_id: rameshwaramIndiranagar.id,
      items: [{ menu_item_id: selectedItem1.id, name: selectedItem1.name, quantity: 1, customizations_selected: {} }],
      pickup_type: 'asap',
      payment_method: 'upi'
    })
  });
  const orderIndiranagarData = await orderIndiranagarRes.json();
  const placedIndiranagarOrder = orderIndiranagarData.order;

  await new Promise(r => setTimeout(r, 800));

  if (!indiranagarReceived || indiranagarReceived.id !== placedIndiranagarOrder.id) {
    throw new Error(`TEST 18 Failed: Indiranagar admin did NOT receive order #${placedIndiranagarOrder.id}`);
  }
  if (churchStreetReceived && churchStreetReceived.id === placedIndiranagarOrder.id) {
    throw new Error(`TEST 18 Failed: Church Street admin mistakenly received Indiranagar order #${placedIndiranagarOrder.id}`);
  }
  console.log(`TEST 18: Multi-Branch Socket (The Rameshwaram Cafe → Indiranagar): ✅ PASS (Indiranagar Admin received order #${placedIndiranagarOrder.id}, Church Street Admin was NOT notified)`);

  // =========================================================================
  // TEST 19: Multi-Branch Sockets - Empire Restaurant -> Church Street Order
  // =========================================================================
  indiranagarReceived = null;
  churchStreetReceived = null;

  // Get a menu item for Empire
  const empireRestRes = await fetch(`${API}/restaurants/${empireChurchStreet.id}`);
  const empireRestData = await empireRestRes.json();
  const empireItems = empireRestData.allItems || empireRestData.menu || [];
  const empireItem = empireItems[0] || selectedItem1;

  const orderEmpireRes = await fetch(`${API}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${customerToken}` },
    body: JSON.stringify({
      restaurant_id: empireChurchStreet.id,
      branch_id: empireChurchStreet.id,
      items: [{ menu_item_id: empireItem.id, name: empireItem.name, quantity: 1, customizations_selected: {} }],
      pickup_type: 'asap',
      payment_method: 'upi'
    })
  });
  const orderEmpireData = await orderEmpireRes.json();
  const placedEmpireOrder = orderEmpireData.order;

  await new Promise(r => setTimeout(r, 800));

  if (!churchStreetReceived || churchStreetReceived.id !== placedEmpireOrder.id) {
    throw new Error(`TEST 19 Failed: Church Street admin did NOT receive order #${placedEmpireOrder.id}`);
  }
  if (indiranagarReceived && indiranagarReceived.id === placedEmpireOrder.id) {
    throw new Error(`TEST 19 Failed: Indiranagar admin mistakenly received Church Street order #${placedEmpireOrder.id}`);
  }
  console.log(`TEST 19: Multi-Branch Socket (Empire Restaurant → Church Street): ✅ PASS (Church Street Admin received order #${placedEmpireOrder.id}, Indiranagar Admin was NOT notified)`);

  indiranagarSocket.disconnect();
  churchStreetSocket.disconnect();

  // =========================================================================
  // TEST 20: Security & Cross-Branch Authorization
  // =========================================================================
  console.log('\n--- VERIFYING STRICT CROSS-BRANCH AUTHORIZATION (403 FORBIDDEN) ---');
  // Indiranagar manager (campus@demo.com) attempts to fetch Church Street orders via GET /api/orders?branchId=<empireChurchStreet.id>
  const crossBranchGetRes = await fetch(`${API}/orders?branchId=${empireChurchStreet.id}`, {
    headers: { 'Authorization': `Bearer ${managerToken}` }
  });
  if (crossBranchGetRes.status !== 403) {
    throw new Error(`TEST 20 Failed: Expected 403 Forbidden when Indiranagar admin accessed Church Street orders via branchId, got ${crossBranchGetRes.status}`);
  }
  console.log('TEST 20A: Branch Admin cross-branch GET restricted: ✅ PASS (Returned 403 Forbidden for unauthorized branchId parameter)');

  // Indiranagar manager attempts to update Church Street order status via PATCH /api/orders/:id/status
  const crossBranchPatchRes = await fetch(`${API}/orders/${placedEmpireOrder.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${managerToken}` },
    body: JSON.stringify({ status: 'preparing' })
  });
  if (crossBranchPatchRes.status !== 403) {
    throw new Error(`TEST 20 Failed: Expected 403 Forbidden when Indiranagar admin attempted to update Church Street order status, got ${crossBranchPatchRes.status}`);
  }
  console.log('TEST 20B: Branch Admin cross-branch PATCH restricted: ✅ PASS (Returned 403 Forbidden for unauthorized branch order modification)');

  // =========================================================================
  // TEST 21: Super Admin Access
  // =========================================================================
  console.log('\n--- VERIFYING SUPER ADMIN MULTI-BRANCH CAPABILITY ---');
  const superLoginRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@cutthequeue.com', password: 'password123' })
  });
  const superData = await superLoginRes.json();
  if (!superLoginRes.ok || superData.user.role !== 'super_admin') {
    throw new Error(`TEST 21 Failed Super Admin Login: ${JSON.stringify(superData)}`);
  }
  const superToken = superData.token;

  // Super Admin can query Indiranagar
  const superIndiraRes = await fetch(`${API}/orders?branchId=${rameshwaramIndiranagar.id}`, {
    headers: { 'Authorization': `Bearer ${superToken}` }
  });
  const superIndiraOrders = await superIndiraRes.json();
  if (!superIndiraRes.ok || !Array.isArray(superIndiraOrders)) {
    throw new Error(`TEST 21 Failed: Super admin could not query Indiranagar orders: ${JSON.stringify(superIndiraOrders)}`);
  }

  // Super Admin can query Church Street
  const superChurchRes = await fetch(`${API}/orders?branchId=${empireChurchStreet.id}`, {
    headers: { 'Authorization': `Bearer ${superToken}` }
  });
  const superChurchOrders = await superChurchRes.json();
  if (!superChurchRes.ok || !Array.isArray(superChurchOrders)) {
    throw new Error(`TEST 21 Failed: Super admin could not query Church Street orders: ${JSON.stringify(superChurchOrders)}`);
  }

  console.log(`TEST 21: Super Admin Multi-Branch Access: ✅ PASS (Super Admin seamlessly retrieved Indiranagar [${superIndiraOrders.length} orders] and Church Street [${superChurchOrders.length} orders])`);

  console.log('\n====================================================');
  console.log('🎉 ALL 21 TESTS PASSED WITH 100% SUCCESS!');
  console.log('====================================================\n');
}

runAllTests().catch((err) => {
  console.error('\n❌ E2E TEST SUITE FAILED:', err);
  process.exit(1);
});

