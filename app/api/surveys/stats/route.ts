import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectToDatabase } from '@/lib/db'
import { Survey, SurveyType, SurveyStatus } from '@/models/Survey'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    // Get counts by type
    const [
      totalSurveys,
      hospitalSurveys,
      schoolSurveys,
      healthCampSurveys,
      communityWelfareSurveys,
      staffVolunteerSurveys,
      submittedSurveys,
      reviewedSurveys
    ] = await Promise.all([
      Survey.countDocuments(),
      Survey.countDocuments({ surveyType: SurveyType.HOSPITAL }),
      Survey.countDocuments({ surveyType: SurveyType.SCHOOL }),
      Survey.countDocuments({ surveyType: SurveyType.HEALTH_CAMP }),
      Survey.countDocuments({ surveyType: SurveyType.COMMUNITY_WELFARE }),
      Survey.countDocuments({ surveyType: SurveyType.STAFF_VOLUNTEER }),
      Survey.countDocuments({ status: SurveyStatus.SUBMITTED }),
      Survey.countDocuments({ status: SurveyStatus.REVIEWED })
    ])

    // Get recent surveys
    const recentSurveys = await Survey.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('submittedBy', 'name')
      .lean()

    return NextResponse.json({
      totalSurveys,
      byType: {
        hospital: hospitalSurveys,
        school: schoolSurveys,
        healthCamp: healthCampSurveys,
        communityWelfare: communityWelfareSurveys,
        staffVolunteer: staffVolunteerSurveys
      },
      byStatus: {
        submitted: submittedSurveys,
        reviewed: reviewedSurveys
      },
      recentSurveys
    })
  } catch (error) {
    console.error('Error fetching survey stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch survey stats' },
      { status: 500 }
    )
  }
}
