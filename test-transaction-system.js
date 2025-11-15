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

async function testTransactionSystem() {
  console.log('💰 Testing Transaction & Target System\n');

  const cookies = await getAuthenticatedSession();
  console.log('✅ Authenticated successfully\n');

  // Test creating a transaction (cash collection)
  console.log('📝 Creating Test Transaction:');
  const transactionData = {
    amount: 5000,
    paymentMode: 'cash',
    donorName: 'Test Donor Singh',
    donorContact: '9876543210',
    donorEmail: 'testdonor@example.com',
    purpose: 'Education program donation',
    notes: 'Cash collection from local community',
    collectionDate: new Date().toISOString().split('T')[0]
  };

  const transactionResult = await testAPI('/api/transactions/create', 'POST', transactionData, cookies);
  console.log(`Status: ${transactionResult.status}`);

  if (transactionResult.status === 200) {
    const transaction = JSON.parse(transactionResult.body);
    console.log('✅ Transaction Created:');
    console.log(JSON.stringify(transaction, null, 2));
    console.log('');
  } else {
    console.log(`❌ Transaction Error: ${transactionResult.body}`);
    console.log('');
  }

  // Check targets again to see if anything changed
  console.log('🎯 Checking Targets After Transaction:');
  const targetsResult = await testAPI('/api/targets', 'GET', null, cookies);
  if (targetsResult.status === 200) {
    const data = JSON.parse(targetsResult.body);
    console.log('Target Summary:', JSON.stringify(data.summary, null, 2));
    if (data.targets && data.targets.length > 0) {
      console.log('First Target Progress:');
      console.log(`- Current Value: ${data.targets[0].currentValue}`);
      console.log(`- Collected Amount: ${data.targets[0].collectedAmount}`);
      console.log(`- Progress: ${data.targets[0].progressPercentage}%`);
    }
  }
  console.log('');

  // Test creating a manual donation record to test revenue distribution
  console.log('🧪 Testing Manual Revenue Distribution:');

  // Let's try using the revenue distribution with a fake successful donation ID
  const fakeDistributionData = {
    donationId: '507f1f77bcf86cd799439011' // Fake but valid ObjectId format
  };

  const distributionResult = await testAPI('/api/revenue/distribute', 'POST', fakeDistributionData, cookies);
  console.log(`Distribution Status: ${distributionResult.status}`);
  console.log(`Distribution Response: ${distributionResult.body}`);
  console.log('');

  // Check revenue dashboard
  console.log('📊 Final Revenue Dashboard:');
  const revenueResult = await testAPI('/api/revenue/dashboard', 'GET', null, cookies);
  if (revenueResult.status === 200) {
    const data = JSON.parse(revenueResult.body);
    console.log(JSON.stringify(data, null, 2));
  }
}

testTransactionSystem().catch(console.error);