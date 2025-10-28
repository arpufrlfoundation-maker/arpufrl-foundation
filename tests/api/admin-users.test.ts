import { NextRequest } from 'next/server'
import { GET as getUsers } from '../../app/api/admin/users/route'
import { PATCH as updateUser, DELETE as deleteUser } from '../../app/api/admin/users/[id]/route'
import { User, UserRole, UserStatus } from '../../models/User'
import { auth } from '../../lib/auth'

// Mock auth
jest.mock('../../lib/auth', () => ({
  auth: jest.fn()
}))

const mockAuth = auth as jest.MockedFunction<typeof auth>

describe('/api/admin/users', () => {
  let adminUser: any
  let coordinatorUser: any
  let subCoordinatorUser: any
  let donorUser: any

  beforeEach(async () => {
    // Create test users
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE
    })

    coordinatorUser = await User.create({
      name: 'Coordinator User',
      email: 'coordinator@test.com',
      role: UserRole.COORDINATOR,
      status: UserStatus.ACTIVE,
      region: 'Test Region'
    })

    subCoordinatorUser = await User.create({
      name: 'Sub Coordinator User',
      email: 'subcoordinator@test.com',
      role: UserRole.SUB_COORDINATOR,
      status: UserStatus.PENDING,
      region: 'Test Region',
      parentCoordinatorId: coordinatorUser._id
    })

    donorUser = await User.create({
      name: 'Donor User',
      email: 'donor@test.com',
      role: UserRole.DONOR,
      status: UserStatus.ACTIVE
    })
  })

  describe('GET /api/admin/users', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: {
          id: adminUser._id.toString(),
          role: UserRole.ADMIN,
          email: adminUser.email,
          name: adminUser.name
        }
      } as any)
    })

    it('should return paginated users for admin user', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users?page=1&limit=2')
      const response = await getUsers(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.users).toBeDefined()
      expect(Array.isArray(data.users)).toBe(true)
      expect(data.users.length).toBeLessThanOrEqual(2)
      expect(data.pagination).toBeDefined()
      expect(data.pagination.currentPage).toBe(1)
      expect(data.pagination.totalCount).toBe(4)

      // Check user structure
      const user = data.users[0]
      expect(user.id).toBeDefined()
      expect(user.name).toBeDefined()
      expect(user.email).toBeDefined()
      expect(user.role).toBeDefined()
      expect(user.status).toBeDefined()
      expect(user.createdAt).toBeDefined()
    })

    it('should filter users by search term', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users?search=Coordinator')
      const response = await getUsers(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.users.length).toBe(2) // coordinator and sub-coordinator
      data.users.forEach((user: any) => {
        expect(user.name.toLowerCase()).toContain('coordinator')
      })
    })

    it('should filter users by role', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users?role=COORDINATOR')
      const response = await getUsers(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.users.length).toBe(1)
      expect(data.users[0].role).toBe('COORDINATOR')
    })

    it('should filter users by status', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users?status=PENDING')
      const response = await getUsers(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.users.length).toBe(1)
      expect(data.users[0].status).toBe('PENDING')
    })

    it('should filter users by region', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users?region=Test Region')
      const response = await getUsers(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.users.length).toBe(2) // coordinator and sub-coordinator
      data.users.forEach((user: any) => {
        expect(user.region).toBe('Test Region')
      })
    })

    it('should include parent coordinator information', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users?role=SUB_COORDINATOR')
      const response = await getUsers(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.users.length).toBe(1)
      expect(data.users[0].parentCoordinatorName).toBe('Coordinator User')
    })

    it('should deny access to non-admin users', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: coordinatorUser._id.toString(),
          role: UserRole.COORDINATOR,
          email: coordinatorUser.email,
          name: coordinatorUser.name
        }
      } as any)

      const request = new NextRequest('http://localhost:3000/api/admin/users')
      const response = await getUsers(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized access')
    })
  })

  describe('PATCH /api/admin/users/[id]', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: {
          id: adminUser._id.toString(),
          role: UserRole.ADMIN,
          email: adminUser.email,
          name: adminUser.name
        }
      } as any)
    })

    it('should update user status', async () => {
      const requestBody = { status: 'INACTIVE' }
      const request = new NextRequest(`http://localhost:3000/api/admin/users/${donorUser._id}`, {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' }
      })

      const response = await updateUser(request, { params: { id: donorUser._id.toString() } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('User updated successfully')
      expect(data.user.status).toBe('INACTIVE')

      // Verify in database
      const updatedUser = await User.findById(donorUser._id)
      expect(updatedUser?.status).toBe('INACTIVE')
    })

    it('should update user role', async () => {
      const requestBody = { role: 'COORDINATOR', region: 'New Region' }
      const request = new NextRequest(`http://localhost:3000/api/admin/users/${donorUser._id}`, {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' }
      })

      const response = await updateUser(request, { params: { id: donorUser._id.toString() } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user.role).toBe('COORDINATOR')
      expect(data.user.region).toBe('New Region')
    })

    it('should validate status values', async () => {
      const requestBody = { status: 'INVALID_STATUS' }
      const request = new NextRequest(`http://localhost:3000/api/admin/users/${donorUser._id}`, {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' }
      })

      const response = await updateUser(request, { params: { id: donorUser._id.toString() } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid status')
    })

    it('should validate role values', async () => {
      const requestBody = { role: 'INVALID_ROLE' }
      const request = new NextRequest(`http://localhost:3000/api/admin/users/${donorUser._id}`, {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' }
      })

      const response = await updateUser(request, { params: { id: donorUser._id.toString() } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid role')
    })

    it('should prevent admin from changing their own role', async () => {
      const requestBody = { role: 'DONOR' }
      const request = new NextRequest(`http://localhost:3000/api/admin/users/${adminUser._id}`, {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' }
      })

      const response = await updateUser(request, { params: { id: adminUser._id.toString() } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Cannot change your own role')
    })

    it('should prevent admin from changing their own status', async () => {
      const requestBody = { status: 'INACTIVE' }
      const request = new NextRequest(`http://localhost:3000/api/admin/users/${adminUser._id}`, {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' }
      })

      const response = await updateUser(request, { params: { id: adminUser._id.toString() } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Cannot change your own status')
    })

    it('should handle invalid user ID', async () => {
      const requestBody = { status: 'INACTIVE' }
      const request = new NextRequest('http://localhost:3000/api/admin/users/invalid-id', {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' }
      })

      const response = await updateUser(request, { params: { id: 'invalid-id' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid user ID')
    })

    it('should handle non-existent user', async () => {
      const requestBody = { status: 'INACTIVE' }
      const request = new NextRequest('http://localhost:3000/api/admin/users/507f1f77bcf86cd799439011', {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' }
      })

      const response = await updateUser(request, { params: { id: '507f1f77bcf86cd799439011' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('User not found')
    })

    it('should deny access to non-admin users', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: coordinatorUser._id.toString(),
          role: UserRole.COORDINATOR,
          email: coordinatorUser.email,
          name: coordinatorUser.name
        }
      } as any)

      const requestBody = { status: 'INACTIVE' }
      const request = new NextRequest(`http://localhost:3000/api/admin/users/${donorUser._id}`, {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
        headers: { 'content-type': 'application/json' }
      })

      const response = await updateUser(request, { params: { id: donorUser._id.toString() } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized access')
    })
  })

  describe('DELETE /api/admin/users/[id]', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: {
          id: adminUser._id.toString(),
          role: UserRole.ADMIN,
          email: adminUser.email,
          name: adminUser.name
        }
      } as any)
    })

    it('should delete user successfully', async () => {
      const request = new NextRequest(`http://localhost:3000/api/admin/users/${donorUser._id}`, {
        method: 'DELETE'
      })

      const response = await deleteUser(request, { params: { id: donorUser._id.toString() } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('User deleted successfully')

      // Verify user is deleted from database
      const deletedUser = await User.findById(donorUser._id)
      expect(deletedUser).toBeNull()
    })

    it('should prevent admin from deleting themselves', async () => {
      const request = new NextRequest(`http://localhost:3000/api/admin/users/${adminUser._id}`, {
        method: 'DELETE'
      })

      const response = await deleteUser(request, { params: { id: adminUser._id.toString() } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Cannot delete your own account')
    })

    it('should prevent deleting user with sub-coordinators', async () => {
      const request = new NextRequest(`http://localhost:3000/api/admin/users/${coordinatorUser._id}`, {
        method: 'DELETE'
      })

      const response = await deleteUser(request, { params: { id: coordinatorUser._id.toString() } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Cannot delete user with sub-coordinators')
    })

    it('should handle invalid user ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users/invalid-id', {
        method: 'DELETE'
      })

      const response = await deleteUser(request, { params: { id: 'invalid-id' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid user ID')
    })

    it('should handle non-existent user', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users/507f1f77bcf86cd799439011', {
        method: 'DELETE'
      })

      const response = await deleteUser(request, { params: { id: '507f1f77bcf86cd799439011' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('User not found')
    })

    it('should deny access to non-admin users', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: coordinatorUser._id.toString(),
          role: UserRole.COORDINATOR,
          email: coordinatorUser.email,
          name: coordinatorUser.name
        }
      } as any)

      const request = new NextRequest(`http://localhost:3000/api/admin/users/${donorUser._id}`, {
        method: 'DELETE'
      })

      const response = await deleteUser(request, { params: { id: donorUser._id.toString() } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized access')
    })
  })
})