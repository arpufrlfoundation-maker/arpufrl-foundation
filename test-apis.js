#!/usr/bin/env node

/**
 * API Test Script for Revenue and Target Systems
 * This script tests all the APIs and checks the data flow
 */

const BASE_URL = 'http://localhost:3000'

// API endpoints to test
const endpoints = [
  // Target System APIs
  { name: 'Get Targets', method: 'GET', url: '/api/targets' },
  { name: 'Get Assigned Targets', method: 'GET', url: '/api/targets/assign' },
  { name: 'Get Target Leaderboard', method: 'GET', url: '/api/targets/leaderboard' },
  { name: 'Get Target Dashboard', method: 'GET', url: '/api/targets/dashboard' },
  
  // Revenue System APIs
  { name: 'Get Revenue Dashboard', method: 'GET', url: '/api/revenue/dashboard' },
  { name: 'Get All Commissions', method: 'GET', url: '/api/revenue/commissions' },
  { name: 'Get Pending Commissions', method: 'GET', url: '/api/revenue/commissions?status=PENDING' },
  { name: 'Get Undistributed Donations', method: 'GET', url: '/api/revenue/distribute' },
]

async function testEndpoint(endpoint) {
  try {
    console.log(`\n🧪 Testing: ${endpoint.name}`)
    console.log(`📡 ${endpoint.method} ${endpoint.url}`)
    
    const response = await fetch(`${BASE_URL}${endpoint.url}`, {
      method: endpoint.method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    })
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`)
    
    if (response.status === 302) {
      console.log('🔐 Redirected to authentication (expected for protected routes)')
      return { status: 'AUTH_REQUIRED', redirected: true }
    }
    
    let data
    try {
      data = await response.json()
    } catch (e) {
      const text = await response.text()
      console.log(`📄 Response: ${text.substring(0, 200)}...`)
      return { status: 'ERROR', message: 'Invalid JSON response' }
    }
    
    if (response.ok) {
      console.log('✅ Success!')
      console.log(`📈 Data keys: ${Object.keys(data).join(', ')}`)
      if (data.success !== undefined) console.log(`🎯 Success flag: ${data.success}`)
      if (data.error) console.log(`❌ Error: ${data.error}`)
    } else {
      console.log('❌ Failed')
      console.log(`🚨 Error: ${data.error || 'Unknown error'}`)
    }
    
    return { status: response.ok ? 'SUCCESS' : 'ERROR', data }
    
  } catch (error) {
    console.log(`💥 Network Error: ${error.message}`)
    return { status: 'NETWORK_ERROR', error: error.message }
  }
}

async function testTargetAssignment() {
  console.log('\n🎯 Testing Target Assignment (POST request)')
  
  const testPayload = {
    assignedTo: "507f1f77bcf86cd799439011", // Mock user ID
    targetAmount: 50000,
    startDate: "2025-01-01",
    endDate: "2025-03-31",
    description: "Test Target Assignment",
    level: "state"
  }
  
  try {
    const response = await fetch(`${BASE_URL}/api/targets/assign`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    })
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`)
    
    if (response.status === 302) {
      console.log('🔐 Redirected to authentication (expected)')
      return
    }
    
    const data = await response.json()
    console.log(`📝 Request payload: ${JSON.stringify(testPayload, null, 2)}`)
    console.log(`📄 Response: ${JSON.stringify(data, null, 2)}`)
    
  } catch (error) {
    console.log(`💥 Error: ${error.message}`)
  }
}

async function testCommissionDistribution() {
  console.log('\n💰 Testing Commission Distribution (POST request)')
  
  const testPayload = {
    donationId: "507f1f77bcf86cd799439012" // Mock donation ID
  }
  
  try {
    const response = await fetch(`${BASE_URL}/api/revenue/distribute`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    })
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`)
    
    if (response.status === 302) {
      console.log('🔐 Redirected to authentication (expected)')
      return
    }
    
    const data = await response.json()
    console.log(`📝 Request payload: ${JSON.stringify(testPayload, null, 2)}`)
    console.log(`📄 Response: ${JSON.stringify(data, null, 2)}`)
    
  } catch (error) {
    console.log(`💥 Error: ${error.message}`)
  }
}

async function checkServerHealth() {
  console.log('🏥 Checking Server Health...')
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/check-status`)
    console.log(`📊 Health Check Status: ${response.status} ${response.statusText}`)
    
    if (response.ok) {
      const data = await response.json()
      console.log(`✅ Server is healthy`)
      console.log(`📄 Response: ${JSON.stringify(data, null, 2)}`)
    }
  } catch (error) {
    console.log(`💥 Server may be down: ${error.message}`)
  }
}

async function main() {
  console.log('🚀 Starting API Test Suite')
  console.log(`🌐 Base URL: ${BASE_URL}`)
  console.log('=' .repeat(60))
  
  // Check server health first
  await checkServerHealth()
  
  console.log('\n📋 Testing GET Endpoints...')
  console.log('=' .repeat(60))
  
  // Test all GET endpoints
  const results = []
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint)
    results.push({ ...endpoint, result })
  }
  
  // Test POST endpoints
  console.log('\n📤 Testing POST Endpoints...')
  console.log('=' .repeat(60))
  
  await testTargetAssignment()
  await testCommissionDistribution()
  
  // Summary
  console.log('\n📊 Test Summary')
  console.log('=' .repeat(60))
  
  const summary = {
    total: results.length,
    success: results.filter(r => r.result.status === 'SUCCESS').length,
    authRequired: results.filter(r => r.result.status === 'AUTH_REQUIRED').length,
    errors: results.filter(r => r.result.status === 'ERROR').length,
    networkErrors: results.filter(r => r.result.status === 'NETWORK_ERROR').length
  }
  
  console.log(`✅ Successful: ${summary.success}`)
  console.log(`🔐 Auth Required: ${summary.authRequired}`)
  console.log(`❌ Errors: ${summary.errors}`)
  console.log(`💥 Network Errors: ${summary.networkErrors}`)
  
  if (summary.authRequired > 0) {
    console.log('\n💡 Note: Most endpoints require authentication, which is expected.')
    console.log('   To test with authentication, you need to:')
    console.log('   1. Login through the web interface')
    console.log('   2. Copy the session cookie')
    console.log('   3. Include it in API requests')
  }
  
  console.log('\n🏁 Test completed!')
}

// Run the tests
main().catch(console.error)