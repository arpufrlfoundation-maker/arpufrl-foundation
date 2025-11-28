// Environment configuration for the application
// All environment variables with fallbacks

const getEnv = (key: string, defaultValue: string = ''): string => {
  return process.env[key] ?? defaultValue
}

export const env = {
  MONGODB_URI: getEnv('MONGODB_URI', 'mongodb+srv://arpufrlfoundation_db_user:rH1e9vhyOGlggNYp@arpufrl.jxdguw5.mongodb.net/?appName=arpufrl'),
  NEXTAUTH_SECRET: getEnv('NEXTAUTH_SECRET', 'development-secret-key-change-in-production-12345678901234567890'),
  NEXTAUTH_URL: getEnv('NEXTAUTH_URL', 'https://arpufrl.in'),
  RAZORPAY_KEY_ID: getEnv('RAZORPAY_KEY_ID', 'rzp_test_1234567890'),
  RAZORPAY_KEY_SECRET: getEnv('RAZORPAY_KEY_SECRET', 'test_secret_1234567890'),
  RAZORPAY_WEBHOOK_SECRET: getEnv('RAZORPAY_WEBHOOK_SECRET', 'webhook_secret_1234567890'),
  NODE_ENV: getEnv('NODE_ENV', 'development') as 'development' | 'production' | 'test',
  APP_URL: getEnv('APP_URL', 'http://localhost:3000'),
  EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST,
  EMAIL_SERVER_PORT: process.env.EMAIL_SERVER_PORT,
  EMAIL_SERVER_USER: process.env.EMAIL_SERVER_USER,
  EMAIL_SERVER_PASSWORD: process.env.EMAIL_SERVER_PASSWORD,
  EMAIL_FROM: process.env.EMAIL_FROM,
}

export const isDevelopment = () => env.NODE_ENV === 'development'
export const isProduction = () => env.NODE_ENV === 'production'
export const isTest = () => env.NODE_ENV === 'test'

export type Env = typeof env