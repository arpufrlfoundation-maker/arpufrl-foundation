# STATE_PRESIDENT & STATE_COORDINATOR Auto-Assignment Feature

## Overview
STATE_PRESIDENT and STATE_COORDINATOR roles are automatically assigned under the ADMIN user when created, simplifying the hierarchy management process.

## Implementation Details

### Automatic Parent Assignment
When creating a user with either of these roles:
- **STATE_PRESIDENT**
- **STATE_COORDINATOR**

The system will automatically:
1. Find the first ADMIN user in the database
2. Set that ADMIN as the `parentCoordinatorId`
3. Skip the parent validation step

### API Changes

#### `/api/auth/signup` Route
```typescript
// Auto-assign ADMIN as parent for STATE_PRESIDENT and STATE_COORDINATOR
if (role === UserRole.STATE_PRESIDENT || role === UserRole.STATE_COORDINATOR) {
  const adminUser = await User.findOne({ role: UserRole.ADMIN })
  if (!adminUser) {
    return NextResponse.json(
      { error: 'No admin user found in the system. Please contact support.' },
      { status: 400 }
    )
  }
  parentCoordinatorId = adminUser._id
}
```

### Frontend Changes

#### CoordinatorManagement Component
- Parent Coordinator dropdown is **disabled** when STATE_PRESIDENT or STATE_COORDINATOR is selected
- Help text shows: "✓ Will automatically be assigned under ADMIN"
- Prevents confusion about which parent to select

### Validation Updates

#### Zod Schema (User Model)
```typescript
parentCoordinatorId: z.string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format')
  .optional()
  .or(z.literal(''))  // Allow empty string
  .transform(val => val === '' ? undefined : val),  // Convert empty to undefined
```

This handles cases where the frontend sends an empty string instead of omitting the field entirely.

## User Experience Flow

### Creating a STATE_PRESIDENT

1. Admin navigates to `/dashboard/admin/coordinators`
2. Clicks "Add Coordinator"
3. Selects role: **STATE_PRESIDENT**
4. Parent Coordinator dropdown becomes disabled
5. Help text shows: "✓ Will automatically be assigned under ADMIN"
6. Fills in other required fields (name, email, phone, region, password)
7. Submits form
8. Backend automatically assigns ADMIN as parent
9. User is created with correct hierarchy relationship

### Creating a STATE_COORDINATOR

Same flow as STATE_PRESIDENT - automatic assignment under ADMIN.

## Error Handling

### No ADMIN User Found
If the system doesn't have an ADMIN user when trying to create STATE_PRESIDENT or STATE_COORDINATOR:

```json
{
  "error": "No admin user found in the system. Please contact support.",
  "status": 400
}
```

**Resolution**: Ensure at least one ADMIN user exists in the database before creating state-level coordinators.

### Invalid Parent ID Format
For other roles, if an invalid parent ID is provided:

```json
{
  "error": "Invalid parent coordinator ID format",
  "status": 400
}
```

**Resolution**: Ensure the parent ID is a valid 24-character MongoDB ObjectId.

## Hierarchy Structure

```
ADMIN (Level 0) - System administrator
├── CENTRAL_PRESIDENT (Level 1)
├── STATE_PRESIDENT (Level 2) ← Auto-assigned under ADMIN
└── STATE_COORDINATOR (Level 3) ← Auto-assigned under ADMIN
    ├── ZONE_COORDINATOR (Level 4)
    └── DISTRICT_PRESIDENT (Level 5)
        └── DISTRICT_COORDINATOR (Level 6)
            └── BLOCK_COORDINATOR (Level 7)
                └── NODAL_OFFICER (Level 8)
                    └── PRERAK (Level 9)
                        └── PRERNA_SAKHI (Level 10)
                            └── VOLUNTEER (Level 11)
```

## Benefits

1. **Simplified User Creation**: No need to manually select ADMIN as parent
2. **Reduced Errors**: Eliminates "Invalid ObjectId format" errors for these roles
3. **Clear UX**: Visual feedback showing automatic assignment
4. **Consistent Hierarchy**: Ensures state-level coordinators are always under ADMIN
5. **Better Validation**: Handles empty string edge cases

## Testing

### Test Case 1: Create STATE_PRESIDENT
```bash
POST /api/auth/signup
{
  "name": "John Doe",
  "email": "john.state@example.com",
  "phone": "1234567890",
  "role": "STATE_PRESIDENT",
  "region": "Maharashtra",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123"
  // No parentId needed!
}
```

**Expected Result**: User created with `parentCoordinatorId` set to ADMIN's ID

### Test Case 2: Create STATE_COORDINATOR
```bash
POST /api/auth/signup
{
  "name": "Jane Smith",
  "email": "jane.state@example.com",
  "phone": "9876543210",
  "role": "STATE_COORDINATOR",
  "region": "Gujarat",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123",
  "parentId": ""  // Empty string handled gracefully
}
```

**Expected Result**: User created with `parentCoordinatorId` set to ADMIN's ID

### Test Case 3: Other Roles Still Require Parent
```bash
POST /api/auth/signup
{
  "name": "Bob Zone",
  "email": "bob.zone@example.com",
  "phone": "5551234567",
  "role": "ZONE_COORDINATOR",
  "region": "North Zone",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123",
  "parentId": "<valid_state_coordinator_id>"
}
```

**Expected Result**: User created with specified parent (manual selection still works for other roles)

## Migration Guide

### If You Have Existing STATE_PRESIDENT/STATE_COORDINATOR Users

No migration needed! This feature only affects **new user creation**. Existing users maintain their current parent assignments.

### Updating Existing Users

If you want to reassign existing STATE_PRESIDENT/STATE_COORDINATOR users under ADMIN:

```javascript
// MongoDB shell or script
const admin = db.users.findOne({ role: 'ADMIN' })
db.users.updateMany(
  { role: { $in: ['STATE_PRESIDENT', 'STATE_COORDINATOR'] } },
  { $set: { parentCoordinatorId: admin._id } }
)
```

## Related Files

- `/app/api/auth/signup/route.ts` - Auto-assignment logic
- `/models/User.ts` - Zod validation schema updates
- `/components/dashboard/CoordinatorManagement.tsx` - UI changes
- `/docs/TROUBLESHOOTING_COORDINATORS.md` - General troubleshooting guide

## Support

If you encounter issues with STATE_PRESIDENT or STATE_COORDINATOR creation:

1. Verify an ADMIN user exists in the database
2. Check browser console for detailed error messages
3. Review API response for specific validation errors
4. Ensure all required fields are filled (name, email, phone, region, password)
5. Contact system administrator if "No admin user found" error persists
