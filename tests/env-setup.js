const path = require('path')
const fs = require('fs')

// Load test environment variables
const envPath = path.join(__dirname, '.env.test')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  const envVars = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'))

  envVars.forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) {
      process.env[key.trim()] = value.trim()
    }
  })
}