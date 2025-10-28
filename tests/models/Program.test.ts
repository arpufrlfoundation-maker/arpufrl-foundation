import { Program, programUtils } from '../../models/Program'
import { Donation, PaymentStatus } from '../../models/Donation'

describe('Program Model', () => {
  describe('Schema Validation', () => {
    it('should create a valid program with required fields', async () => {
      const programData = {
        name: 'Education for All',
        slug: 'education-for-all',
        description: 'Providing quality education to underprivileged children',
        targetAmount: 100000,
        active: true
      }

      const program = new Program(programData)
      await program.save()

      expect(program.name).toBe('Education for All')
      expect(program.slug).toBe('education-for-all')
      expect(program.description).toBe('Providing quality education to underprivileged children')
      expect(program.targetAmount).toBe(100000)
      expect(program.raisedAmount).toBe(0)
      expect(program.donationCount).toBe(0)
      expect(program.active).toBe(true)
      expect(program.featured).toBe(false)
      expect(program.priority).toBe(0)
    })

    it('should enforce unique slug constraint', async () => {
      const programData = {
        name: 'Test Program',
        slug: 'test-program',
        description: 'A test program for validation',
        active: true
      }

      await new Program(programData).save()

      // Try to create another program with same slug
      const duplicateProgram = new Program({
        ...programData,
        name: 'Another Test Program'
      })

      await expect(duplicateProgram.save()).rejects.toThrow()
    })

    it('should validate name length', async () => {
      const invalidProgram = new Program({
        name: 'AB', // Too short
        slug: 'ab',
        description: 'A test program',
        active: true
      })

      await expect(invalidProgram.save()).rejects.toThrow()
    })

    it('should validate description length', async () => {
      const invalidProgram = new Program({
        name: 'Test Program',
        slug: 'test-program',
        description: 'Short', // Too short
        active: true
      })

      await expect(invalidProgram.save()).rejects.toThrow()
    })

    it('should validate slug format', async () => {
      const invalidProgram = new Program({
        name: 'Test Program',
        slug: 'Invalid Slug!', // Contains invalid characters
        description: 'A test program for validation',
        active: true
      })

      await expect(invalidProgram.save()).rejects.toThrow()
    })

    it('should validate target amount range', async () => {
      const invalidProgram = new Program({
        name: 'Test Program',
        slug: 'test-program',
        description: 'A test program for validation',
        targetAmount: 500, // Below minimum
        active: true
      })

      await expect(invalidProgram.save()).rejects.toThrow()
    })

    it('should validate image URL format', async () => {
      const invalidProgram = new Program({
        name: 'Test Program',
        slug: 'test-program',
        description: 'A test program for validation',
        image: 'not-a-url',
        active: true
      })

      await expect(invalidProgram.save()).rejects.toThrow()
    })
  })

  describe('Slug Generation', () => {
    it('should auto-generate slug from name when not provided', async () => {
      const program = new Program({
        name: 'Education for All Children',
        description: 'Providing quality education to underprivileged children',
        active: true
      })

      await program.save()

      expect(program.slug).toBe('education-for-all-children')
    })

    it('should handle special characters in name', async () => {
      const program = new Program({
        name: 'Health & Wellness Program!',
        description: 'Providing healthcare services to communities',
        active: true
      })

      await program.save()

      expect(program.slug).toBe('health-wellness-program')
    })
  })

  describe('Instance Methods', () => {
    let program: any

    beforeEach(async () => {
      program = await Program.create({
        name: 'Test Program',
        slug: 'test-program',
        description: 'A test program for methods testing',
        targetAmount: 10000,
        active: true
      })
    })

    it('should update funding stats correctly', async () => {
      // Create test donations
      await Donation.create([
        {
          donorName: 'John Donor',
          amount: 2000,
          razorpayOrderId: 'order_1',
          paymentStatus: PaymentStatus.SUCCESS,
          programId: program._id
        },
        {
          donorName: 'Jane Donor',
          amount: 3000,
          razorpayOrderId: 'order_2',
          paymentStatus: PaymentStatus.SUCCESS,
          programId: program._id
        },
        {
          donorName: 'Bob Donor',
          amount: 1000,
          razorpayOrderId: 'order_3',
          paymentStatus: PaymentStatus.FAILED,
          programId: program._id
        }
      ])

      await program.updateFundingStats()

      expect(program.raisedAmount).toBe(5000) // Only successful donations
      expect(program.donationCount).toBe(2)
    })

    it('should calculate funding progress correctly', async () => {
      program.raisedAmount = 7500
      program.targetAmount = 10000

      const progress = program.getFundingProgress()

      expect(progress).toBe(75)
    })

    it('should cap funding progress at 100%', async () => {
      program.raisedAmount = 15000
      program.targetAmount = 10000

      const progress = program.getFundingProgress()

      expect(progress).toBe(100)
    })

    it('should return 0 progress when no target amount', async () => {
      program.targetAmount = undefined
      program.raisedAmount = 5000

      const progress = program.getFundingProgress()

      expect(progress).toBe(0)
    })

    it('should check if fully funded', async () => {
      program.raisedAmount = 10000
      program.targetAmount = 10000

      expect(program.isFullyFunded()).toBe(true)

      program.raisedAmount = 8000
      expect(program.isFullyFunded()).toBe(false)
    })

    it('should generate slug from name', () => {
      program.name = 'New Program Name'
      const slug = program.generateSlug()

      expect(slug).toBe('new-program-name')
    })

    it('should generate SEO data', () => {
      program.metaTitle = 'Custom Meta Title'
      program.metaDescription = 'Custom meta description'
      program.image = 'https://example.com/image.jpg'

      const seoData = program.toSEOData()

      expect(seoData.title).toBe('Custom Meta Title')
      expect(seoData.description).toBe('Custom meta description')
      expect(seoData.image).toBe('https://example.com/image.jpg')
      expect(seoData.url).toBe('/programs/test-program')
      expect(seoData.structuredData).toBeDefined()
      expect(seoData.structuredData['@type']).toBe('Project')
    })
  })

  describe('Static Methods', () => {
    beforeEach(async () => {
      // Create test programs
      await Program.create([
        {
          name: 'Active Program 1',
          slug: 'active-program-1',
          description: 'First active program',
          active: true,
          featured: true,
          priority: 10,
          raisedAmount: 5000
        },
        {
          name: 'Active Program 2',
          slug: 'active-program-2',
          description: 'Second active program',
          active: true,
          featured: false,
          priority: 5,
          raisedAmount: 3000
        },
        {
          name: 'Inactive Program',
          slug: 'inactive-program',
          description: 'An inactive program',
          active: false,
          featured: false,
          priority: 0,
          raisedAmount: 1000
        }
      ])
    })

    it('should find program by slug', async () => {
      const program = await Program.findBySlug('active-program-1')

      expect(program).toBeDefined()
      expect(program?.name).toBe('Active Program 1')
    })

    it('should not find inactive program by slug', async () => {
      const program = await Program.findBySlug('inactive-program')

      expect(program).toBeNull()
    })

    it('should find active programs only', async () => {
      const programs = await Program.findActive()

      expect(programs).toHaveLength(2)
      expect(programs.every(p => p.active)).toBe(true)
    })

    it('should find featured programs', async () => {
      const programs = await Program.findFeatured()

      expect(programs).toHaveLength(1)
      expect(programs[0].name).toBe('Active Program 1')
    })

    it('should find programs by priority', async () => {
      const programs = await Program.findByPriority()

      expect(programs).toHaveLength(2)
      expect(programs[0].priority).toBeGreaterThanOrEqual(programs[1].priority)
    })

    it('should search programs by text', async () => {
      const programs = await Program.searchPrograms('first')

      expect(programs).toHaveLength(1)
      expect(programs[0].name).toBe('Active Program 1')
    })

    it('should update all funding stats', async () => {
      // This method would update stats for all programs
      // We'll just verify it doesn't throw an error
      await expect(Program.updateAllFundingStats()).resolves.not.toThrow()
    })
  })

  describe('Utility Functions', () => {
    it('should validate program data with Zod', () => {
      const validData = {
        name: 'Test Program',
        slug: 'test-program',
        description: 'A valid test program description',
        targetAmount: 50000,
        active: true,
        featured: false,
        priority: 5
      }

      const invalidData = {
        name: 'AB', // Too short
        slug: 'Invalid Slug!',
        description: 'Short',
        targetAmount: 500 // Below minimum
      }

      const validResult = programUtils.validateProgramData(validData)
      const invalidResult = programUtils.validateProgramData(invalidData)

      expect(validResult.success).toBe(true)
      expect(invalidResult.success).toBe(false)
    })

    it('should generate unique slug', async () => {
      // Create a program with a specific slug
      await Program.create({
        name: 'Test Program',
        slug: 'test-program',
        description: 'A test program',
        active: true
      })

      // Generate unique slug for same name
      const uniqueSlug = await programUtils.generateUniqueSlug('Test Program')

      expect(uniqueSlug).toBe('test-program-1')
    })

    it('should get program statistics', async () => {
      // Create test programs with different states
      await Program.create([
        {
          name: 'Program 1',
          slug: 'program-1',
          description: 'First program',
          targetAmount: 10000,
          raisedAmount: 8000,
          active: true,
          featured: true
        },
        {
          name: 'Program 2',
          slug: 'program-2',
          description: 'Second program',
          targetAmount: 5000,
          raisedAmount: 5000,
          active: true,
          featured: false
        },
        {
          name: 'Program 3',
          slug: 'program-3',
          description: 'Third program',
          targetAmount: 0,
          raisedAmount: 2000,
          active: false,
          featured: false
        }
      ])

      const stats = await programUtils.getProgramStats()

      expect(stats.totalPrograms).toBe(3)
      expect(stats.activePrograms).toBe(2)
      expect(stats.featuredPrograms).toBe(1)
      expect(stats.totalTargetAmount).toBe(15000)
      expect(stats.totalRaisedAmount).toBe(15000)
      expect(stats.fullyFundedPrograms).toBe(1) // Program 2
    })
  })
})