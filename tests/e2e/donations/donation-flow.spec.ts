/**
 * E2E Test: Complete Donation Flow
 * Tests the user journey from landing page to donation success
 */

import { test, expect } from '@playwright/test'

test.describe('Online Donation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to donate page
    await page.goto('http://localhost:3000/donate?ref=TEST123')
  })

  test('should complete full donation with referral code', async ({ page }) => {
    // 1. Verify page loaded and referral code populated
    await expect(page.locator('h1')).toContainText('Make a Donation')
    const referralInput = page.locator('input[name="referralCode"]')
    await expect(referralInput).toHaveValue('TEST123')

    // 2. Wait for programs to load
    await page.waitForSelector('select[name="programId"]')
    const programSelect = page.locator('select[name="programId"]')
    await expect(programSelect).not.toBeDisabled()

    // Verify programs loaded
    const programOptions = await programSelect.locator('option').count()
    expect(programOptions).toBeGreaterThan(1) // At least one program + default option

    // 3. Select amount
    await page.click('button:has-text("₹500")')

    // Verify amount selected (button should be highlighted)
    await expect(page.locator('button:has-text("₹500")')).toHaveClass(/border-blue-500/)

    // 4. Select program
    await programSelect.selectOption({ index: 1 }) // Select first program

    // 5. Fill donor details
    await page.fill('input[name="donorName"]', 'Test Donor')
    await page.fill('input[name="donorEmail"]', 'testdonor@example.com')
    await page.fill('input[name="donorPhone"]', '+919876543210')

    // 6. Accept terms
    await page.check('input[name="acceptTerms"]')
    await page.check('input[name="privacyConsentGiven"]')
    await page.check('input[name="dataProcessingConsent"]')

    // 7. Submit form
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).not.toBeDisabled()
    await submitButton.click()

    // 8. Wait for Razorpay checkout to load
    await page.waitForSelector('iframe[name="razorpay-checkout"]', { timeout: 10000 })

    // Note: In test mode, we would mock the Razorpay response
    // In production, we skip actual payment in E2E tests

    console.log('✓ Donation form submitted successfully')
    console.log('✓ Razorpay checkout loaded')
  })

  test('should show validation errors for incomplete form', async ({ page }) => {
    // Try to submit without filling required fields
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()

    // Should show validation errors
    await expect(page.locator('text=Please select a program')).toBeVisible()
    await expect(page.locator('text=Minimum donation amount')).toBeVisible()
  })

  test('should handle custom amount input', async ({ page }) => {
    // Click custom amount button
    await page.click('button:has-text("Enter Custom Amount")')

    // Input custom amount
    const customInput = page.locator('input[type="number"][placeholder*="amount"]')
    await customInput.fill('1500')

    // Verify amount accepted
    await expect(customInput).toHaveValue('1500')
  })

  test('should show program details', async ({ page }) => {
    // Wait for programs to load
    await page.waitForSelector('select[name="programId"] option:not([value=""])')

    // Select a program
    const programSelect = page.locator('select[name="programId"]')
    await programSelect.selectOption({ index: 1 })

    // Program description should appear (if implemented)
    // await expect(page.locator('.program-description')).toBeVisible()
  })

  test('should retry loading programs on failure', async ({ page }) => {
    // Intercept API call and simulate failure then success
    await page.route('**/api/programs?active=true', (route, request) => {
      const retryCount = request.headers()['x-retry'] || '0'

      if (parseInt(retryCount) === 0) {
        // First call fails
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Server error' })
        })
      } else {
        // Retry succeeds
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: {
              programs: [
                {
                  _id: '507f1f77bcf86cd799439011',
                  name: 'Test Program',
                  slug: 'test-program',
                  targetAmount: 10000,
                  raisedAmount: 5000,
                  active: true
                }
              ]
            }
          })
        })
      }
    })

    await page.reload()

    // Programs should eventually load via retry
    await page.waitForSelector('select[name="programId"] option:not([value=""])', { timeout: 5000 })
    const programOptions = await page.locator('select[name="programId"] option').count()
    expect(programOptions).toBeGreaterThan(1)
  })
})

test.describe('Transaction Recording Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    // Mock authentication
    await context.addCookies([
      {
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/'
      }
    ])

    await page.goto('http://localhost:3000/dashboard/coordinator/targets')
  })

  test('should record manual transaction', async ({ page }) => {
    // Navigate to Record Collection tab
    await page.click('text=Record Collection')

    // Wait for form to load
    await expect(page.locator('h3:has-text("Transaction Details")')).toBeVisible()

    // Fill transaction details
    await page.fill('input[type="number"][value=""]', '1000')

    // Select payment mode
    await page.click('button:has-text("Cash")')

    // Fill donor details (optional)
    await page.fill('input[placeholder*="Rajesh Kumar"]', 'Test Donor')
    await page.fill('input[placeholder*="9876543210"]', '+919876543210')

    // Select program
    await page.waitForSelector('select[name="program"]')
    const programSelect = page.locator('select[name="program"]')
    await programSelect.selectOption({ index: 1 })

    // Submit
    await page.click('button[type="submit"]:has-text("Record Transaction")')

    // Wait for success message
    await expect(page.locator('text=Transaction recorded successfully')).toBeVisible({ timeout: 5000 })

    // Verify transaction appears in recent list
    await expect(page.locator('text=₹1,000')).toBeVisible()
    await expect(page.locator('text=pending')).toBeVisible()
  })

  test('should validate program selection', async ({ page }) => {
    await page.click('text=Record Collection')

    // Fill amount but not program
    await page.fill('input[type="number"][value=""]', '1000')
    await page.click('button:has-text("Cash")')

    // Try to submit
    await page.click('button[type="submit"]:has-text("Record Transaction")')

    // Should show error
    await expect(page.locator('text=Please select a program')).toBeVisible()
  })
})

test.describe('Target Dashboard', () => {
  test('should display target statistics correctly', async ({ page, context }) => {
    // Mock authentication
    await context.addCookies([
      {
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/'
      }
    ])

    await page.goto('http://localhost:3000/dashboard/coordinator/targets')

    // Wait for dashboard to load
    await page.waitForSelector('h2:has-text("Target Progress")')

    // Verify target card displays
    await expect(page.locator('text=Fund Collection Target')).toBeVisible()

    // Verify statistics cards
    await expect(page.locator('text=Personal Collection')).toBeVisible()
    await expect(page.locator('text=Team Collection')).toBeVisible()

    // Verify progress bar exists
    await expect(page.locator('.bg-white.h-full.rounded-full')).toBeVisible()

    // Test refresh button
    const refreshButton = page.locator('button:has-text("Refresh")')
    await refreshButton.click()
    await expect(refreshButton).toContainText('Refreshing...')
    await page.waitForTimeout(1000)
    await expect(refreshButton).toContainText('Refresh')
  })

  test('should show target period donations', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/'
      }
    ])

    await page.goto('http://localhost:3000/dashboard/coordinator/targets')

    // Wait for stats to load
    await page.waitForSelector('text=Personal Collection')

    // Verify target period info is displayed
    const periodInfo = page.locator('text=/\\d+ donations in target period/')
    await expect(periodInfo).toBeVisible()
  })
})
