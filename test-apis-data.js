#!/usr/bin/env node

const http = require('http');
const querystring = require('querystring');

// Test function with cookies
async function testAPI(path, method = 'GET', data = null, cookies = '') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': method === 'POST' && path.includes('auth')
          ? 'application/x-www-form-urlencoded'
          : 'application/json',
        'Cookie': cookies
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
      if (method === 'POST' && path.includes('auth')) {
        req.write(querystring.stringify(data));
      } else {
        req.write(JSON.stringify(data));
      }
    }
    req.end();
  });
}

async function getAuthenticatedSession() {
  // Get CSRF token
  const csrfResult = await testAPI('/api/auth/csrf');
  const csrfData = JSON.parse(csrfResult.body);
  const csrfToken = csrfData.csrfToken;

  // Extract initial cookies
  let cookies = '';
  if (csrfResult.headers['set-cookie']) {
    cookies = csrfResult.headers['set-cookie'].map(cookie => cookie.split(';')[0]).join('; ');
  }

  // Login as demo admin
  const loginData = {
    csrfToken: csrfToken,
    email: 'admin@arpufrl.demo',
    password: 'DemoAdmin@2025',
    callbackUrl: '/dashboard/admin'
  };

  const loginResult = await testAPI('/api/auth/callback/credentials', 'POST', loginData, cookies);

  // Update cookies with login session
  if (loginResult.headers['set-cookie']) {
    const newCookies = loginResult.headers['set-cookie'].map(cookie => cookie.split(';')[0]).join('; ');
    cookies = cookies + '; ' + newCookies;
  }

  return cookies;
}

async function testDataContent() {
  console.log('🔍 Testing API Data Content\n');

  const cookies = await getAuthenticatedSession();
  console.log('✅ Authenticated successfully\n');

  // Test Revenue Dashboard
  console.log('📊 Revenue Dashboard Data:');
  const revenueResult = await testAPI('/api/revenue/dashboard', 'GET', null, cookies);
  if (revenueResult.status === 200) {
    const data = JSON.parse(revenueResult.body);
    console.log(JSON.stringify(data, null, 2));
    console.log('');
  }

  // Test Revenue Commissions
  console.log('💰 Revenue Commissions Data:');
  const commissionsResult = await testAPI('/api/revenue/commissions', 'GET', null, cookies);
  if (commissionsResult.status === 200) {
    const data = JSON.parse(commissionsResult.body);
    console.log(JSON.stringify(data, null, 2));
    console.log('');
  }

  // Test Targets
  console.log('🎯 Targets Data:');
  const targetsResult = await testAPI('/api/targets', 'GET', null, cookies);
  if (targetsResult.status === 200) {
    const data = JSON.parse(targetsResult.body);
    console.log(JSON.stringify(data, null, 2));
    console.log('');
  }

  // Test Leaderboard
  console.log('🏆 Leaderboard Data:');
  const leaderboardResult = await testAPI('/api/targets/leaderboard', 'GET', null, cookies);
  if (leaderboardResult.status === 200) {
    const data = JSON.parse(leaderboardResult.body);
    console.log(JSON.stringify(data, null, 2));
    console.log('');
  }

  // Test POST endpoint - Revenue Distribution
  console.log('💸 Testing Revenue Distribution:');
  const distributionResult = await testAPI('/api/revenue/distribute', 'POST', {}, cookies);
  if (distributionResult.status === 200) {
    const data = JSON.parse(distributionResult.body);
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log(`Status: ${distributionResult.status}, Body: ${distributionResult.body}`);
  }
}

testDataContent().catch(console.error);