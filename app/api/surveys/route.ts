import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import { Survey, SurveyType, SurveyStatus } from '@/models/Survey'
import { UserRole } from '@/models/User'

// GET - Fetch all surveys
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''

    // Build filter
    const filter: any = {}
    if (type) filter.surveyType = type
    if (status) filter.status = status
    if (search) {
      filter.$or = [
        { location: { $regex: search, $options: 'i' } },
        { district: { $regex: search, $options: 'i' } },
        { surveyorName: { $regex: search, $options: 'i' } }
      ]
    }

    const skip = (page - 1) * limit

    const [surveys, totalCount] = await Promise.all([
      Survey.find(filter)
        .populate('submittedBy', 'name email')
        .populate('reviewedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Survey.countDocuments(filter)
    ])

    return NextResponse.json({
      surveys,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasMore: skip + surveys.length < totalCount
      }
    })
  } catch (error) {
    console.error('Error fetching surveys:', error)
    return NextResponse.json(
      { error: 'Failed to fetch surveys' },
      { status: 500 }
    )
  }
}

// POST - Create new survey (public or authenticated)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    // Allow public submissions (no authentication required)

    await connectToDatabase()

    const body = await request.json()
    const {
      surveyType,
      location,
      district,
      state,
      surveyorName,
      surveyorPhone,
      surveyorEmail,
      surveyorContact,
      surveyDate,
      data,
      status
    } = body

    // Validate required fields with detailed error messages
    const missingFields: string[] = []
    if (!surveyType) missingFields.push('surveyType')
    if (!location) missingFields.push('location')
    if (!surveyorName) missingFields.push('surveyorName')

    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          details: `Please provide: ${missingFields.join(', ')}`,
          missingFields 
        },
        { status: 400 }
      )
    }

    // Validate survey type
    if (!Object.values(SurveyType).includes(surveyType)) {
      return NextResponse.json(
        { 
          error: 'Invalid survey type',
          details: `Survey type '${surveyType}' is not valid. Valid types are: ${Object.values(SurveyType).join(', ')}`
        },
        { status: 400 }
      )
    }

    const surveyData: any = {
      surveyType,
      location,
      district: district || 'Not Specified',
      state: state || 'Not Specified',
      surveyorName,
      surveyorContact: surveyorPhone || surveyorContact || '',
      surveyDate: surveyDate ? new Date(surveyDate) : new Date(),
      data: data || {},
      status: status || SurveyStatus.SUBMITTED
    }

    // Add submittedBy if user is authenticated
    if (session?.user?.id) {
      surveyData.submittedBy = session.user.id
    }

    const survey = await Survey.create(surveyData)

    return NextResponse.json({
      success: true,
      message: 'Survey submitted successfully',
      survey
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating survey:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create survey',
        details: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    )
  }
}
