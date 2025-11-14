#!/usr/bin/env node

const http = require('http');

// Test function
async function testAPI(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing API Endpoints\n');

  const tests = [
    { name: 'CSRF Token', path: '/api/auth/csrf' },
    { name: 'Auth Session', path: '/api/auth/session' },
    { name: 'Targets API', path: '/api/targets' },
    { name: 'Targets Assign API', path: '/api/targets/assign' },
    { name: 'Targets Leaderboard API', path: '/api/targets/leaderboard' },
    { name: 'Revenue Dashboard API', path: '/api/revenue/dashboard' },
    { name: 'Revenue Commissions API', path: '/api/revenue/commissions' },
    { name: 'Revenue Distribute API', path: '/api/revenue/distribute' }
  ];

  for (const test of tests) {
    try {
      console.log(`Testing ${test.name}: ${test.path}`);
      const result = await testAPI(test.path);
      console.log(`  ✅ Status: ${result.status}`);
      
      // Try to parse JSON response
      try {
        const jsonBody = JSON.parse(result.body);
        if (jsonBody.error) {
          console.log(`  ❌ Error: ${jsonBody.error}`);
        } else if (jsonBody.success) {
          console.log(`  ✅ Success: ${jsonBody.success}`);
        } else {
          console.log(`  ℹ️  Response: ${Object.keys(jsonBody).join(', ')}`);
        }
      } catch (e) {
        console.log(`  ℹ️  Response: ${result.body.substring(0, 100)}...`);
      }
      console.log('');
    } catch (error) {
      console.log(`  ❌ Failed: ${error.message}\n`);
    }
  }
}

runTests().catch(console.error);