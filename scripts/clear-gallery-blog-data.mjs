#!/usr/bin/env node

import mongoose from 'mongoose'
import { GalleryImage } from '../models/Gallery'
import { Blog } from '../models/Blog'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is not set')
  process.exit(1)
}

async function clearDatabase() {
  try {
    console.log('Connecting to database...')
    await mongoose.connect(MONGODB_URI)
    console.log('✓ Connected to MongoDB')

    console.log('\nClearing Gallery Images...')
    const galleryResult = await GalleryImage.deleteMany({})
    console.log(`✓ Deleted ${galleryResult.deletedCount} gallery images`)

    console.log('\nClearing Blogs...')
    const blogResult = await Blog.deleteMany({})
    console.log(`✓ Deleted ${blogResult.deletedCount} blogs`)

    console.log('\n✓ Database cleared successfully!')
    
    await mongoose.disconnect()
    console.log('✓ Disconnected from database')
    process.exit(0)
  } catch (error) {
    console.error('Error clearing database:', error)
    process.exit(1)
  }
}

clearDatabase()
