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
  // TEST 1: Customer registers
  // =========================================================================
  const testEmail = `customer_${Date.now()}@bengaluru-test.com`;
  const testPassword = 'Password@123';
  const registerRes = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Aditi Rao',
      email: testEmail,
      phone: '+91 98765 88990',
      password: testPassword,
      role: 'customer'
    })
  });
  const regData = await registerRes.json();
  if (!registerRes.ok || !regData.token) {
    throw new Error(`TEST 1 Failed: ${JSON.stringify(regData)}`);
  }
  console.log(`TEST 1: Customer registers: ✅ PASS (Created user #${regData.user.id}: ${regData.user.email})`);

  // =========================================================================
  // TEST 2: Customer logs in
  // =========================================================================
  const loginRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword
    })
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok || !loginData.token) {
    throw new Error(`TEST 2 Failed: ${JSON.stringify(loginData)}`);
  }
  const customerToken = loginData.token;
  console.log(`TEST 2: Customer logs in: ✅ PASS (JWT generated for ${loginData.user.name})`);

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

  console.log('\n====================================================');
  console.log('🎉 ALL 12 TESTS PASSED WITH 100% SUCCESS!');
  console.log('====================================================\n');
}

runAllTests().catch((err) => {
  console.error('\n❌ E2E TEST SUITE FAILED:', err);
  process.exit(1);
});
