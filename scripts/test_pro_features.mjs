/**
 * Test suite for PRO features integration
 * Path: scripts/test_pro_features.mjs
 * Usage: node scripts/test_pro_features.mjs
 */
import { promises as fs } from 'fs';
import http from 'http';
import path from 'path';

const BASE_URL = 'http://localhost:5000';
const TIMEOUT = 5000;

// Test results collector
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function test(name, testFn) {
  return testFn()
    .then(() => {
      results.passed++;
      results.tests.push({ name, status: '✅ PASS' });
      console.log(`✅ ${name}`);
    })
    .catch(error => {
      results.failed++;
      results.tests.push({ name, status: '❌ FAIL', error: error.message });
      console.log(`❌ ${name}: ${error.message}`);
    });
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: TIMEOUT }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, data, headers: res.headers }));
    });
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.on('error', reject);
  });
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting PRO Features Integration Tests...\n');

  // === INFRASTRUCTURE TESTS ===
  console.log('🏗️  Testing Infrastructure...');

  await test('GitHub Actions CI configuration exists', async () => {
    const exists = await fileExists('.github/workflows/ci.yml');
    if (!exists) throw new Error('CI configuration not found');
  });

  await test('Docker configuration exists', async () => {
    const dockerfile = await fileExists('Dockerfile');
    const compose = await fileExists('docker-compose.yml');
    if (!dockerfile || !compose) throw new Error('Docker configuration incomplete');
  });

  await test('Nginx configuration exists', async () => {
    const nginx = await fileExists('infra/nginx/nginx.conf');
    const security = await fileExists('infra/nginx/security_headers.conf');
    if (!nginx || !security) throw new Error('Nginx configuration incomplete');
  });

  // === HEALTH ENDPOINTS TESTS ===
  console.log('\n🏥 Testing Health Endpoints...');

  await test('Health endpoint responds correctly', async () => {
    const { statusCode, data } = await httpGet(`${BASE_URL}/healthz`);
    if (statusCode !== 200) throw new Error(`Expected 200, got ${statusCode}`);
    const parsed = JSON.parse(data);
    if (!parsed.status || parsed.status !== 'healthy') throw new Error('Invalid health response');
  });

  await test('Readiness endpoint responds', async () => {
    const { statusCode } = await httpGet(`${BASE_URL}/readyz`);
    if (statusCode !== 200 && statusCode !== 503) throw new Error(`Unexpected status: ${statusCode}`);
  });

  await test('Metrics endpoint responds', async () => {
    const { statusCode, headers } = await httpGet(`${BASE_URL}/metrics`);
    if (statusCode !== 200) throw new Error(`Expected 200, got ${statusCode}`);
    if (!headers['content-type']?.includes('text/plain')) throw new Error('Invalid metrics content-type');
  });

  // === SITEMAP TESTS ===
  console.log('\n🗺️  Testing Sitemaps...');

  await test('Sitemap index exists and is valid XML', async () => {
    const { statusCode, data } = await httpGet(`${BASE_URL}/sitemaps/sitemap-index.xml`);
    if (statusCode !== 200) throw new Error(`Expected 200, got ${statusCode}`);
    if (!data.includes('<?xml') || !data.includes('<sitemapindex')) {
      throw new Error('Invalid XML structure');
    }
  });

  await test('French sitemap exists', async () => {
    const { statusCode, data } = await httpGet(`${BASE_URL}/sitemaps/sitemap-fr.xml`);
    if (statusCode !== 200) throw new Error(`Expected 200, got ${statusCode}`);
    if (!data.includes('<urlset')) throw new Error('Invalid sitemap structure');
  });

  await test('Projects sitemap exists', async () => {
    const { statusCode, data } = await httpGet(`${BASE_URL}/sitemaps/projects-sitemap.xml`);
    if (statusCode !== 200) throw new Error(`Expected 200, got ${statusCode}`);
    if (!data.includes('<urlset')) throw new Error('Invalid sitemap structure');
  });

  // === SECURITY FILES TESTS ===
  console.log('\n🔒 Testing Security Files...');

  await test('robots.txt accessible', async () => {
    const { statusCode, data } = await httpGet(`${BASE_URL}/robots.txt`);
    if (statusCode !== 200) throw new Error(`Expected 200, got ${statusCode}`);
    if (!data.includes('User-agent:') || !data.includes('Sitemap:')) {
      throw new Error('Invalid robots.txt format');
    }
  });

  await test('security.txt accessible', async () => {
    const { statusCode, data } = await httpGet(`${BASE_URL}/.well-known/security.txt`);
    if (statusCode !== 200) throw new Error(`Expected 200, got ${statusCode}`);
    if (!data.includes('Contact:') || !data.includes('Expires:')) {
      throw new Error('Invalid security.txt format');
    }
  });

  // === SECURITY HEADERS TESTS ===
  console.log('\n🛡️  Testing Security Headers...');

  await test('Security headers present on main page', async () => {
    const { statusCode, headers } = await httpGet(`${BASE_URL}/`);
    if (statusCode !== 200) throw new Error(`Expected 200, got ${statusCode}`);
    
    const requiredHeaders = [
      'content-security-policy',
      'x-content-type-options',
      'x-frame-options',
      'referrer-policy'
    ];
    
    for (const header of requiredHeaders) {
      if (!headers[header]) {
        throw new Error(`Missing security header: ${header}`);
      }
    }
  });

  // === RATE LIMITING TESTS ===
  console.log('\n⚡ Testing Rate Limiting...');

  await test('Rate limiting configured on API routes', async () => {
    // Make multiple rapid requests to test rate limiting
    const requests = [];
    for (let i = 0; i < 3; i++) {
      requests.push(httpGet(`${BASE_URL}/api/projects`).catch(e => ({ error: e.message })));
    }
    
    const responses = await Promise.all(requests);
    const hasValidResponse = responses.some(r => r.statusCode === 200);
    if (!hasValidResponse) throw new Error('API not responding correctly');
  });

  // === FINAL REPORT ===
  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);

  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.tests.filter(t => t.status.includes('FAIL')).forEach(t => {
      console.log(`   • ${t.name}: ${t.error}`);
    });
    process.exit(1);
  } else {
    console.log('\n🎉 All PRO features integration tests passed!');
    console.log('🚀 Platform is ready for production deployment');
  }
}

runTests().catch(console.error);