import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import { Donation, PaymentStatus } from '@/models/Donation'
import { Program } from '@/models/Program'
import { User } from '@/models/User'
import { ReferralCode } from '@/models/ReferralCode'

// Validation schema for manual donation entry
const manualDonationSchema = z.object({
  donorName: z.string().min(2).max(100),
  donorEmail: z.string().email().optional(),
  donorPhone: z.string().min(10).max(15).optional(),
  amount: z.number().min(100).max(100000),
  programId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE', 'OTHER']).default('CASH'),
  transactionId: z.string().optional(),
  notes: z.string().max(500).optional()
})

/**
 * POST /api/donations/manual
 * Allow volunteers to manually record offline donations
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectToDatabase()

    const body = await request.json()
    const validationResult = manualDonationSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const { donorName, donorEmail, donorPhone, amount, programId, paymentMethod, transactionId, notes } = validationResult.data

    // Get user who is recording the donation
    const user = await User.findById(session.user.id)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify program exists
    const program = await Program.findById(programId)
    if (!program) {
      return NextResponse.json(
        { success: false, error: 'Program not found' },
        { status: 404 }
      )
    }

    // Get user's referral code
    const referralCode = await ReferralCode.findOne({ ownerUserId: user._id })

    // Create donation record
    const donation = await Donation.create({
      donorName,
      donorEmail: donorEmail || undefined,
      donorPhone: donorPhone || undefined,
      amount,
      currency: 'INR',
      programId,
      referralCodeId: referralCode?._id,
      referredBy: user._id,
      attributedToUserId: user._id,
      paymentStatus: PaymentStatus.SUCCESS,
      paymentMethod,
      transactionId: transactionId || `MANUAL-${Date.now()}`,
      isManualEntry: true,
      recordedBy: user._id,
      notes,
      privacyConsentGiven: true,
      dataProcessingConsent: true
    })

    // Update program donation stats
    program.donationCount = (program.donationCount || 0) + 1
    program.raisedAmount = (program.raisedAmount || 0) + amount
    await program.save()

    // Update user donation stats
    user.totalDonationsReferred = (user.totalDonationsReferred || 0) + 1
    user.totalAmountReferred = (user.totalAmountReferred || 0) + amount
    await user.save()

    // Update target collections
    try {
      const Target = (await import('@/models/Target')).default
      const donationDate = new Date()

      const activeTarget = await Target.findOne({
        assignedTo: user._id,
        status: { $in: ['PENDING', 'IN_PROGRESS'] },
        startDate: { $lte: donationDate },
        endDate: { $gte: donationDate }
      })

      if (activeTarget) {
        activeTarget.personalCollection = (activeTarget.personalCollection || 0) + amount
        activeTarget.totalCollection = (activeTarget.totalCollection || 0) + amount
        activeTarget.progressPercentage = (activeTarget.totalCollection / activeTarget.targetAmount) * 100

        if (activeTarget.status === 'PENDING') {
          activeTarget.status = 'IN_PROGRESS'
        }
        if (activeTarget.progressPercentage >= 100) {
          activeTarget.status = 'COMPLETED'
        }

        await activeTarget.save()

        // Propagate to parents
        let currentParentId = user.parentCoordinatorId
        const visited = new Set<string>()

        while (currentParentId && !visited.has(currentParentId.toString())) {
          visited.add(currentParentId.toString())

          const parentTarget = await Target.findOne({
            assignedTo: currentParentId,
            status: { $in: ['PENDING', 'IN_PROGRESS'] },
            startDate: { $lte: donationDate },
            endDate: { $gte: donationDate }
          })

          if (parentTarget) {
            parentTarget.teamCollection = (parentTarget.teamCollection || 0) + amount
            parentTarget.totalCollection = parentTarget.personalCollection + parentTarget.teamCollection
            parentTarget.progressPercentage = (parentTarget.totalCollection / parentTarget.targetAmount) * 100

            if (parentTarget.status === 'PENDING') {
              parentTarget.status = 'IN_PROGRESS'
            }
            if (parentTarget.progressPercentage >= 100 && parentTarget.status !== 'COMPLETED') {
              parentTarget.status = 'COMPLETED'
            }

            await parentTarget.save()
          }

          const parentUser = await User.findById(currentParentId).select('parentCoordinatorId')
          currentParentId = parentUser?.parentCoordinatorId

          if (visited.size >= 20) break
        }
      }
    } catch (targetError) {
      console.error('Failed to update target collections:', targetError)
    }

    return NextResponse.json({
      success: true,
      message: 'Donation recorded successfully',
      data: {
        id: donation._id,
        donorName: donation.donorName,
        amount: donation.amount,
        programName: program.name,
        transactionId: donation.transactionId
      }
    })

  } catch (error) {
    console.error('Error recording manual donation:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to record donation',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
