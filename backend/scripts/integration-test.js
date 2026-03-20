const { execSync, spawn } = require('child_process');
const http = require('http');

const API_BASE = 'http://localhost:3000/api';
const SERVER_START_TIMEOUT = 30000;
const HEALTH_CHECK_INTERVAL = 500;

let serverProcess = null;

function exec(command, options = {}) {
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe', ...options });
    return { success: true, output };
  } catch (error) {
    return { success: false, error: error.message, stderr: error.stderr?.toString() || '' };
  }
}

function httpRequest(endpoint, method = 'GET', body = null, token = null) {
  return new Promise((resolve) => {
    const path = endpoint.startsWith('/') ? `/api${endpoint}` : `/api/${endpoint}`;
    const options = {
      hostname: 'localhost',
      port: '3000',
      path,
      method,
      headers: { 'Content-Type': 'application/json' },
    };

    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data: null });
        }
      });
    });

    req.on('error', (err) => resolve({ status: 0, error: err.message }));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function waitForServer(maxWaitTime = SERVER_START_TIMEOUT) {
  console.log('⏳ Waiting for server...');
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    try {
      const result = await httpRequest('/auth/me', 'GET');
      if (result.status !== 0) {
        console.log(`✅ Server ready! (${Date.now() - startTime}ms)`);
        return true;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, HEALTH_CHECK_INTERVAL));
  }
  return false;
}

function startServer() {
  console.log('🚀 Starting server...');
  const useTsNode = process.env.NODE_ENV !== 'production';

  serverProcess = spawn(
    useTsNode ? 'npx' : 'node',
    useTsNode ? ['ts-node', 'src/server.ts'] : ['dist/server.js'],
    {
      cwd: __dirname + '/..',
      env: { ...process.env, NODE_ENV: 'development' },
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );

  serverProcess.stdout.on('data', (data) => process.stdout.write(`[SERVER] ${data}`));
  serverProcess.stderr.on('data', (data) => process.stderr.write(`[SERVER] ${data}`));
  serverProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) console.log(`Server exit: ${code}`);
  });

  return serverProcess;
}

function stopServer() {
  if (serverProcess) {
    console.log('\n🛑 Stopping server...');
    serverProcess.kill('SIGTERM');
    setTimeout(() => {
      if (!serverProcess.killed) serverProcess.kill('SIGKILL');
    }, 5000);
  }
}

async function runTests() {
  console.log('\n📝 Running Integration Tests...\n');

  let passed = 0,
    failed = 0;
  const timestamp = Date.now();
  const testUser = { email: `test_${timestamp}@mlm.com`, password: 'TestPass123!' };
  let token = '',
    adminToken = '';
  const expect = (status, expected, msg = '') => {
    if (status !== expected) throw new Error(`${msg}Expected ${expected}, got ${status}`);
  };

  let result;

  result = await (async () => {
    try {
      const res = await httpRequest('/auth/register', 'POST', testUser);
      expect(res.status, 201, 'Register: ');
      if (res.data?.data?.token) token = res.data.data.token;
      else throw new Error('No token');
      return true;
    } catch (e) {
      return e.message;
    }
  })();
  if (result === true) {
    console.log('✅ POST /auth/register');
    passed++;
  } else {
    console.log(`❌ POST /auth/register: ${result}`);
    failed++;
  }

  result = await (async () => {
    try {
      const res = await httpRequest('/auth/login', 'POST', testUser);
      expect(res.status, 200, 'Login: ');
      return true;
    } catch (e) {
      return e.message;
    }
  })();
  if (result === true) {
    console.log('✅ POST /auth/login');
    passed++;
  } else {
    console.log(`❌ POST /auth/login: ${result}`);
    failed++;
  }

  result = await (async () => {
    try {
      const res = await httpRequest('/auth/login', 'POST', {
        email: testUser.email,
        password: 'wrong',
      });
      expect(res.status, 401, 'Wrong pass: ');
      return true;
    } catch (e) {
      return e.message;
    }
  })();
  if (result === true) {
    console.log('✅ POST /auth/login (reject)');
    passed++;
  } else {
    console.log(`❌ POST /auth/login (reject): ${result}`);
    failed++;
  }

  result = await (async () => {
    try {
      const res = await httpRequest('/auth/me', 'GET', null, token);
      expect(res.status, 200, 'Auth me: ');
      return true;
    } catch (e) {
      return e.message;
    }
  })();
  if (result === true) {
    console.log('✅ GET /auth/me');
    passed++;
  } else {
    console.log(`❌ GET /auth/me: ${result}`);
    failed++;
  }

  result = await (async () => {
    try {
      const res = await httpRequest('/auth/me', 'GET');
      expect(res.status, 401, 'No token: ');
      return true;
    } catch (e) {
      return e.message;
    }
  })();
  if (result === true) {
    console.log('✅ GET /auth/me (reject)');
    passed++;
  } else {
    console.log(`❌ GET /auth/me (reject): ${result}`);
    failed++;
  }

  result = await (async () => {
    try {
      const res = await httpRequest('/dashboard', 'GET', null, token);
      expect(res.status, 200, 'Dashboard: ');
      return true;
    } catch (e) {
      return e.message;
    }
  })();
  if (result === true) {
    console.log('✅ GET /dashboard');
    passed++;
  } else {
    console.log(`❌ GET /dashboard: ${result}`);
    failed++;
  }

  result = await (async () => {
    try {
      const res = await httpRequest('/users/me', 'GET', null, token);
      expect(res.status, 200, 'Profile: ');
      return true;
    } catch (e) {
      return e.message;
    }
  })();
  if (result === true) {
    console.log('✅ GET /users/me');
    passed++;
  } else {
    console.log(`❌ GET /users/me: ${result}`);
    failed++;
  }

  result = await (async () => {
    try {
      const res = await httpRequest('/auth/login', 'POST', {
        email: 'admin@mlm.com',
        password: 'admin123',
      });
      expect(res.status, 200, 'Admin login: ');
      if (res.data?.data?.token) adminToken = res.data.data.token;
      else throw new Error('No token');
      return true;
    } catch (e) {
      return e.message;
    }
  })();
  if (result === true) {
    console.log('✅ POST /auth/login (admin)');
    passed++;
  } else {
    console.log(`❌ POST /auth/login (admin): ${result}`);
    failed++;
  }

  result = await (async () => {
    try {
      const res = await httpRequest('/admin/stats', 'GET', null, adminToken);
      expect(res.status, 200, 'Admin stats: ');
      return true;
    } catch (e) {
      return e.message;
    }
  })();
  if (result === true) {
    console.log('✅ GET /admin/stats');
    passed++;
  } else {
    console.log(`❌ GET /admin/stats: ${result}`);
    failed++;
  }

  result = await (async () => {
    try {
      const res = await httpRequest('/admin/users', 'GET', null, adminToken);
      expect(res.status, 200, 'Admin users: ');
      return true;
    } catch (e) {
      return e.message;
    }
  })();
  if (result === true) {
    console.log('✅ GET /admin/users');
    passed++;
  } else {
    console.log(`❌ GET /admin/users: ${result}`);
    failed++;
  }

  return { passed, failed };
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║      MLM Backend - Integration Test Runner      ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  console.log('📦 Checking build...');
  if (!exec('test -d dist').success) {
    console.log('   Building...');
    const r = exec('npm run build', { cwd: __dirname + '/..' });
    if (r.success) console.log('✅ Build complete');
    else console.log('⚠️ Build failed, using ts-node...');
  } else {
    console.log('✅ Build exists');
  }

  startServer();
  if (!(await waitForServer())) {
    console.log('❌ Server failed to start');
    stopServer();
    process.exit(1);
  }

  const { passed, failed } = await runTests();

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50));

  stopServer();
  process.exit(failed > 0 ? 1 : 0);
}

process.on('SIGINT', () => {
  console.log('\n⚠️ Interrupted');
  stopServer();
  process.exit(1);
});

main().catch((err) => {
  console.error('❌ Fatal:', err);
  stopServer();
  process.exit(1);
});
