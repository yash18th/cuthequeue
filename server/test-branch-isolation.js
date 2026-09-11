const http = require('http');

const BASE_URL = 'http://localhost:5001';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(url, reqOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(body);
        } catch {
          parsed = body;
        }
        resolve({ status: res.statusCode, data: parsed, headers: res.headers });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING BRANCH ISOLATION & MULTI-ADMIN TEST SUITE');
  console.log('====================================================\n');

  // Test 1: Check demo users
  console.log('1. Testing GET /api/auth/demo-users...');
  const demoUsersRes = await request('/api/auth/demo-users');
  console.log(`Status: ${demoUsersRes.status}`);
  const allUsers = Array.isArray(demoUsersRes.data) ? demoUsersRes.data : (demoUsersRes.data.branch_admins || []);
  const branchAdmins = allUsers.filter(u => u.role === 'restaurant_admin');
  console.log(`Found ${branchAdmins.length} branch admins.`);
  if (branchAdmins.length < 14) {
    throw new Error(`Expected at least 14 branch admins, got ${branchAdmins.length}`);
  }
  console.log('✅ Demo users test passed.\n');

  // Test 2: Check all branches endpoint
  console.log('2. Testing GET /api/restaurants/branches...');
  const branchesRes = await request('/api/restaurants/branches');
  console.log(`Status: ${branchesRes.status}, Total branches: ${branchesRes.data.total}`);
  if (branchesRes.data.total < 14) {
    throw new Error(`Expected at least 14 branches, got ${branchesRes.data.total}`);
  }
  console.log('✅ Branches endpoint passed.\n');

  // Test 3: Login as Rameshwaram Indiranagar Branch Admin
  console.log('3. Logging in as Indiranagar Admin (campus@demo.com)...');
  const indirLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { email: 'campus@demo.com', password: 'password123' }
  });
  console.log(`Status: ${indirLogin.status}`);
  const indirToken = indirLogin.data.token;
  const indirUser = indirLogin.data.user;
  const indirBranchId = indirUser.branch_id || indirLogin.data.restaurant?.id;
  console.log(`Indiranagar User Branch ID: ${indirBranchId}, Restaurant: ${indirLogin.data.restaurant?.name}, Branch: ${indirLogin.data.restaurant?.branch_name}`);
  if (!indirToken || !indirBranchId) {
    throw new Error('Indiranagar admin login failed to return token or branch ID');
  }
  console.log('✅ Indiranagar admin login passed.\n');

  // Test 4: Login as Rameshwaram JP Nagar Branch Admin
  console.log('4. Logging in as JP Nagar Admin (rameshwaram.jpnagar@demo.com)...');
  const jpLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { email: 'rameshwaram.jpnagar@demo.com', password: 'password123' }
  });
  console.log(`Status: ${jpLogin.status}`);
  const jpToken = jpLogin.data.token;
  const jpUser = jpLogin.data.user;
  const jpBranchId = jpUser.branch_id || jpLogin.data.restaurant?.id;
  console.log(`JP Nagar User Branch ID: ${jpBranchId}, Restaurant: ${jpLogin.data.restaurant?.name}, Branch: ${jpLogin.data.restaurant?.branch_name}`);
  if (!jpToken || !jpBranchId || Number(jpBranchId) === Number(indirBranchId)) {
    throw new Error('JP Nagar admin login failed or returned same branch ID as Indiranagar');
  }
  console.log('✅ JP Nagar admin login passed.\n');

  // Test 5: Customer places an order at Indiranagar branch
  console.log('5. Logging in as Customer (customer@demo.com)...');
  const custLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { email: 'customer@demo.com', password: 'password123' }
  });
  const custToken = custLogin.data.token;

  console.log(`Fetching menu for Indiranagar Branch (${indirBranchId})...`);
  const menuRes = await request(`/api/restaurants/${indirBranchId}`);
  const validItems = menuRes.data.allItems || [];
  if (validItems.length === 0) {
    throw new Error(`No menu items found for Indiranagar branch ${indirBranchId}`);
  }
  const targetItem = validItems[0];
  console.log(`Selected item: "${targetItem.name}" (ID: ${targetItem.id}, ₹${targetItem.price})`);

  console.log(`Customer placing order specifically for Indiranagar Branch (${indirBranchId})...`);
  const orderRes = await request('/api/orders', {
    method: 'POST',
    headers: { Authorization: `Bearer ${custToken}` },
    body: {
      restaurant_id: indirBranchId,
      branch_id: indirBranchId,
      items: [
        {
          menu_item_id: targetItem.id,
          id: targetItem.id,
          name: targetItem.name,
          price: targetItem.price,
          quantity: 2
        }
      ],
      payment_method: 'upi'
    }
  });
  console.log(`Order placement status: ${orderRes.status}`);
  if (orderRes.status !== 201) {
    throw new Error(`Order placement failed: ${JSON.stringify(orderRes.data)}`);
  }
  const placedOrder = orderRes.data.order;
  console.log(`Created Order #${placedOrder.order_number} (ID: ${placedOrder.id}), Branch ID: ${placedOrder.branch_id}`);
  console.log('✅ Order placed successfully.\n');

  // Test 6: Indiranagar Admin fetches orders -> MUST SEE the order
  console.log('6. Indiranagar Admin fetching orders via GET /api/orders...');
  const indirOrdersRes = await request('/api/orders', {
    headers: { Authorization: `Bearer ${indirToken}` }
  });
  const indirOrders = indirOrdersRes.data.orders || indirOrdersRes.data || [];
  const foundInIndir = indirOrders.some(o => o.id === placedOrder.id);
  console.log(`Indiranagar sees order ${placedOrder.id}: ${foundInIndir}`);
  if (!foundInIndir) {
    throw new Error('Indiranagar admin could NOT see the order placed at its branch!');
  }
  console.log('✅ Indiranagar admin sees the order.\n');

  // Test 7: JP Nagar Admin fetches orders -> MUST NOT SEE the order!
  console.log('7. JP Nagar Admin fetching orders via GET /api/orders...');
  const jpOrdersRes = await request('/api/orders', {
    headers: { Authorization: `Bearer ${jpToken}` }
  });
  const jpOrders = jpOrdersRes.data.orders || jpOrdersRes.data || [];
  const foundInJp = jpOrders.some(o => o.id === placedOrder.id);
  console.log(`JP Nagar sees order ${placedOrder.id}: ${foundInJp}`);
  if (foundInJp) {
    throw new Error('CRITICAL BUG: JP Nagar admin saw an order placed at Indiranagar branch!');
  }
  console.log('✅ Branch isolation verified! JP Nagar admin cannot see Indiranagar orders.\n');

  // Test 8: Cross-Branch Unauthorized Modification Attempt
  console.log(`8. JP Nagar Admin attempting to modify Indiranagar order #${placedOrder.id} status...`);
  const unauthorizedRes = await request(`/api/orders/${placedOrder.id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${jpToken}` },
    body: { status: 'preparing' }
  });
  console.log(`Status: ${unauthorizedRes.status}, Message: ${JSON.stringify(unauthorizedRes.data)}`);
  if (unauthorizedRes.status !== 403) {
    throw new Error(`CRITICAL SECURITY FAILURE: Expected 403 Forbidden for cross-branch update, got ${unauthorizedRes.status}`);
  }
  console.log('✅ Security authorization verified! 403 Forbidden returned for cross-branch modification.\n');

  // Test 9: Indiranagar Admin updates own branch order status
  console.log(`9. Indiranagar Admin updating status to "preparing"...`);
  const authUpdateRes = await request(`/api/orders/${placedOrder.id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${indirToken}` },
    body: { status: 'preparing', prep_time_minutes: 15 }
  });
  console.log(`Status: ${authUpdateRes.status}`);
  if (authUpdateRes.status !== 200) {
    throw new Error(`Indiranagar admin status update failed: ${JSON.stringify(authUpdateRes.data)}`);
  }
  console.log('✅ Indiranagar admin successfully updated order status.\n');

  // Test 10: Verify sibling branches on restaurant details
  console.log(`10. Testing GET /api/restaurants/${indirBranchId} for sibling branches...`);
  const restDetailsRes = await request(`/api/restaurants/${indirBranchId}`);
  const siblingBranches = restDetailsRes.data.branches || [];
  console.log(`Indiranagar details returned ${siblingBranches.length} sibling branches.`);
  if (siblingBranches.length < 3) {
    throw new Error(`Expected at least 3 sibling branches for The Rameshwaram Cafe, got ${siblingBranches.length}`);
  }
  console.log('Sibling branch names:', siblingBranches.map(b => b.branch_name).join(', '));
  console.log('✅ Sibling branches returned correctly.\n');

  console.log('====================================================');
  console.log('🎉 ALL 10 BRANCH ISOLATION & MULTI-ADMIN TESTS PASSED!');
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('\n❌ TEST FAILED:', err.message);
  process.exit(1);
});
