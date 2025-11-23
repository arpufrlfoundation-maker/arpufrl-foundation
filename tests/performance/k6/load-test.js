/**
 * Load Test: Donations API
 * Tests system performance under concurrent load
 *
 * Run: k6 run tests/performance/k6/load-test.js
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend, Counter } from 'k6/metrics'

// Custom metrics
const errorRate = new Rate('errors')
const donationTrend = new Trend('donation_duration')
const successfulDonations = new Counter('successful_donations')

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up to 10 users
    { duration: '5m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 100 },  // Spike to 100 users
    { duration: '3m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    errors: ['rate<0.05'],             // Error rate should be below 5%
    http_req_failed: ['rate<0.05'],    // Failed requests below 5%
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

// Test data
const programs = ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012']
const referralCodes = ['TEST123', 'REF456', 'CODE789']

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)]
}

export default function () {
  // Scenario 1: Fetch programs
  const programsRes = http.get(`${BASE_URL}/api/programs?active=true`)
  check(programsRes, {
    'programs loaded': (r) => r.status === 200,
    'programs has data': (r) => {
      const body = JSON.parse(r.body)
      return body.success && body.data && body.data.programs
    },
  }) || errorRate.add(1)

  sleep(1)

  // Scenario 2: Create donation order
  const orderPayload = JSON.stringify({
    amount: randomInt(100, 5000),
    donorName: `Test User ${__VU}`,
    donorEmail: `test${__VU}@example.com`,
    programId: randomElement(programs),
    referralCode: randomElement(referralCodes),
  })

  const orderParams = {
    headers: { 'Content-Type': 'application/json' },
  }

  const startTime = new Date()
  const orderRes = http.post(`${BASE_URL}/api/donations/create-order`, orderPayload, orderParams)
  const duration = new Date() - startTime

  donationTrend.add(duration)

  const orderSuccess = check(orderRes, {
    'order created': (r) => r.status === 200,
    'order has orderId': (r) => {
      const body = JSON.parse(r.body)
      return body.success && body.orderId
    },
    'response time < 500ms': (r) => r.timings.duration < 500,
  })

  if (orderSuccess) {
    successfulDonations.add(1)
  } else {
    errorRate.add(1)
  }

  sleep(2)

  // Scenario 3: Fetch target stats (requires auth - skip in load test)
  // Would need session token management

  // Scenario 4: Fetch team data
  const teamRes = http.get(`${BASE_URL}/api/team?limit=10`)
  check(teamRes, {
    'team loaded': (r) => r.status === 200 || r.status === 401, // 401 ok (not authenticated)
  })

  sleep(1)
}

export function handleSummary(data) {
  return {
    'summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  }
}

function textSummary(data) {
  const { metrics } = data

  return `
╔════════════════════════════════════════════════╗
║         Load Test Summary                      ║
╚════════════════════════════════════════════════╝

Request Metrics:
  ✓ Total Requests:      ${metrics.http_reqs.values.count}
  ✓ Failed Requests:     ${metrics.http_req_failed.values.rate * 100}%
  ✓ Request Duration:
    - Average:           ${metrics.http_req_duration.values.avg.toFixed(2)}ms
    - P95:               ${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
    - P99:               ${metrics.http_req_duration.values['p(99)'].toFixed(2)}ms

Custom Metrics:
  ✓ Successful Donations: ${metrics.successful_donations.values.count}
  ✓ Error Rate:           ${(metrics.errors.values.rate * 100).toFixed(2)}%
  ✓ Donation Avg Time:    ${metrics.donation_duration.values.avg.toFixed(2)}ms

Virtual Users:
  ✓ Max VUs:              ${data.state.maxVUs}
  ✓ Test Duration:        ${(data.state.testRunDurationMs / 1000 / 60).toFixed(2)} minutes

Status: ${
    metrics.http_req_duration.values['p(95)'] < 500 &&
    metrics.errors.values.rate < 0.05
      ? '✅ PASSED'
      : '❌ FAILED'
  }
`
}
