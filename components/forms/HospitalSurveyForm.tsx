'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

interface HospitalSurveyData {
  // सामान्य जानकारी (General Information)
  hospitalName: string
  address: string
  contactNumber: string
  email: string

  // अस्पताल का प्रकार (Types of Hospital)
  hospitalType: string // सरकारी, निजी, ट्रस्ट (NGO) आधारित
  totalBeds: string
  icuBeds: string
  doctorCount: string
  nursingStaffCount: string

  // चिकित्सा सुविधायें (Medical Facilities)
  has24HourService: 'हाँ' | 'नहीं' | ''
  hasAmbulance: 'हाँ' | 'नहीं' | ''
  facilities: string[] // ब्लड टेस्ट, एक्स रे, अल्ट्रासाउण्ड, ई.सी.जी., ऑपरेशन थियटर, ब्लड बैंक

  // औसतन प्रतिदिन कितने मरीज आते हैं?
  dailyPatientCount: string

  // मरीज संतुष्टि (Patient Satisfaction)
  serviceQuality: string // बहुत अच्छी, अच्छी, सामान्य, कमजोर
  cleanlinessStatus: string // बहुत अच्छी, अच्छी, सामान्य, खराब
  staffBehavior: string // सहायक, सामान्य, असहयोगी

  // गरीब मरीजों के लिए
  hasFreeOrDiscountedTreatment: 'हाँ' | 'नहीं' | ''

  // सुझाव
  improvementSuggestion: string
  wantsToJoinARPUHealth: 'हाँ' | 'नहीं' | ''

  // सर्वे लेने वाले की जानकारी
  surveyOfficerName: string
  designation: string
  surveyDate: string
}

export default function HospitalSurveyForm() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState<HospitalSurveyData>({
    hospitalName: '',
    address: '',
    contactNumber: '',
    email: '',
    hospitalType: '',
    totalBeds: '',
    icuBeds: '',
    doctorCount: '',
    nursingStaffCount: '',
    has24HourService: '',
    hasAmbulance: '',
    facilities: [],
    dailyPatientCount: '',
    serviceQuality: '',
    cleanlinessStatus: '',
    staffBehavior: '',
    hasFreeOrDiscountedTreatment: '',
    improvementSuggestion: '',
    wantsToJoinARPUHealth: '',
    surveyOfficerName: '',
    designation: '',
    surveyDate: new Date().toISOString().split('T')[0]
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (value: string) => {
    setFormData(prev => {
      const currentValues = prev.facilities
      if (currentValues.includes(value)) {
        return { ...prev, facilities: currentValues.filter(v => v !== value) }
      } else {
        return { ...prev, facilities: [...currentValues, value] }
      }
    })
  }

  const handleRadioChange = (field: keyof HospitalSurveyData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyType: 'HOSPITAL',
          data: formData,
          location: formData.address || formData.hospitalName,
          district: 'Not Specified',
          state: 'Not Specified',
          surveyorName: formData.surveyOfficerName || session?.user?.name || 'Anonymous',
          surveyorContact: formData.contactNumber,
          surveyDate: formData.surveyDate
        })
      })

      const result = await response.json()

      if (!response.ok) {
        // Show detailed error message from API
        const errorMessage = result.details || result.error || 'Failed to submit survey'
        throw new Error(errorMessage)
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'सर्वे जमा करने में विफल। कृपया पुनः प्रयास करें।')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-green-800 mb-4">धन्यवाद!</h2>
          <p className="text-green-700">आपके द्वारा दी गई जानकारी स्वास्थ्य सेवाओं के सुधार में सहायक होगी।</p>
          <p className="text-green-700 mt-2 font-semibold">ARPU Future Rise Life Foundation</p>
          <p className="text-green-600 text-sm">स्वास्थ्य समाज, समृद्ध भारत।</p>
          <button
            onClick={() => {
              setSuccess(false)
              window.location.reload()
            }}
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            नया सर्वे करें
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto bg-white">
      {/* Header */}
      <div className="border-2 border-black p-4">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 flex-shrink-0">
            <img src="/pic/logo.png" alt="ARPU Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold text-gray-900">ARPU Future Rise Life Foundation</h1>
            <div className="mt-2 inline-block border border-gray-800 px-4 py-1 rounded">
              <span className="text-lg font-semibold">हॉस्पिटल सर्वे फॉर्म</span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="border-2 border-t-0 border-black p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* उद्देश्य */}
        <div className="text-center">
          <h2 className="font-bold text-lg underline">उद्देश्य:-</h2>
          <p className="text-sm text-gray-700 mt-2">
            जनहित में चिकित्सा सुविधाओं, डॉक्टरों, स्टॉफ और मरीजों की स्थिति का मूल्यांकन
            करना ताकि स्वास्थ्य सेवाओं में सुधार किया जा सकें।
          </p>
        </div>

        {/* सामान्य जानकारी Section */}
        <div>
          <h2 className="font-bold text-lg mb-4 underline">सामान्य जानकारी (General Information)</h2>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="w-48">अस्पताल का नाम (Hospital Name)</label>
              <input
                type="text"
                name="hospitalName"
                value={formData.hospitalName}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="w-48">पता (Address)</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="w-48">सम्पर्क नम्बर (Con. Number)</label>
              <input
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="w-48">ईमेल (Email)</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>
          </div>
        </div>

        {/* अस्पताल का प्रकार Section */}
        <div>
          <h2 className="font-bold text-lg mb-4 underline">अस्पताल का प्रकार (Types of Hospital)</h2>

          <div className="space-y-3">
            <div className="flex items-center gap-4 flex-wrap">
              {['सरकारी (Goverment)', 'निजी (Private)', 'ट्रस्ट (NGO) आधारित'].map((type) => (
                <label key={type} className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="hospitalType"
                    checked={formData.hospitalType === type}
                    onChange={() => handleRadioChange('hospitalType', type)}
                  />
                  {type}
                </label>
              ))}
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label className="w-48">कुल बेड की संख्या (Total Beds)</label>
              <input
                type="text"
                name="totalBeds"
                value={formData.totalBeds}
                onChange={handleInputChange}
                className="w-24 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="w-48">(ICU) बेड की संख्या (ICU Beds)</label>
              <input
                type="text"
                name="icuBeds"
                value={formData.icuBeds}
                onChange={handleInputChange}
                className="w-24 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="w-48">डॉक्टरों की संख्या (No. of Doctor)</label>
              <input
                type="text"
                name="doctorCount"
                value={formData.doctorCount}
                onChange={handleInputChange}
                className="w-24 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="w-48">नर्सिंग स्टाफ की संख्या (Nursing Staff)</label>
              <input
                type="text"
                name="nursingStaffCount"
                value={formData.nursingStaffCount}
                onChange={handleInputChange}
                className="w-24 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>
          </div>
        </div>

        {/* चिकित्सा सुविधायें Section */}
        <div>
          <h2 className="font-bold text-lg mb-4 underline">चिकित्सा सुविधायें (Medical Facilities)</h2>

          <div className="space-y-3">
            <div className="flex items-center gap-4 flex-wrap">
              <label>क्या 24 घंटे आपातकालीन सेवा उपलब्ध है?</label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="has24HourService"
                  checked={formData.has24HourService === 'हाँ'}
                  onChange={() => handleRadioChange('has24HourService', 'हाँ')}
                />
                हाँ
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="has24HourService"
                  checked={formData.has24HourService === 'नहीं'}
                  onChange={() => handleRadioChange('has24HourService', 'नहीं')}
                />
                नहीं
              </label>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label>क्या एम्बुलेंस सेवा उपलब्ध है?</label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="hasAmbulance"
                  checked={formData.hasAmbulance === 'हाँ'}
                  onChange={() => handleRadioChange('hasAmbulance', 'हाँ')}
                />
                हाँ
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="hasAmbulance"
                  checked={formData.hasAmbulance === 'नहीं'}
                  onChange={() => handleRadioChange('hasAmbulance', 'नहीं')}
                />
                नहीं
              </label>
            </div>

            <div>
              <label className="block mb-2">क्या निम्नलिखित सुविधायें है?</label>
              <div className="flex items-center gap-4 flex-wrap ml-4">
                {['ब्लड टेस्ट', 'एक्स रे', 'अल्ट्रासाउण्ड', 'ई.सी.जी.', 'ऑपरेशन थियटर', 'ब्लड बैंक'].map((facility) => (
                  <label key={facility} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={formData.facilities.includes(facility)}
                      onChange={() => handleCheckboxChange(facility)}
                    />
                    {facility}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="w-64">औसतन प्रतिदिन कितने मरीज आते हैं?</label>
              <input
                type="text"
                name="dailyPatientCount"
                value={formData.dailyPatientCount}
                onChange={handleInputChange}
                className="w-32 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>
          </div>
        </div>

        {/* मरीज संतुष्टि Section */}
        <div>
          <h2 className="font-bold text-lg mb-4 underline">मरीज संतुष्टि</h2>

          <div className="space-y-3">
            <div className="flex items-center gap-4 flex-wrap">
              <label className="w-64">मरीजों को मिलने वाली सेवा की गुणवत्ता?</label>
              {['बहुत अच्छी', 'अच्छी', 'सामान्य', 'कमजोर'].map((quality) => (
                <label key={quality} className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="serviceQuality"
                    checked={formData.serviceQuality === quality}
                    onChange={() => handleRadioChange('serviceQuality', quality)}
                  />
                  {quality}
                </label>
              ))}
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label className="w-64">साफ-सफाई की स्थिति?</label>
              {['बहुत अच्छी', 'अच्छी', 'सामान्य', 'खराब'].map((status) => (
                <label key={status} className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="cleanlinessStatus"
                    checked={formData.cleanlinessStatus === status}
                    onChange={() => handleRadioChange('cleanlinessStatus', status)}
                  />
                  {status}
                </label>
              ))}
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label className="w-64">स्टाफ का व्यवहार?</label>
              {['सहायक', 'सामान्य', 'असहयोगी'].map((behavior) => (
                <label key={behavior} className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="staffBehavior"
                    checked={formData.staffBehavior === behavior}
                    onChange={() => handleRadioChange('staffBehavior', behavior)}
                  />
                  {behavior}
                </label>
              ))}
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label className="flex-1">क्या अस्पताल में गरीब मरीजों के लिए निःशुल्क या रियायती इलाज होता है?</label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="hasFreeOrDiscountedTreatment"
                  checked={formData.hasFreeOrDiscountedTreatment === 'हाँ'}
                  onChange={() => handleRadioChange('hasFreeOrDiscountedTreatment', 'हाँ')}
                />
                हाँ
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="hasFreeOrDiscountedTreatment"
                  checked={formData.hasFreeOrDiscountedTreatment === 'नहीं'}
                  onChange={() => handleRadioChange('hasFreeOrDiscountedTreatment', 'नहीं')}
                />
                नहीं
              </label>
            </div>
          </div>
        </div>

        {/* सुझाव Section */}
        <div>
          <h2 className="font-bold text-lg mb-4 underline">सुझाव -</h2>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="w-48">सुधार के लिए आपके सुझाव</label>
              <input
                type="text"
                name="improvementSuggestion"
                value={formData.improvementSuggestion}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label>क्या आप (ARPU Foundation) के भविष्य के हेल्थ प्रोजेक्ट्स से जुड़ना चाहेंगे?</label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="wantsToJoinARPUHealth"
                  checked={formData.wantsToJoinARPUHealth === 'हाँ'}
                  onChange={() => handleRadioChange('wantsToJoinARPUHealth', 'हाँ')}
                />
                हाँ
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="wantsToJoinARPUHealth"
                  checked={formData.wantsToJoinARPUHealth === 'नहीं'}
                  onChange={() => handleRadioChange('wantsToJoinARPUHealth', 'नहीं')}
                />
                नहीं
              </label>
            </div>
          </div>
        </div>

        {/* सर्वे लेने वाले की जानकारी */}
        <div>
          <h2 className="font-bold text-lg mb-4 underline">सर्वे लेने वाले की जानकारी-</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <label className="w-40">सर्वे अधिकारी का नाम</label>
              <input
                type="text"
                name="surveyOfficerName"
                value={formData.surveyOfficerName}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-24">पद</label>
              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>
            <div className="flex items-center gap-2 col-span-2">
              <label className="w-40">सर्वे की तिथि</label>
              <input
                type="date"
                name="surveyDate"
                value={formData.surveyDate}
                onChange={handleInputChange}
                className="w-48 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>
          </div>
        </div>

        {/* Thank you message */}
        <div className="text-center pt-4 border-t border-gray-300">
          <p className="font-bold text-gray-800">धन्यवाद।</p>
          <p className="text-sm text-gray-600 mt-1">आपके द्वारा दी गई जानकारी स्वास्थ्य सेवाओं के सुधार में सहायक होगी।</p>
          <p className="text-sm font-semibold text-gray-700 mt-2">ARPU Future Rise Life Foundation</p>
          <p className="text-sm text-gray-600">स्वास्थ्य समाज, समृद्ध भारत।</p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'जमा हो रहा है...' : 'सर्वे जमा करें'}
          </button>
        </div>
      </form>
    </div>
  )
}
