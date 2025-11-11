import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'
import bcrypt from 'bcryptjs'

/**
 * GET /api/users/profile
 * Get current user's profile data
 */
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

    const user = await User.findById(session.user.id).select('-hashedPassword')

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        fatherName: user.fatherName,
        phone: user.phone,
        fatherPhone: user.fatherPhone,
        motherPhone: user.motherPhone,
        address: user.address,
        district: user.district,
        state: user.state,
        role: user.role,
        status: user.status,
        profilePhoto: user.profilePhoto,
        referralCode: user.referralCode,
        region: user.region,
        createdAt: user.createdAt
      }
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/users/profile
 * Update current user's profile data
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      name,
      fatherName,
      phone,
      fatherPhone,
      motherPhone,
      address,
      district,
      state,
      profilePhoto,
      currentPassword,
      newPassword
    } = body

    await connectToDatabase()

    const user = await User.findById(session.user.id)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password is required to change password' },
          { status: 400 }
        )
      }

      // Ensure hashedPassword exists
      if (!user.hashedPassword) {
        return NextResponse.json(
          { error: 'User password not found' },
          { status: 400 }
        )
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.hashedPassword)

      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        )
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12)
      user.hashedPassword = hashedPassword
    }

    // Update allowed fields
    if (name) user.name = name
    if (fatherName !== undefined) user.fatherName = fatherName
    if (phone !== undefined) user.phone = phone
    if (fatherPhone !== undefined) user.fatherPhone = fatherPhone
    if (motherPhone !== undefined) user.motherPhone = motherPhone
    if (address !== undefined) user.address = address
    if (district !== undefined) user.district = district
    if (state !== undefined) user.state = state
    if (profilePhoto !== undefined) user.profilePhoto = profilePhoto

    // Update region if state/district changed
    if (state && district) {
      user.region = `${district}, ${state}`
    }

    await user.save()

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        fatherName: user.fatherName,
        phone: user.phone,
        fatherPhone: user.fatherPhone,
        motherPhone: user.motherPhone,
        address: user.address,
        district: user.district,
        state: user.state,
        role: user.role,
        status: user.status,
        profilePhoto: user.profilePhoto,
        referralCode: user.referralCode,
        region: user.region
      }
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
