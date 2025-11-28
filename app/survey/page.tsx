'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ClipboardList, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import BusinessSurveyForm from '@/components/forms/BusinessSurveyForm'
import CitizenSurveyForm from '@/components/forms/CitizenSurveyForm'
import HospitalSurveyForm from '@/components/forms/HospitalSurveyForm'
import SchoolSurveyForm from '@/components/forms/SchoolSurveyForm'
import PoliticalAnalysisSurveyForm from '@/components/forms/PoliticalAnalysisSurveyForm'

interface SurveyFormData {
  surveyType: string
  location: string
  district: string
  state: string
  surveyorName: string
  surveyorPhone: string
  surveyorEmail: string
  data: Record<string, any>
}

export default function PublicSurveyPage() {
  const [surveyType, setSurveyType] = useState<string>('')
  const [formData, setFormData] = useState<SurveyFormData>({
    surveyType: '',
    location: '',
    district: '',
    state: '',
    surveyorName: '',
    surveyorPhone: '',
    surveyorEmail: '',
    data: {}
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const surveyTypes = [
    { value: 'HOSPITAL', label: 'Hospital Survey / अस्पताल सर्वे', icon: '🏥', hasCustomForm: true },
    { value: 'SCHOOL', label: 'School Survey / स्कूल सर्वे', icon: '🏫', hasCustomForm: true },
    { value: 'BUSINESS', label: 'Business Survey / व्यापार सर्वे', icon: '🏢', hasCustomForm: true },
    { value: 'CITIZEN', label: 'Citizen Survey / नागरिक सर्वे', icon: '👨‍👩‍👧‍👦', hasCustomForm: true },
    { value: 'POLITICAL_ANALYSIS', label: 'Political Analysis / राजनीतिक विश्लेषण', icon: '🗳️', hasCustomForm: true },
    { value: 'HEALTH_CAMP', label: 'Health Camp / स्वास्थ्य शिविर', icon: '⛑️', hasCustomForm: false },
    { value: 'COMMUNITY_WELFARE', label: 'Community Welfare / सामुदायिक कल्याण', icon: '🤝', hasCustomForm: false },
    { value: 'STAFF_VOLUNTEER', label: 'Staff & Volunteer / कर्मचारी और स्वयंसेवक', icon: '👥', hasCustomForm: false }
  ]

  // Render custom form based on survey type
  const renderCustomForm = () => {
    switch (surveyType) {
      case 'HOSPITAL':
        return <HospitalSurveyForm />
      case 'SCHOOL':
        return <SchoolSurveyForm />
      case 'BUSINESS':
        return <BusinessSurveyForm />
      case 'CITIZEN':
        return <CitizenSurveyForm />
      case 'POLITICAL_ANALYSIS':
        return <PoliticalAnalysisSurveyForm />
      default:
        return null
    }
  }

  const hasCustomForm = surveyTypes.find(t => t.value === surveyType)?.hasCustomForm

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/surveys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          surveyType: surveyType,
          status: 'SUBMITTED'
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit survey')
      }

      setSubmitted(true)
      // Reset form
      setFormData({
        surveyType: '',
        location: '',
        district: '',
        state: '',
        surveyorName: '',
        surveyorPhone: '',
        surveyorEmail: '',
        data: {}
      })
      setSurveyType('')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to submit survey')
    } finally {
      setSubmitting(false)
    }
  }

  const updateSurveyData = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [key]: value
      }
    }))
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Survey Submitted Successfully!
          </h2>
          <p className="text-gray-600 mb-2">
            सर्वेक्षण सफलतापूर्वक जमा किया गया!
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Thank you for your valuable feedback. Our team will review your submission.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => setSubmitted(false)} className="w-full">
              Submit Another Survey
            </Button>
            <Link href="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Field Survey Form
                </h1>
                <p className="text-sm text-gray-600">
                  क्षेत्र सर्वेक्षण फॉर्म
                </p>
              </div>
            </div>
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Home
              </Button>
            </Link>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {!surveyType ? (
            /* Survey Type Selection */
            <div>
              <p className="text-gray-700 mb-6">
                Please select the type of survey you want to fill:
                <br />
                <span className="text-sm text-gray-600">
                  कृपया वह सर्वेक्षण प्रकार चुनें जिसे आप भरना चाहते हैं:
                </span>
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {surveyTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setSurveyType(type.value)}
                    className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                  >
                    <div className="text-4xl mb-3">{type.icon}</div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {type.label}
                    </h3>
                    {type.hasCustomForm && (
                      <p className="text-xs text-green-600 mt-2">✓ Hindi Form Available</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : hasCustomForm ? (
            /* Custom Hindi Survey Form */
            <div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">
                    {surveyTypes.find(t => t.value === surveyType)?.icon}
                  </span>
                  <div>
                    <p className="font-semibold text-blue-900">
                      {surveyTypes.find(t => t.value === surveyType)?.label}
                    </p>
                    <p className="text-sm text-blue-700">Hindi Survey Form / हिंदी सर्वे फॉर्म</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSurveyType('')}
                >
                  Change / बदलें
                </Button>
              </div>
              {renderCustomForm()}
            </div>
          ) : (
            /* Survey Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">
                    {surveyTypes.find(t => t.value === surveyType)?.icon}
                  </span>
                  <div>
                    <p className="font-semibold text-blue-900">
                      {surveyTypes.find(t => t.value === surveyType)?.label}
                    </p>
                    <p className="text-sm text-blue-700">Selected survey type</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSurveyType('')}
                >
                  Change
                </Button>
              </div>

              {/* Surveyor Information */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Your Information / आपकी जानकारी
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Your Name / आपका नाम *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.surveyorName}
                      onChange={(e) => setFormData(prev => ({ ...prev, surveyorName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone / फोन *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.surveyorPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, surveyorPhone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email (Optional) / ईमेल (वैकल्पिक)
                    </label>
                    <input
                      type="email"
                      value={formData.surveyorEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, surveyorEmail: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter email address"
                    />
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Location Details / स्थान विवरण
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State / राज्य *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.state}
                      onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter state"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      District / जिला *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.district}
                      onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter district"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location / स्थान *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Village/Town/City"
                    />
                  </div>
                </div>
              </div>

              {/* Survey-specific fields */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Survey Details / सर्वेक्षण विवरण
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Feedback / Observations / प्रतिक्रिया / अवलोकन *
                    </label>
                    <textarea
                      required
                      rows={6}
                      value={formData.data.feedback || ''}
                      onChange={(e) => updateSurveyData('feedback', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Please provide detailed feedback and observations..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Challenges / Issues Identified / पहचानी गई चुनौतियां *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.data.challenges || ''}
                      onChange={(e) => updateSurveyData('challenges', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="List any challenges or issues observed..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recommendations / सिफारिशें
                    </label>
                    <textarea
                      rows={4}
                      value={formData.data.recommendations || ''}
                      onChange={(e) => updateSurveyData('recommendations', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your recommendations for improvement..."
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSurveyType('')}
                  className="flex-1"
                  disabled={submitting}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Submitting...
                    </>
                  ) : (
                    'Submit Survey'
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
