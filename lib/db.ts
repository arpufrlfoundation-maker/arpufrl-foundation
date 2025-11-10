import mongoose from 'mongoose'
import { envConfig as env, isDevelopment } from './env-config'

// Connection state tracking
interface ConnectionState {
  isConnected: boolean
  isConnecting: boolean
  connectionPromise: Promise<typeof mongoose> | null
}

const connection: ConnectionState = {
  isConnected: false,
  isConnecting: false,
  connectionPromise: null
}

// MongoDB connection options with connection pooling
const mongooseOptions: mongoose.ConnectOptions = {
  // Connection pooling settings
  maxPoolSize: isDevelopment() ? 5 : 10, // Maximum number of connections
  minPoolSize: isDevelopment() ? 1 : 2,  // Minimum number of connections
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  serverSelectionTimeoutMS: 5000, // How long to try selecting a server
  socketTimeoutMS: 45000, // How long a send or receive on a socket can take

  // Retry settings
  retryWrites: true,
  retryReads: true,

  // Buffer settings
  bufferCommands: false, // Disable mongoose buffering
}

/**
 * Connect to MongoDB with retry logic and connection pooling
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  // Setup connection handlers first
  setupConnectionHandlers()

  // Return existing connection if already connected
  if (connection.isConnected && mongoose.connection.readyState === 1) {
    return mongoose
  }

  // Return existing connection promise if currently connecting
  if (connection.isConnecting && connection.connectionPromise) {
    return connection.connectionPromise
  }

  try {
    connection.isConnecting = true

    // Create connection promise with retry logic
    connection.connectionPromise = connectWithRetry()

    const mongooseInstance = await connection.connectionPromise

    connection.isConnected = true
    connection.isConnecting = false

    return mongooseInstance
  } catch (error) {
    connection.isConnecting = false
    connection.connectionPromise = null
    throw error
  }
}

/**
 * Connect to MongoDB with exponential backoff retry logic
 */
async function connectWithRetry(maxRetries = 5, baseDelay = 1000): Promise<typeof mongoose> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (isDevelopment()) {
        console.log(`Attempting to connect to MongoDB (attempt ${attempt}/${maxRetries})`)
      }

      const mongooseInstance = await mongoose.connect(env.MONGODB_URI, mongooseOptions)

      if (isDevelopment()) {
        console.log('Successfully connected to MongoDB')
      }

      return mongooseInstance
    } catch (error) {
      lastError = error as Error

      if (isDevelopment()) {
        console.error(`MongoDB connection attempt ${attempt} failed:`, error)
      }

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break
      }

      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1)

      if (isDevelopment()) {
        console.log(`Retrying in ${delay}ms...`)
      }

      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw new Error(`Failed to connect to MongoDB after ${maxRetries} attempts. Last error: ${lastError?.message}`)
}

/**
 * Disconnect from MongoDB
 */
export async function disconnectFromDatabase(): Promise<void> {
  if (connection.isConnected) {
    await mongoose.disconnect()
    connection.isConnected = false
    connection.connectionPromise = null

    if (isDevelopment()) {
      console.log('Disconnected from MongoDB')
    }
  }
}

/**
 * Get current connection status
 */
export function getConnectionStatus(): {
  isConnected: boolean
  isConnecting: boolean
  readyState: number
  readyStateString: string
} {
  const readyStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  }

  return {
    isConnected: connection.isConnected,
    isConnecting: connection.isConnecting,
    readyState: mongoose.connection.readyState,
    readyStateString: readyStateMap[mongoose.connection.readyState as keyof typeof readyStateMap] || 'unknown'
  }
}

/**
 * Database health check utility
 */
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy'
  details: {
    connected: boolean
    readyState: string
    host?: string
    name?: string
    error?: string
  }
}> {
  try {
    const connectionStatus = getConnectionStatus()

    if (!connectionStatus.isConnected || mongoose.connection.readyState !== 1) {
      return {
        status: 'unhealthy',
        details: {
          connected: false,
          readyState: connectionStatus.readyStateString,
          error: 'Database not connected'
        }
      }
    }

    // Perform a simple ping to verify connection
    if (mongoose.connection.db) {
      await mongoose.connection.db.admin().ping()
    }

    return {
      status: 'healthy',
      details: {
        connected: true,
        readyState: connectionStatus.readyStateString,
        host: mongoose.connection.host,
        name: mongoose.connection.name
      }
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      details: {
        connected: false,
        readyState: getConnectionStatus().readyStateString,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

/**
 * Setup connection event handlers
 */
function setupConnectionHandlers() {
  // Safely check if connection exists and has listenerCount method
  if (!mongoose.connection) {
    return
  }

  // Check listener count with null safety
  const hasConnectedListener = typeof mongoose.connection.listenerCount === 'function'
    ? mongoose.connection.listenerCount('connected') > 0
    : false

  // Only set up handlers once
  if (!hasConnectedListener) {
    mongoose.connection.on('connected', () => {
      if (isDevelopment()) {
        console.log('Mongoose connected to MongoDB')
      }
      connection.isConnected = true
    })

    mongoose.connection.on('error', (error) => {
      console.error('Mongoose connection error:', error)
      connection.isConnected = false
    })

    mongoose.connection.on('disconnected', () => {
      if (isDevelopment()) {
        console.log('Mongoose disconnected from MongoDB')
      }
      connection.isConnected = false
    })
  }
}

// Note: Graceful shutdown handling removed for Edge Runtime compatibility
// In production, connection cleanup is handled by the runtime environment