#!/usr/bin/env node

const http = require('http');
const https = require('https');
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

async function runAuthenticatedTests() {
  console.log('🔐 Testing with Authentication\n');

  // Step 1: Get CSRF token
  console.log('1. Getting CSRF token...');
  const csrfResult = await testAPI('/api/auth/csrf');
  const csrfData = JSON.parse(csrfResult.body);
  const csrfToken = csrfData.csrfToken;
  console.log(`   CSRF Token: ${csrfToken.substring(0, 20)}...`);

  // Extract initial cookies
  let cookies = '';
  if (csrfResult.headers['set-cookie']) {
    cookies = csrfResult.headers['set-cookie'].map(cookie => cookie.split(';')[0]).join('; ');
    console.log(`   Initial cookies: ${cookies.substring(0, 50)}...`);
  }

  // Step 2: Login as demo admin
  console.log('\n2. Logging in as demo admin...');
  const loginData = {
    csrfToken: csrfToken,
    email: 'admin@arpufrl.demo',
    password: 'DemoAdmin@2025',
    callbackUrl: '/dashboard/admin'
  };

  const loginResult = await testAPI('/api/auth/callback/credentials', 'POST', loginData, cookies);
  console.log(`   Login Status: ${loginResult.status}`);
  
  // Update cookies with login session
  if (loginResult.headers['set-cookie']) {
    const newCookies = loginResult.headers['set-cookie'].map(cookie => cookie.split(';')[0]).join('; ');
    cookies = cookies + '; ' + newCookies;
    console.log(`   Session cookies updated`);
  }

  // Step 3: Test session
  console.log('\n3. Testing session...');
  const sessionResult = await testAPI('/api/auth/session', 'GET', null, cookies);
  console.log(`   Session Status: ${sessionResult.status}`);
  try {
    const sessionData = JSON.parse(sessionResult.body);
    if (sessionData && sessionData.user) {
      console.log(`   ✅ Logged in as: ${sessionData.user.name} (${sessionData.user.email})`);
    } else {
      console.log(`   ❌ Not logged in properly`);
      return;
    }
  } catch (e) {
    console.log(`   ❌ Session parse error: ${e.message}`);
    return;
  }

  // Step 4: Test protected APIs
  console.log('\n4. Testing Protected APIs...\n');

  const protectedTests = [
    { name: 'Targets API', path: '/api/targets' },
    { name: 'Targets Assign API', path: '/api/targets/assign' },
    { name: 'Targets Leaderboard API', path: '/api/targets/leaderboard' },
    { name: 'Revenue Dashboard API', path: '/api/revenue/dashboard' },
    { name: 'Revenue Commissions API', path: '/api/revenue/commissions' },
    { name: 'Revenue Distribute API', path: '/api/revenue/distribute' }
  ];

  for (const test of protectedTests) {
    try {
      console.log(`Testing ${test.name}: ${test.path}`);
      const result = await testAPI(test.path, 'GET', null, cookies);
      console.log(`  Status: ${result.status}`);
      
      if (result.status === 200) {
        try {
          const jsonBody = JSON.parse(result.body);
          if (jsonBody.error) {
            console.log(`  ❌ Error: ${jsonBody.error}`);
          } else if (jsonBody.success !== undefined) {
            console.log(`  ✅ Success: ${jsonBody.success}`);
            if (jsonBody.data || jsonBody.targets || jsonBody.commissions) {
              const dataKeys = Object.keys(jsonBody).filter(k => k !== 'success');
              console.log(`  📄 Data: ${dataKeys.join(', ')}`);
            }
          } else {
            console.log(`  📄 Response: ${Object.keys(jsonBody).join(', ')}`);
          }
        } catch (e) {
          console.log(`  📄 Raw response: ${result.body.substring(0, 100)}...`);
        }
      } else {
        console.log(`  ❌ Non-200 response: ${result.body.substring(0, 100)}...`);
      }
      console.log('');
    } catch (error) {
      console.log(`  ❌ Failed: ${error.message}\n`);
    }
  }
}

runAuthenticatedTests().catch(console.error);