# Migration Guide - Old Roles to New Hierarchy

## Role Migration Mapping

If you have existing users in your database, use this guide to migrate them to the new hierarchy.

### Role Name Changes

| Old Role Name | New Role Name | Level | Notes |
|---------------|---------------|-------|-------|
| `ADMIN` | `ADMIN` | 0 | No change |
| `NATIONAL_LEVEL` | `CENTRAL_PRESIDENT` | 1 | National President |
| `STATE_ADHYAKSH` | `STATE_PRESIDENT` | 2 | State President |
| `STATE_COORDINATOR` | `STATE_COORDINATOR` | 3 | No change |
| `MANDAL_COORDINATOR` | `ZONE_COORDINATOR` | 4 | Zone/Mandal Coordinator |
| `JILA_ADHYAKSH` | `DISTRICT_PRESIDENT` | 5 | District President (DP) |
| `JILA_COORDINATOR` | `DISTRICT_COORDINATOR` | 6 | District Coordinator (DC) |
| `BLOCK_COORDINATOR` | `BLOCK_COORDINATOR` | 7 | No change |
| `NODEL` | `NODAL_OFFICER` | 8 | Nodal Officer |
| `PRERAK` | `PRERAK` | 9 | No change |
| `PRERNA_SAKHI` | `PRERNA_SAKHI` | 10 | No change |
| `DONOR` | `VOLUNTEER` | 11 | Member/Supporter |

## MongoDB Migration Script

```javascript
// Run this in MongoDB shell or as a Node.js script

// Connect to your database
use your_database_name

// Update role names
db.users.updateMany(
  { role: 'NATIONAL_LEVEL' },
  { $set: { role: 'CENTRAL_PRESIDENT' } }
)

db.users.updateMany(
  { role: 'STATE_ADHYAKSH' },
  { $set: { role: 'STATE_PRESIDENT' } }
)

db.users.updateMany(
  { role: 'MANDAL_COORDINATOR' },
  { $set: { role: 'ZONE_COORDINATOR' } }
)

db.users.updateMany(
  { role: 'JILA_ADHYAKSH' },
  { $set: { role: 'DISTRICT_PRESIDENT' } }
)

db.users.updateMany(
  { role: 'JILA_COORDINATOR' },
  { $set: { role: 'DISTRICT_COORDINATOR' } }
)

db.users.updateMany(
  { role: 'NODEL' },
  { $set: { role: 'NODAL_OFFICER' } }
)

db.users.updateMany(
  { role: 'DONOR' },
  { $set: { role: 'VOLUNTEER' } }
)

// Rename location fields
db.users.updateMany(
  { mandal: { $exists: true } },
  { $rename: { 'mandal': 'zone' } }
)

db.users.updateMany(
  { jila: { $exists: true } },
  { $rename: { 'jila': 'district' } }
)

// Verify migration
db.users.aggregate([
  {
    $group: {
      _id: '$role',
      count: { $sum: 1 }
    }
  },
  {
    $sort: { _id: 1 }
  }
])
```

## Node.js Migration Script

Create a file `scripts/migrate-roles.js`:

```javascript
const mongoose = require('mongoose')
require('dotenv').config()

const ROLE_MAPPINGS = {
  'NATIONAL_LEVEL': 'CENTRAL_PRESIDENT',
  'STATE_ADHYAKSH': 'STATE_PRESIDENT',
  'MANDAL_COORDINATOR': 'ZONE_COORDINATOR',
  'JILA_ADHYAKSH': 'DISTRICT_PRESIDENT',
  'JILA_COORDINATOR': 'DISTRICT_COORDINATOR',
  'NODEL': 'NODAL_OFFICER',
  'DONOR': 'VOLUNTEER'
}

const FIELD_MAPPINGS = {
  'mandal': 'zone',
  'jila': 'district'
}

async function migrateRoles() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    const User = mongoose.model('User')

    // Migrate role names
    for (const [oldRole, newRole] of Object.entries(ROLE_MAPPINGS)) {
      const result = await User.updateMany(
        { role: oldRole },
        { $set: { role: newRole } }
      )
      console.log(`Migrated ${result.modifiedCount} users from ${oldRole} to ${newRole}`)
    }

    // Migrate field names
    for (const [oldField, newField] of Object.entries(FIELD_MAPPINGS)) {
      const result = await User.updateMany(
        { [oldField]: { $exists: true } },
        { $rename: { [oldField]: newField } }
      )
      console.log(`Renamed field ${oldField} to ${newField} for ${result.modifiedCount} users`)
    }

    // Verify migration
    const roleCounts = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ])

    console.log('\nRole distribution after migration:')
    roleCounts.forEach(({ _id, count }) => {
      console.log(`  ${_id}: ${count}`)
    })

    console.log('\n✅ Migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    await mongoose.disconnect()
  }
}

migrateRoles()
```

Run the migration:
```bash
node scripts/migrate-roles.js
```

## Verification Steps

After migration, verify:

1. **Check Role Distribution**
```javascript
db.users.aggregate([
  { $group: { _id: '$role', count: { $sum: 1 } } },
  { $sort: { _id: 1 } }
])
```

2. **Check for Old Roles**
```javascript
db.users.find({
  role: {
    $in: ['NATIONAL_LEVEL', 'STATE_ADHYAKSH', 'MANDAL_COORDINATOR',
          'JILA_ADHYAKSH', 'JILA_COORDINATOR', 'NODEL', 'DONOR']
  }
}).count()
```
Should return 0.

3. **Check Field Renames**
```javascript
db.users.find({
  $or: [
    { mandal: { $exists: true } },
    { jila: { $exists: true } }
  ]
}).count()
```
Should return 0.

## Rollback Plan

If you need to rollback:

```javascript
// Reverse role mappings
db.users.updateMany(
  { role: 'CENTRAL_PRESIDENT' },
  { $set: { role: 'NATIONAL_LEVEL' } }
)

db.users.updateMany(
  { role: 'STATE_PRESIDENT' },
  { $set: { role: 'STATE_ADHYAKSH' } }
)

db.users.updateMany(
  { role: 'ZONE_COORDINATOR' },
  { $set: { role: 'MANDAL_COORDINATOR' } }
)

db.users.updateMany(
  { role: 'DISTRICT_PRESIDENT' },
  { $set: { role: 'JILA_ADHYAKSH' } }
)

db.users.updateMany(
  { role: 'DISTRICT_COORDINATOR' },
  { $set: { role: 'JILA_COORDINATOR' } }
)

db.users.updateMany(
  { role: 'NODAL_OFFICER' },
  { $set: { role: 'NODEL' } }
)

db.users.updateMany(
  { role: 'VOLUNTEER' },
  { $set: { role: 'DONOR' } }
)

// Reverse field renames
db.users.updateMany(
  { zone: { $exists: true } },
  { $rename: { 'zone': 'mandal' } }
)

db.users.updateMany(
  { district: { $exists: true } },
  { $rename: { 'district': 'jila' } }
)
```

## Testing After Migration

1. Login with different role types
2. Check dashboard displays correctly
3. Verify team member visibility
4. Test payment attribution
5. Check analytics data
6. Verify hierarchy tree display

## Notes

- **Backup First**: Always backup your database before running migrations
- **Test Environment**: Run migration in test environment first
- **Downtime**: Schedule migration during low-traffic period
- **Monitoring**: Monitor error logs after migration
- **User Communication**: Notify users about the changes

## Support

If you encounter issues:
1. Check error logs
2. Verify MongoDB connection
3. Ensure all fields are correctly mapped
4. Contact support with specific error messages
