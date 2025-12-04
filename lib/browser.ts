import puppeteerCore from 'puppeteer-core'
import puppeteer from 'puppeteer'

// Chromium executable URL for serverless environments
const CHROMIUM_EXECUTABLE_URL = 'https://github.com/nicholasgriffintn/puppeteer-on-vercel-chromium/releases/download/v133.0.0/chromium-v133.0.0-pack.tar'

/**
 * Get browser instance that works both locally and on Vercel
 */
export async function getBrowser() {
  // Check if running on Vercel/serverless
  const isVercel = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION

  if (isVercel) {
    try {
      // Use @sparticuz/chromium-min for Vercel
      const chromium = await import('@sparticuz/chromium-min')

      const executablePath = await chromium.default.executablePath(CHROMIUM_EXECUTABLE_URL)

      return puppeteerCore.launch({
        args: chromium.default.args,
        defaultViewport: { width: 1920, height: 1080 },
        executablePath,
        headless: true,
      })
    } catch (error) {
      console.error('Failed to launch chromium on Vercel:', error)
      throw new Error('PDF generation is not available in this environment')
    }
  } else {
    // Use regular puppeteer for local development
    return puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
  }
}
