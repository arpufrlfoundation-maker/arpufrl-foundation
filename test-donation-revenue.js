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

async function testDonationAndRevenue() {
  console.log('🧪 Testing Donation & Revenue Integration\n');

  const cookies = await getAuthenticatedSession();
  console.log('✅ Authenticated successfully\n');

  // First, let's get programs
  console.log('📋 Getting Available Programs:');
  const programsResult = await testAPI('/api/programs');
  if (programsResult.status === 200) {
    const programs = JSON.parse(programsResult.body);
    console.log(JSON.stringify(programs, null, 2));
    console.log('');
  }

  // Test creating a donation
  console.log('💳 Creating Test Donation:');
  const donationData = {
    donorName: 'Test Donor Kumar',
    donorEmail: 'test@example.com',
    donorPhone: '+919876543210',
    amount: 5000, // ₹50 in paise
    referralCode: undefined // No referral for now
  };

  const donationResult = await testAPI('/api/donations', 'POST', donationData);
  console.log(`Status: ${donationResult.status}`);
  
  if (donationResult.status === 200) {
    const donation = JSON.parse(donationResult.body);
    console.log('✅ Donation Created:');
    console.log(JSON.stringify(donation, null, 2));
    console.log('');

    // Now let's check if we can distribute revenue for this donation
    if (donation.data && donation.data.donationId) {
      console.log('💸 Testing Revenue Distribution:');
      const distributionData = {
        donationId: donation.data.donationId
      };

      const distributionResult = await testAPI('/api/revenue/distribute', 'POST', distributionData, cookies);
      console.log(`Distribution Status: ${distributionResult.status}`);
      
      if (distributionResult.status === 200) {
        const distribution = JSON.parse(distributionResult.body);
        console.log('✅ Revenue Distribution:');
        console.log(JSON.stringify(distribution, null, 2));
      } else {
        console.log(`❌ Distribution Error: ${distributionResult.body}`);
      }
      console.log('');
    }
  } else {
    console.log(`❌ Donation Error: ${donationResult.body}`);
    console.log('');
  }

  // Check admin donations API  
  console.log('📊 Getting Admin Donations Data:');
  const adminDonationsResult = await testAPI('/api/admin/donations', 'GET', null, cookies);
  console.log(`Status: ${adminDonationsResult.status}`);
  if (adminDonationsResult.status === 200) {
    const adminData = JSON.parse(adminDonationsResult.body);
    console.log('Donations Count:', adminData.donations?.length || 0);
    console.log('Summary:', JSON.stringify(adminData.summary || {}, null, 2));
  } else {
    console.log(`Error: ${adminDonationsResult.body}`);
  }
  console.log('');

  // Check revenue dashboard again
  console.log('📈 Revenue Dashboard After Test:');
  const finalRevenueResult = await testAPI('/api/revenue/dashboard', 'GET', null, cookies);
  if (finalRevenueResult.status === 200) {
    const data = JSON.parse(finalRevenueResult.body);
    console.log(JSON.stringify(data, null, 2));
  }
}

testDonationAndRevenue().catch(console.error);