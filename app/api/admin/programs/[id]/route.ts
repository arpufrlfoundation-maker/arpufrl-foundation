import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../lib/auth'
import { connectToDatabase } from '../../../../../lib/db'
import { UserRole } from '../../../../../models/User'
import { Program } from '../../../../../models/Program'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and admin role
    const session = await auth()
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      )
    }

    await connectToDatabase()

    const { id } = await params
    const body = await request.json()

    // Validate the program ID
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { error: 'Invalid program ID' },
        { status: 400 }
      )
    }

    // Find the program
    const program = await Program.findById(id)
    if (!program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      )
    }

    // Validate update fields
    const allowedUpdates = [
      'name', 'description', 'longDescription', 'image', 'gallery',
      'targetAmount', 'raisedAmount', 'active', 'featured', 'priority',
      'metaTitle', 'metaDescription'
    ]
    const updates: any = {}

    for (const [key, value] of Object.entries(body)) {
      if (allowedUpdates.includes(key)) {
        if ((key === 'targetAmount' || key === 'raisedAmount') && value !== null && value !== undefined) {
          const amount = parseFloat(value as string)
          if (isNaN(amount) || amount < 0) {
            return NextResponse.json(
              { error: `${key === 'targetAmount' ? 'Target' : 'Raised'} amount must be a valid positive number` },
              { status: 400 }
            )
          }
          updates[key] = amount
        } else if (key === 'priority' && value !== null && value !== undefined) {
          const priority = parseInt(value as string)
          if (isNaN(priority)) {
            return NextResponse.json(
              { error: 'Priority must be a valid number' },
              { status: 400 }
            )
          }
          updates[key] = priority
        } else if (key === 'active' || key === 'featured') {
          updates[key] = Boolean(value)
        } else {
          updates[key] = value
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // If updating name, regenerate slug if not provided
    if (updates.name && !body.slug) {
      const newSlug = updates.name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-')

      // Check if new slug is unique (excluding current program)
      const existingProgram = await Program.findOne({
        slug: newSlug,
        _id: { $ne: id }
      })

      if (existingProgram) {
        return NextResponse.json(
          { error: 'A program with this name already exists' },
          { status: 400 }
        )
      }

      updates.slug = newSlug
    }

    // Update the program
    const updatedProgram = await Program.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )

    if (!updatedProgram) {
      return NextResponse.json(
        { error: 'Program not found after update' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Program updated successfully',
      program: {
        id: updatedProgram._id.toString(),
        name: updatedProgram.name,
        slug: updatedProgram.slug,
        description: updatedProgram.description,
        active: updatedProgram.active,
        featured: updatedProgram.featured,
        targetAmount: updatedProgram.targetAmount,
        raisedAmount: updatedProgram.raisedAmount,
        createdAt: updatedProgram.createdAt.toISOString(),
        updatedAt: updatedProgram.updatedAt.toISOString()
      }
    })

  } catch (error) {
    console.error('Update program error:', error)
    return NextResponse.json(
      { error: 'Failed to update program' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and admin role
    const session = await auth()
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      )
    }

    await connectToDatabase()

    const { id } = await params

    // Validate the program ID
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { error: 'Invalid program ID' },
        { status: 400 }
      )
    }

    // Find the program
    const program = await Program.findById(id)
    if (!program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      )
    }

    // Check if program has donations
    if (program.donationCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete program with existing donations. Please deactivate it instead.' },
        { status: 400 }
      )
    }

    // Delete the program
    await Program.findByIdAndDelete(id)

    return NextResponse.json({
      message: 'Program deleted successfully'
    })

  } catch (error) {
    console.error('Delete program error:', error)
    return NextResponse.json(
      { error: 'Failed to delete program' },
      { status: 500 }
    )
  }
}