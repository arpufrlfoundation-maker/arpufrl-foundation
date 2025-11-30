import puppeteerCore from 'puppeteer-core'
import puppeteer from 'puppeteer'

/**
 * Get browser instance that works both locally and on Vercel
 */
export async function getBrowser() {
  // Check if running on Vercel/serverless
  const isVercel = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION

  if (isVercel) {
    // Use @sparticuz/chromium for Vercel
    const chromium = await import('@sparticuz/chromium')
    
    const executablePath = await chromium.default.executablePath()
    
    return puppeteerCore.launch({
      args: chromium.default.args,
      defaultViewport: chromium.default.defaultViewport,
      executablePath,
      headless: true,
    })
  } else {
    // Use regular puppeteer for local development
    return puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
  }
}
