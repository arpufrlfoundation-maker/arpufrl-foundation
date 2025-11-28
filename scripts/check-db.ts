// Quick database check script
import dotenv from 'dotenv'
import mongoose from 'mongoose'

dotenv.config()

async function checkDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...')
    await mongoose.connect(process.env.MONGODB_URI!)
    console.log('✅ Connected successfully\n')

    if (!mongoose.connection.db) {
      console.error('❌ Database connection not established')
      return
    }

    const collections = await mongoose.connection.db.listCollections().toArray()
    console.log('📊 Collections in database:')

    for (const collection of collections) {
      const count = await mongoose.connection.db.collection(collection.name).countDocuments()
      console.log(`  ${collection.name}: ${count} documents`)
    }

    await mongoose.connection.close()
    console.log('\n✅ Check completed')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}checkDatabase()
