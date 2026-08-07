import http from 'http';

const endpoints = [
  // Phase 1
  '/admin/kill-switches',
  '/admin/cost-guard/settings',
  '/ai/cost-estimate',
  '/api/audit-logs',
  '/admin/system-health',
  '/admin/operational-alerts',
  // Phase 2
  '/admin/billing/subscriptions',
  '/admin/billing/invoices',
  '/admin/billing/coupons',
  '/admin/payment-providers',
  // Phase 3
  '/admin/ai-wallet/balances',
  '/admin/ai/usage',
  '/admin/providers',
  '/ai/wallet/balance',
  // Phase 4
  '/admin/users',
  '/admin/organizations',
  '/admin/security/events',
  // Phase 5
  '/admin/queues',
  '/admin/workers',
  '/admin/infrastructure',
  // Phase 6 & 7
  '/admin/products',
  '/admin/financial-overview',
];

async function testEndpoint(path: string): Promise<{ path: string; status: number; ok: boolean; sample: string }> {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve({
          path,
          status: res.statusCode || 500,
          ok: (res.statusCode || 500) >= 200 && (res.statusCode || 500) < 300,
          sample: data.substring(0, 100),
        });
      });
    });
    req.on('error', (err) => {
      resolve({ path, status: 0, ok: false, sample: err.message });
    });
  });
}

async function runTests() {
  console.log('--- TESTING ALL OPROX OS CENTRAL CONTROL ROOM ENDPOINTS ---');
  let passed = 0;
  let failed = 0;

  for (const ep of endpoints) {
    const res = await testEndpoint(ep);
    if (res.ok) {
      console.log(`[PASS] ${res.status} ${res.path}`);
      passed++;
    } else {
      console.log(`[FAIL] ${res.status} ${res.path} -> ${res.sample}`);
      failed++;
    }
  }

  console.log(`\nTOTAL PASSED: ${passed}/${endpoints.length}`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
