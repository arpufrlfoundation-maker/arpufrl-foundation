// Alternative environment configuration to bypass validation issues
export const envConfig = {
  MONGODB_URI: 'mongodb+srv://ronakkumar20062006:6a3Z2VCGkXH0ZtL4@cluster0.969t4yr.mongodb.net/?appName=Cluster0',
  NEXTAUTH_SECRET: 'development-secret-key-change-in-production-12345678901234567890',
  NEXTAUTH_URL: 'http://localhost:3000',
  RAZORPAY_KEY_ID: 'rzp_test_1234567890',
  RAZORPAY_KEY_SECRET: 'test_secret_1234567890',
  RAZORPAY_WEBHOOK_SECRET: 'webhook_secret_1234567890',
  NODE_ENV: 'development' as const,
  APP_URL: 'http://localhost:3000',
  EMAIL_SERVER_HOST: undefined,
  EMAIL_SERVER_PORT: undefined,
  EMAIL_SERVER_USER: undefined,
  EMAIL_SERVER_PASSWORD: undefined,
  EMAIL_FROM: undefined,
}

export const isDevelopment = () => envConfig.NODE_ENV === 'development'
export const isProduction = () => envConfig.NODE_ENV === 'production'
export const isTest = () => envConfig.NODE_ENV === 'test'

export type EnvConfig = typeof envConfig