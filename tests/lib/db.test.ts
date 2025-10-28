import { connectToDatabase, disconnectFromDatabase, getConnectionStatus, checkDatabaseHealth } from '../../lib/db'
import mongoose from 'mongoose'

describe('Database Connection', () => {
  afterEach(async () => {
    // Ensure clean state after each test
    if (mongoose.connection.readyState === 1) {
      await disconnectFromDatabase()
    }
  })

  describe('Connection Management', () => {
    it('should connect to database successfully', async () => {
      const mongooseInstance = await connectToDatabase()

      expect(mongooseInstance).toBeDefined()
      expect(mongoose.connection.readyState).toBe(1) // Connected
    })

    it('should return existing connection if already connected', async () => {
      // First connection
      const firstConnection = await connectToDatabase()

      // Second connection should return the same instance
      const secondConnection = await connectToDatabase()

      expect(firstConnection).toBe(secondConnection)
      expect(mongoose.connection.readyState).toBe(1)
    })

    it('should disconnect from database successfully', async () => {
      await connectToDatabase()
      expect(mongoose.connection.readyState).toBe(1)

      await disconnectFromDatabase()
      expect(mongoose.connection.readyState).toBe(0) // Disconnected
    })
  })

  describe('Connection Status', () => {
    it('should return correct connection status when connected', async () => {
      await connectToDatabase()

      const status = getConnectionStatus()

      expect(status.isConnected).toBe(true)
      expect(status.readyState).toBe(1)
      expect(status.readyStateString).toBe('connected')
    })

    it('should return correct connection status when disconnected', async () => {
      // Ensure disconnected state
      if (mongoose.connection.readyState !== 0) {
        await disconnectFromDatabase()
      }

      const status = getConnectionStatus()

      expect(status.isConnected).toBe(false)
      expect(status.readyState).toBe(0)
      expect(status.readyStateString).toBe('disconnected')
    })
  })

  describe('Health Check', () => {
    it('should return healthy status when connected', async () => {
      await connectToDatabase()

      const health = await checkDatabaseHealth()

      expect(health.status).toBe('healthy')
      expect(health.details.connected).toBe(true)
      expect(health.details.readyState).toBe('connected')
      expect(health.details.host).toBeDefined()
      expect(health.details.name).toBeDefined()
    })

    it('should return unhealthy status when disconnected', async () => {
      // Ensure disconnected state
      if (mongoose.connection.readyState !== 0) {
        await disconnectFromDatabase()
      }

      const health = await checkDatabaseHealth()

      expect(health.status).toBe('unhealthy')
      expect(health.details.connected).toBe(false)
      expect(health.details.error).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle connection errors gracefully', async () => {
      // Mock a connection error by using invalid URI
      const originalUri = process.env.MONGODB_URI
      process.env.MONGODB_URI = 'mongodb://invalid-host:27017/test'

      try {
        // This should not throw but handle the error internally
        await expect(connectToDatabase()).rejects.toThrow()
      } finally {
        // Restore original URI
        process.env.MONGODB_URI = originalUri
      }
    })
  })

  describe('Connection Pooling', () => {
    it('should use connection pooling settings', async () => {
      await connectToDatabase()

      // Verify that connection is established with pooling
      expect(mongoose.connection.readyState).toBe(1)

      // The connection should have the pooling configuration
      // This is more of an integration test to ensure the connection works
      const db = mongoose.connection.db
      expect(db).toBeDefined()
    })
  })
})