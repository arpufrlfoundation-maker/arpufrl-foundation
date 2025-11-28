#!/usr/bin/env node

/**
 * Environment Variables Checker
 * Verifies that all required environment variables are properly set
 */

// Load environment variables from .env.local and .env files
require('dotenv').config({ path: '.env.local' })
require('dotenv').config({ path: '.env' })

console.log('\n🔍 Checking Environment Variables...\n')
console.log('=' .repeat(60))

const requiredVars = [
  { name: 'MONGODB_URI', required: true, sensitive: true },
  { name: 'NEXTAUTH_SECRET', required: true, sensitive: true },
  { name: 'NEXTAUTH_URL', required: true, sensitive: false },
  { name: 'RAZORPAY_KEY_ID', required: true, sensitive: true },
  { name: 'RAZORPAY_KEY_SECRET', required: true, sensitive: true },
  { name: 'NODE_ENV', required: true, sensitive: false },
]

const optionalVars = [
  { name: 'EMAIL_SERVER_HOST', required: false, sensitive: false },
  { name: 'EMAIL_SERVER_USER', required: false, sensitive: true },
  { name: 'EMAIL_SERVER_PASSWORD', required: false, sensitive: true },
  { name: 'CLOUDINARY_CLOUD_NAME', required: false, sensitive: false },
  { name: 'CLOUDINARY_API_KEY', required: false, sensitive: true },
  { name: 'RAZORPAY_WEBHOOK_SECRET', required: false, sensitive: true },
]

let hasErrors = false
let hasWarnings = false

// Check required variables
console.log('\n✅ REQUIRED Variables:\n')
requiredVars.forEach(({ name, sensitive }) => {
  const value = process.env[name]
  const status = value ? '✅' : '❌'
  const display = value
    ? (sensitive ? `${value.substring(0, 10)}...` : value)
    : 'MISSING'

  console.log(`${status} ${name.padEnd(25)} ${display}`)

  if (!value) {
    hasErrors = true
  }

  // Additional validation
  if (name === 'NEXTAUTH_SECRET' && value && value.length < 32) {
    console.log(`   ⚠️  Warning: Should be at least 32 characters`)
    hasWarnings = true
  }

  if (name === 'MONGODB_URI' && value && !value.startsWith('mongodb')) {
    console.log(`   ⚠️  Warning: Should start with mongodb:// or mongodb+srv://`)
    hasWarnings = true
  }

  if (name === 'NEXTAUTH_URL' && value && !value.startsWith('http')) {
    console.log(`   ⚠️  Warning: Should start with http:// or https://`)
    hasWarnings = true
  }
})

// Check optional variables
console.log('\n⚙️  OPTIONAL Variables:\n')
optionalVars.forEach(({ name, sensitive }) => {
  const value = process.env[name]
  const status = value ? '✅' : '⚠️ '
  const display = value
    ? (sensitive ? `${value.substring(0, 10)}...` : value)
    : 'Not Set'

  console.log(`${status} ${name.padEnd(25)} ${display}`)

  if (!value && name.startsWith('EMAIL_')) {
    hasWarnings = true
  }
})

// Production-specific checks
if (process.env.NODE_ENV === 'production') {
  console.log('\n🔒 PRODUCTION Checks:\n')

  const checks = [
    {
      condition: process.env.NEXTAUTH_SECRET?.includes('development'),
      message: '❌ CRITICAL: Using development secret in production!'
    },
    {
      condition: process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test'),
      message: '⚠️  WARNING: Using Razorpay TEST keys in production'
    },
    {
      condition: process.env.MONGODB_URI?.includes('localhost'),
      message: '❌ CRITICAL: Using localhost database in production!'
    },
    {
      condition: !process.env.EMAIL_SERVER_HOST,
      message: '⚠️  WARNING: Email not configured - receipts won\'t be sent'
    },
  ]

  checks.forEach(({ condition, message }) => {
    if (condition) {
      console.log(message)
      if (message.includes('CRITICAL')) {
        hasErrors = true
      } else {
        hasWarnings = true
      }
    }
  })
}

// Summary
console.log('\n' + '='.repeat(60))

if (hasErrors) {
  console.log('\n❌ ERRORS FOUND: Please fix the issues above before proceeding.')
  console.log('   See ENV_SETUP_GUIDE.md for detailed setup instructions.\n')
  process.exit(1)
} else if (hasWarnings) {
  console.log('\n⚠️  WARNINGS: Environment is functional but has optional issues.')
  console.log('   Consider addressing the warnings above.\n')
  process.exit(0)
} else {
  console.log('\n✅ All environment variables properly configured!\n')
  process.exit(0)
}
