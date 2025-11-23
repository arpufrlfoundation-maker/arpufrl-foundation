/**
 * Stress Test: Find Breaking Point
 * Gradually increases load until system degrades
 *
 * Run: k6 run tests/performance/k6/stress-test.js
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'

const errorRate = new Rate('errors')

export const options = {
  stages: [
    { duration: '2m', target: 50 },    // Warm up
    { duration: '5m', target: 100 },   // Normal load
    { duration: '5m', target: 200 },   // Increase
    { duration: '5m', target: 300 },   // High load
    { duration: '5m', target: 400 },   // Very high
    { duration: '5m', target: 500 },   // Extreme
    { duration: '3m', target: 0 },     // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // More lenient for stress test
    errors: ['rate<0.10'],              // Accept up to 10% errors
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

export default function () {
  // Mixed scenario
  const scenarios = [
    () => http.get(`${BASE_URL}/api/programs?active=true`),
    () => http.get(`${BASE_URL}/`),
    () => http.get(`${BASE_URL}/donate`),
  ]

  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)]
  const res = scenario()

  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'response time OK': (r) => r.timings.duration < 5000,
  })

  if (!success) errorRate.add(1)

  sleep(Math.random() * 3)
}

export function handleSummary(data) {
  console.log(`
╔════════════════════════════════════════════════╗
║         Stress Test Summary                    ║
╚════════════════════════════════════════════════╝

Breaking Point Analysis:
  Maximum VUs:         ${data.state.maxVUs}
  Total Requests:      ${data.metrics.http_reqs.values.count}
  Failed Requests:     ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%

  Response Times:
    Average:           ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
    P95:               ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
    P99:               ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms
    Max:               ${data.metrics.http_req_duration.values.max.toFixed(2)}ms

  Error Rate:          ${(data.metrics.errors.values.rate * 100).toFixed(2)}%

Recommendation:
  Safe Capacity:       ${Math.floor(data.state.maxVUs * 0.6)} concurrent users
  Max Capacity:        ${Math.floor(data.state.maxVUs * 0.8)} concurrent users
  `)

  return {
    'stress-test-summary.json': JSON.stringify(data, null, 2),
  }
}
