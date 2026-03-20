const API_BASE = 'http://localhost:3000/api';

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return { data: await response.json(), status: response.status };
}

async function runTests() {
  console.log('Running Integration Tests...\n');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
      failed++;
    }
  }

  async function expect(status, expected) {
    if (status !== expected) {
      throw new Error(`Expected ${expected}, got ${status}`);
    }
  }

  const timestamp = Date.now();
  const testUser = { email: `test_${timestamp}@mlm.com`, password: 'TestPass123!' };
  let token = '';
  let adminToken = '';

  await test('POST /auth/register - Register new user', async () => {
    const result = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(testUser),
    });
    await expect(result.status, 201);
    token = result.data.data.token;
  });

  await test('POST /auth/login - Login valid user', async () => {
    const result = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(testUser),
    });
    await expect(result.status, 200);
  });

  await test('POST /auth/login - Reject wrong password', async () => {
    const result = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testUser.email, password: 'wrong' }),
    });
    await expect(result.status, 401);
  });

  await test('GET /auth/me - Get user with token', async () => {
    const result = await apiRequest('/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    await expect(result.status, 200);
  });

  await test('GET /auth/me - Reject without token', async () => {
    const result = await apiRequest('/auth/me');
    await expect(result.status, 401);
  });

  await test('GET /dashboard - Get dashboard data', async () => {
    const result = await apiRequest('/dashboard', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    await expect(result.status, 200);
    if (!result.data.data.stats) throw new Error('Missing stats');
  });

  await test('GET /users/me - Get user profile', async () => {
    const result = await apiRequest('/users/me', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    await expect(result.status, 200);
  });

  await test('POST /auth/login - Login as admin', async () => {
    const result = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'newadmin@mlm.com', password: 'NewAdmin123!' }),
    });
    await expect(result.status, 200);
    adminToken = result.data.data.token;
  });

  await test('GET /admin/stats - Get admin stats', async () => {
    const result = await apiRequest('/admin/stats', {
      headers: { 'Authorization': `Bearer ${adminToken}` },
    });
    await expect(result.status, 200);
  });

  await test('GET /admin/users - Get users list', async () => {
    const result = await apiRequest('/admin/users', {
      headers: { 'Authorization': `Bearer ${adminToken}` },
    });
    await expect(result.status, 200);
  });

  console.log(`\n${'='.repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
