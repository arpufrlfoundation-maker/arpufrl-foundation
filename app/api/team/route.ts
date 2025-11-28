import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { User, UserRole } from '@/models/User'
import mongoose from 'mongoose'

/**
 * GET /api/team
 * Get team members for the about page (PUBLIC - no authentication required)
 */
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase()

    const { searchParams } = new URL(req.url)
    const parentId = searchParams.get('parentId')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100

    let query: any = {
      status: 'ACTIVE'
    }

    // If parentId is provided, get sub-coordinators (direct subordinates)
    if (parentId) {
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(parentId)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid parent ID format',
            message: 'The provided parentId is not a valid MongoDB ObjectId'
          },
          { status: 400 }
        )
      }

      // Find all users who have this parent as their coordinator
      query.parentCoordinatorId = new mongoose.Types.ObjectId(parentId)

      // Include all roles when fetching sub-coordinators (including volunteers)
      query.role = {
        $in: [
          UserRole.CENTRAL_PRESIDENT,
          UserRole.STATE_PRESIDENT,
          UserRole.STATE_COORDINATOR,
          UserRole.ZONE_COORDINATOR,
          UserRole.DISTRICT_PRESIDENT,
          UserRole.DISTRICT_COORDINATOR,
          UserRole.BLOCK_COORDINATOR,
          UserRole.NODAL_OFFICER,
          UserRole.PRERAK,
          UserRole.PRERNA_SAKHI,
          UserRole.VOLUNTEER
        ]
      }
    } else {
      // Get top-level coordinators (no parent) - exclude volunteers from top level
      query.role = {
        $in: [

          UserRole.CENTRAL_PRESIDENT,
          UserRole.STATE_PRESIDENT,
          UserRole.STATE_COORDINATOR,
          UserRole.ZONE_COORDINATOR,
          UserRole.DISTRICT_PRESIDENT,
          UserRole.DISTRICT_COORDINATOR,
          UserRole.BLOCK_COORDINATOR,
          UserRole.NODAL_OFFICER,
          UserRole.PRERAK,
          UserRole.PRERNA_SAKHI
        ]
      }
      query.$or = [
        { parentCoordinatorId: null },
        { parentCoordinatorId: { $exists: false } },
        { role: UserRole.CENTRAL_PRESIDENT },
      ]
    }

    const teamMembers = await User.find(query)
      .select('name email role state district block image profilePhoto referralCode totalDonationsReferred totalAmountReferred parentCoordinatorId')
      .sort({ role: 1, name: 1 })
      .limit(limit) // Use dynamic limit

    // Get subordinate counts for each member
    const membersWithCounts = await Promise.all(
      teamMembers.map(async (member) => {
        const subordinatesCount = await User.countDocuments({
          parentCoordinatorId: member._id,
          status: 'ACTIVE'
        })

        return {
          id: member._id.toString(),
          name: member.name,
          email: member.email,
          role: member.role,
          region: member.state || member.district || member.block || 'India',
          photoURL: member.profilePhoto || member.image,
          referralCode: member.referralCode,
          totalDonations: member.totalDonationsReferred || 0,
          totalAmount: member.totalAmountReferred || 0,
          subordinatesCount,
          hasSubordinates: subordinatesCount > 0
        }
      })
    )

    return NextResponse.json({
      success: true,
      members: membersWithCounts,
      total: membersWithCounts.length,
      parentId: parentId || null
    })

  } catch (error) {
    console.error('Error fetching team members:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch team members',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
