import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import { User, UserRole, UserStatus } from '@/models/User'
import { ReferralCode } from '@/models/ReferralCode'
import { Donation } from '@/models/Donation'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectToDatabase()

    // Get current user
    const user = await User.findById(session.user.id)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get team members (subordinates in hierarchy - users who have this user as parent coordinator)
    let teamMembers = await User.find({
      parentCoordinatorId: session.user.id,
      status: UserStatus.ACTIVE
    }).select('name email role state district zone block totalDonationsReferred totalAmountReferred referralCode phone createdAt').lean()

    // If no team members found, fetch STATE_PRESIDENT users as fallback
    if (teamMembers.length === 0) {
      teamMembers = await User.find({
        role: UserRole.STATE_PRESIDENT,
        status: UserStatus.ACTIVE
      }).select('name email role state district zone block totalDonationsReferred totalAmountReferred referralCode phone createdAt').lean()
    }

    // Get referral codes and donation details for each member
    const memberIds = teamMembers.map(m => m._id)
    
    // Fetch all referral codes for team members
    const referralCodes = await ReferralCode.find({
      ownerUserId: { $in: memberIds }
    }).select('ownerUserId code active totalDonations totalAmount').lean()

    // Create a map of userId to referral code info
    const referralCodeMap = new Map()
    referralCodes.forEach((rc: any) => {
      referralCodeMap.set(rc.ownerUserId.toString(), {
        code: rc.code,
        active: rc.active,
        totalDonations: rc.totalDonations || 0,
        totalAmount: rc.totalAmount || 0
      })
    })

    // Fetch recent donations for each member (top 5 per member)
    const donations = await Donation.aggregate([
      {
        $lookup: {
          from: 'referralcodes',
          localField: 'referralCodeId',
          foreignField: '_id',
          as: 'referralCode'
        }
      },
      {
        $match: {
          'referralCode.ownerUserId': { $in: memberIds },
          paymentStatus: 'SUCCESS'
        }
      },
      {
        $addFields: {
          ownerId: { $arrayElemAt: ['$referralCode.ownerUserId', 0] }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$ownerId',
          donations: {
            $push: {
              id: '$_id',
              donorName: '$donorName',
              amount: '$amount',
              createdAt: '$createdAt'
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          donations: { $slice: ['$donations', 5] }
        }
      }
    ])

    // Create a map of userId to recent donations
    const donationsMap = new Map()
    donations.forEach((d: any) => {
      donationsMap.set(d._id.toString(), d.donations)
    })

    return NextResponse.json({
      teamMembers: teamMembers.map(member => {
        const memberId = member._id.toString()
        const referralInfo = referralCodeMap.get(memberId)
        const recentDonations = donationsMap.get(memberId) || []

        return {
          id: memberId,
          name: member.name,
          email: member.email,
          phone: (member as any).phone,
          role: member.role,
          level: member.role, // For backward compatibility
          state: (member as any).state,
          district: (member as any).district,
          zone: (member as any).zone,
          block: (member as any).block,
          referralCode: referralInfo?.code || (member as any).referralCode || null,
          referralCodeActive: referralInfo?.active ?? true,
          totalDonations: referralInfo?.totalDonations || (member as any).totalDonationsReferred || 0,
          totalAmount: referralInfo?.totalAmount || (member as any).totalAmountReferred || 0,
          recentDonations: recentDonations.map((d: any) => ({
            id: d.id.toString(),
            donorName: d.donorName,
            amount: d.amount,
            date: d.createdAt
          })),
          joinedDate: (member as any).createdAt
        }
      })
    })
  } catch (error: any) {
    console.error('Error fetching team members:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
