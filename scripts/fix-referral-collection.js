const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function fixReferralCodeCollection() {
  try {
    console.log('🔧 FIXING REFERRAL CODE COLLECTION');
    console.log('='.repeat(60));

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    const db = mongoose.connection.db;

    // Check both collections
    const oldCollection = db.collection('referral_codes'); // Our created collection
    const newCollection = db.collection('referralcodes'); // Mongoose expected collection

    // Count documents in both
    const oldCount = await oldCollection.countDocuments();
    const newCount = await newCollection.countDocuments();

    console.log(`Old collection (referral_codes): ${oldCount} documents`);
    console.log(`New collection (referralcodes): ${newCount} documents`);
    console.log('');

    if (oldCount > 0) {
      console.log('Moving documents from referral_codes to referralcodes...');
      
      // Get all documents from old collection
      const documents = await oldCollection.find({}).toArray();
      
      // Insert into new collection
      if (documents.length > 0) {
        await newCollection.insertMany(documents);
        console.log(`✅ Moved ${documents.length} documents`);
        
        // Optionally, drop the old collection
        //await oldCollection.drop();
        //console.log('✅ Dropped old collection');
      }
    }

    // Verify
    const finalCount = await newCollection.countDocuments();
    console.log(`\n✅ Final count in referralcodes: ${finalCount} documents`);

    // List all codes
    const codes = await newCollection.find({}).toArray();
    console.log('\nActive Referral Codes:');
    for (const code of codes) {
      const user = await db.collection('users').findOne({ _id: code.ownerUserId });
      console.log(`  ${code.code} → ${user?.name || 'Unknown'}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

fixReferralCodeCollection();
