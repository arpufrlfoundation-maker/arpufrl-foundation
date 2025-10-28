import { NextRequest } from 'next/server'
import { GET as getPrograms, POST as createProgram } from '../../app/api/admin/programs/route'
import { GET as getProgramStats } from '../../app/api/admin/programs/stats/route'
import { PATCH as updateProgram, DELETE as deleteProgram } from '../../app/api/admin/programs/[id]/route'
import { User, UserRole, UserStatus } from '../../models/User'
import { Program } from '../../models/Program'
import { Donation } from '../../models/Donation'
import { auth } from '../../lib/auth'

// Mock auth
jest.mock('../../lib/auth', () => ({
  auth: jest.fn()
}))

const mockAuth = auth as jest.MockedFunction<typeof auth>

describe('/api/admin/programs', () => {
  let adminUser: any
  let coordinatorUser: any
  let testProgram1: any
  let testProgram2: any

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

    // Create test programs
    testProgram1 = await Program.create({
      name: 'Education Program',
      slug: 'education-program',
      description: 'Providing quality education to underprivileged children',
      longDescription: 'A comprehensive education program that focuses on...',
      targetAmount: 100000,
      raisedAmount: 45000,
      donationCount: 15,
      active: true,
      featured: true,
      priority: 10,
      metaTitle: 'Education Program - ARPU Foundation',
      metaDescription: 'Support our education program for underprivileged children'
    })

    testProgram2 = await Program.create({
      name: 'Healthcare Initiative',
      slug: 'healthcare-initiative',
      description: 'Providing healthcare services to rural communities',
      targetAmount: 150000,
      raisedAmount: 25000,
      donationCount: 8,
      active: false,
      featured: false,
      priority: 5
    })

    // Create test donations
    await Donation.create([
      {
        donorName: 'John Doe',
        amount: 25000,
        currency: 'INR',
        paymentStatus: 'SUCCESS',
        razorpayOrderId: 'order_1',
        razorpayPaymentId: 'pay_1',
        programId: testProgram1._id
      },
      {
        donorName: 'Jane Smith',
        amount: 15000,
        currency: 'INR',
        paymentStatus: 'SUCCESS',
        razorpayOrderId: 'order_2',
        razorpayPaymentId: 'pay_2',
        programId: testProgram2._id
      }
    ])
  })

  describe('GET /api/admin/programs', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(createAdminSession(adminUser) as any)
    })

    it('should return paginated programs for admin user', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/programs?page=1&limit=10')
      const response = await getPrograms(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.programs).toBeDefined()
      expect(Array.isArray(data.programs)).toBe(true)
      expect(data.programs.length).toBe(2)
      expect(data.pagination).toBeDefined()
      expect(data.pagination.currentPage).toBe(1)
      expect(data.pagination.totalCount).toBe(2)

      // Check program structure
      const program = data.programs[0]
      expect(program.id).toBeDefined()
      expect(program.name).toBeDefined()
      expect(program.slug).toBeDefined()
      expect(program.description).toBeDefined()
      expect(program.active).toBeDefined()
      expect(program.featured).toBeDefined()
      expect(program.createdAt).toBeDefined()
    })

    it('should filter programs by search term', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/programs?search=Education')
      const response = await getPrograms(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.programs.length).toBe(1)
      expect(data.programs[0].name).toBe('Education Program')
    })

    it('should filter programs by active status', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/programs?status=active')
      const response = await getPrograms(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.programs.length).toBe(1)
      expect(data.programs[0].active).toBe(true)
    })

    it('should filter programs by inactive status', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/programs?status=inactive')
      const response = await getPrograms(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.programs.length).toBe(1)
      expect(data.programs[0].active).toBe(false)
    })

    it('should filter programs by featured status', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/programs?featured=featured')
      const response = await getPrograms(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.programs.length).toBe(1)
      expect(data.programs[0].featured).toBe(true)
    })

    it('should sort programs by priority and creation date', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/programs')
      const response = await getPrograms(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.programs.length).toBe(2)
      // Should be sorted by priority desc, then createdAt desc
      expect(data.programs[0].priority).toBeGreaterThanOrEqual(data.programs[1].priority)
    })

    it('should deny access to non-admin users', async () => {
      mockAuth.mockResolvedValue(createCoordinatorSession(coordinatorUser) as any)

      const request = new NextRequest('http://localhost:3000/api/admin/programs')
      const response = await getPrograms(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized access')
    })
  })

  describe('POST /api/admin/programs', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(createAdminSession(adminUser) as any)
    })

    it('should create a new program successfully', async () => {
      const programData = {
        name: 'New Program',
        description: 'A new program description',
        longDescription: 'Detailed description of the new program',
        targetAmount: 200000,
        active: true,
        featured: false,
        priority: 8,
        metaTitle: 'New Program - ARPU Foundation',
        metaDescription: 'Support our new program'
      }

      const request = new NextRequest('http://localhost:3000/api/admin/programs', {
        method: 'POST',
        body: JSON.stringify(programData),
        headers: { 'content-type': 'application/json' }
      })

      const response = await createProgram(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.message).toBe('Program created successfully')
      expect(data.program.name).toBe('New Program')
      expect(data.program.slug).toBe('new-program')
      expect(data.program.active).toBe(true)

      // Verify in database
      const createdProgram = await Program.findOne({ slug: 'new-program' })
      expect(createdProgram).toBeTruthy()
      expect(createdProgram?.name).toBe('New Program')
    })

    it('should generate slug from name if not provided', async () => {
      const programData = {
        name: 'Test Program With Spaces & Special Characters!',
        description: 'Test description'
      }

      const request = new NextRequest('http://localhost:3000/api/admin/programs', {
        method: 'POST',
        body: JSON.stringify(programData),
        headers: { 'content-type': 'application/json' }
      })

      const response = await createProgram(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.program.slug).toBe('test-program-with-spaces-special-characters')
    })

    it('should validate required fields', async () => {
      const programData = {
        name: '', // Empty name
        description: '' // Empty description
      }

      const request = new NextRequest('http://localhost:3000/api/admin/programs', {
        method: 'POST',
        body: JSON.stringify(programData),
        headers: { 'content-type': 'application/json' }
      })

      const response = await createProgram(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Name and description are required')
    })

    it('should prevent duplicate slugs', async () => {
      const programData = {
        name: 'Education Program', // Same as existing program
        description: 'Another education program'
      }

      const request = new NextRequest('http://localhost:3000/api/admin/programs', {
        method: 'POST',
        body: JSON.stringify(programData),
        headers: { 'content-type': 'application/json' }
      })

      const response = await createProgram(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('A program with this slug already exists')
    })

    it('should deny access to non-admin users', async () => {
      mockAuth.mockResolvedValue(createCoordinatorSession(coordinatorUser) as any)

      const programData = {
        name: 'New Program',
        description: 'A new program description'
      }

      const request = new NextRequest('http://localhost:3000/api/admin/programs', {
        method: 'POST',
        body: JSON.stringify(programData),
        headers: { 'content-type': 'application/json' }
      })

      const response = await createProgram(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized access')
    })
  })

  describe('GET /api/admin/programs/stats', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(createAdminSession(adminUser) as any)
    })

    it('should return program statistics for admin user', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/programs/stats')
      const response = await getProgramStats(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.totalPrograms).toBe(2)
      expect(data.activePrograms).toBe(1)
      expect(data.featuredPrograms).toBe(1)
      expect(data.totalTargetAmount).toBe(250000) // 100000 + 150000
      expect(data.totalRaisedAmount).toBe(70000) // 45000 + 25000
      expect(data.totalDonations).toBe(2) // From donations collection
      expect(data.averageFundingPercentage).toBeDefined()
    })

    it('should calculate average funding percentage correctly', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/programs/stats')
      const response = await getProgramStats(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      // Program 1: 45000/100000 = 45%, Program 2: 25000/150000 = 16.67%
      // Average: (45 + 16.67) / 2 = 30.835%
      expect(data.averageFundingPercentage).toBeCloseTo(30.83, 1)
    })

    it('should deny access to non-admin users', async () => {
      mockAuth.mockResolvedValue(createCoordinatorSession(coordinatorUser) as any)

      const request = new NextRequest('http://localhost:3000/api/admin/programs/stats')
      const response = await getProgramStats(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized access')
    })
  })

  describe('PATCH /api/admin/programs/[id]', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(createAdminSession(adminUser) as any)
    })

    it('should update program successfully', async () => {
      const updateData = {
        name: 'Updated Education Program',
        description: 'Updated description',
        targetAmount: 120000,
        active: false,
        featured: false,
        priority: 15
      }

      const request = new NextRequest(`http://localhost:3000/api/admin/programs/${testProgram1._id}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData),
        headers: { 'content-type': 'application/json' }
      })

      const response = await updateProgram(request, { params: { id: testProgram1._id.toString() } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Program updated successfully')
      expect(data.program.name).toBe('Updated Education Program')
      expect(data.program.targetAmount).toBe(120000)
      expect(data.program.active).toBe(false)

      // Verify in database
      const updatedProgram = await Program.findById(testProgram1._id)
      expect(updatedProgram?.name).toBe('Updated Education Program')
      expect(updatedProgram?.slug).toBe('updated-education-program')
    })

    it('should validate target amount', async () => {
      const updateData = {
        targetAmount: 'invalid-amount'
      }

      const request = new NextRequest(`http://localhost:3000/api/admin/programs/${testProgram1._id}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData),
        headers: { 'content-type': 'application/json' }
      })

      const response = await updateProgram(request, { params: { id: testProgram1._id.toString() } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Target amount must be a valid positive number')
    })

    it('should validate priority', async () => {
      const updateData = {
        priority: 'invalid-priority'
      }

      const request = new NextRequest(`http://localhost:3000/api/admin/programs/${testProgram1._id}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData),
        headers: { 'content-type': 'application/json' }
      })

      const response = await updateProgram(request, { params: { id: testProgram1._id.toString() } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Priority must be a valid number')
    })

    it('should handle invalid program ID', async () => {
      const updateData = { name: 'Updated Name' }

      const request = new NextRequest('http://localhost:3000/api/admin/programs/invalid-id', {
        method: 'PATCH',
        body: JSON.stringify(updateData),
        headers: { 'content-type': 'application/json' }
      })

      const response = await updateProgram(request, { params: { id: 'invalid-id' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid program ID')
    })

    it('should handle non-existent program', async () => {
      const updateData = { name: 'Updated Name' }

      const request = new NextRequest('http://localhost:3000/api/admin/programs/507f1f77bcf86cd799439011', {
        method: 'PATCH',
        body: JSON.stringify(updateData),
        headers: { 'content-type': 'application/json' }
      })

      const response = await updateProgram(request, { params: { id: '507f1f77bcf86cd799439011' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Program not found')
    })

    it('should deny access to non-admin users', async () => {
      mockAuth.mockResolvedValue(createCoordinatorSession(coordinatorUser) as any)

      const updateData = { name: 'Updated Name' }

      const request = new NextRequest(`http://localhost:3000/api/admin/programs/${testProgram1._id}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData),
        headers: { 'content-type': 'application/json' }
      })

      const response = await updateProgram(request, { params: { id: testProgram1._id.toString() } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized access')
    })
  })

  describe('DELETE /api/admin/programs/[id]', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(createAdminSession(adminUser) as any)
    })

    it('should delete program without donations', async () => {
      // Create a program without donations
      const programWithoutDonations = await Program.create({
        name: 'Program Without Donations',
        slug: 'program-without-donations',
        description: 'A program with no donations',
        active: true,
        raisedAmount: 0,
        donationCount: 0
      })

      const request = new NextRequest(`http://localhost:3000/api/admin/programs/${programWithoutDonations._id}`, {
        method: 'DELETE'
      })

      const response = await deleteProgram(request, { params: { id: programWithoutDonations._id.toString() } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Program deleted successfully')

      // Verify program is deleted from database
      const deletedProgram = await Program.findById(programWithoutDonations._id)
      expect(deletedProgram).toBeNull()
    })

    it('should prevent deleting program with donations', async () => {
      const request = new NextRequest(`http://localhost:3000/api/admin/programs/${testProgram1._id}`, {
        method: 'DELETE'
      })

      const response = await deleteProgram(request, { params: { id: testProgram1._id.toString() } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Cannot delete program with existing donations')
    })

    it('should handle invalid program ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/programs/invalid-id', {
        method: 'DELETE'
      })

      const response = await deleteProgram(request, { params: { id: 'invalid-id' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid program ID')
    })

    it('should handle non-existent program', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/programs/507f1f77bcf86cd799439011', {
        method: 'DELETE'
      })

      const response = await deleteProgram(request, { params: { id: '507f1f77bcf86cd799439011' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Program not found')
    })

    it('should deny access to non-admin users', async () => {
      mockAuth.mockResolvedValue(createCoordinatorSession(coordinatorUser) as any)

      const request = new NextRequest(`http://localhost:3000/api/admin/programs/${testProgram1._id}`, {
        method: 'DELETE'
      })

      const response = await deleteProgram(request, { params: { id: testProgram1._id.toString() } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized access')
    })
  })
})