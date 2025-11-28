'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

interface BusinessSurveyData {
  // मूल जानकारी (Basic Information)
  businessOwnerName: string
  fatherOrHusbandName: string
  gender: 'पुरुष' | 'महिला' | 'अन्य' | ''
  age: string
  dob: string
  mobile: string
  email: string
  fullAddress: string

  // व्यवसाय से जुड़ी जानकारी (Business Information)
  businessType: string[] // दुकान, सेवा, निर्माण, कृषि आधारित, अन्य
  otherBusinessType: string
  businessAddress: string
  establishmentYear: string
  isRegistered: 'हाँ' | 'नहीं' | ''
  monthlyIncome: string
  employeeCount: string
  businessTiming: string

  // सुविधायें एवं चुनौतियाँ (Facilities and Challenges)
  hasGovtBenefit: 'हाँ' | 'नहीं' | ''
  whichScheme: string
  mainProblems: string[] // पूँजी की कमी, मार्केट की कमी, बिजली/पानी की समस्या, टैक्स/लाइसेंस समस्या, अन्य
  otherProblem: string
  usesDigitalPayment: 'हाँ' | 'नहीं' | ''
  wantsToExpand: 'हाँ' | 'नहीं' | ''
  expansionType: string

  // सुझाव/आवश्यकता
  suggestion: string

  // सर्वे करने वाले की जानकारी (Surveyor Information)
  organizationName: string
  surveyorSignature: string
  surveyDate: string
}

export default function BusinessSurveyForm() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState<BusinessSurveyData>({
    businessOwnerName: '',
    fatherOrHusbandName: '',
    gender: '',
    age: '',
    dob: '',
    mobile: '',
    email: '',
    fullAddress: '',
    businessType: [],
    otherBusinessType: '',
    businessAddress: '',
    establishmentYear: '',
    isRegistered: '',
    monthlyIncome: '',
    employeeCount: '',
    businessTiming: '',
    hasGovtBenefit: '',
    whichScheme: '',
    mainProblems: [],
    otherProblem: '',
    usesDigitalPayment: '',
    wantsToExpand: '',
    expansionType: '',
    suggestion: '',
    organizationName: '',
    surveyorSignature: '',
    surveyDate: new Date().toISOString().split('T')[0]
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (field: 'businessType' | 'mainProblems', value: string) => {
    setFormData(prev => {
      const currentValues = prev[field]
      if (currentValues.includes(value)) {
        return { ...prev, [field]: currentValues.filter(v => v !== value) }
      } else {
        return { ...prev, [field]: [...currentValues, value] }
      }
    })
  }

  const handleRadioChange = (field: keyof BusinessSurveyData, value: string) => {
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
          surveyType: 'BUSINESS',
          data: formData,
          location: formData.fullAddress,
          district: '',
          state: '',
          surveyorName: session?.user?.name || 'Anonymous',
          surveyorContact: formData.mobile,
          surveyDate: formData.surveyDate
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit survey')
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to submit survey')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-green-800 mb-4">धन्यवाद!</h2>
          <p className="text-green-700">आपका सर्वे सफलतापूर्वक जमा हो गया है।</p>
          <button
            onClick={() => {
              setSuccess(false)
              setFormData({
                businessOwnerName: '',
                fatherOrHusbandName: '',
                gender: '',
                age: '',
                dob: '',
                mobile: '',
                email: '',
                fullAddress: '',
                businessType: [],
                otherBusinessType: '',
                businessAddress: '',
                establishmentYear: '',
                isRegistered: '',
                monthlyIncome: '',
                employeeCount: '',
                businessTiming: '',
                hasGovtBenefit: '',
                whichScheme: '',
                mainProblems: [],
                otherProblem: '',
                usesDigitalPayment: '',
                wantsToExpand: '',
                expansionType: '',
                suggestion: '',
                organizationName: '',
                surveyorSignature: '',
                surveyDate: new Date().toISOString().split('T')[0]
              })
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
              <span className="text-lg font-semibold">व्यवसाई सर्वे फॉर्म</span>
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

        {/* मूल जानकारी Section */}
        <div>
          <h2 className="text-center font-bold text-lg mb-4 underline">मूल जानकारी:-</h2>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="w-40">व्यवसायी का नाम</label>
              <input
                type="text"
                name="businessOwnerName"
                value={formData.businessOwnerName}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="w-40">पिता/पति का नाम</label>
              <input
                type="text"
                name="fatherOrHusbandName"
                value={formData.fatherOrHusbandName}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label className="w-20">लिंग</label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="gender"
                  checked={formData.gender === 'पुरुष'}
                  onChange={() => handleRadioChange('gender', 'पुरुष')}
                />
                पुरुष
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="gender"
                  checked={formData.gender === 'महिला'}
                  onChange={() => handleRadioChange('gender', 'महिला')}
                />
                महिला
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="gender"
                  checked={formData.gender === 'अन्य'}
                  onChange={() => handleRadioChange('gender', 'अन्य')}
                />
                अन्य
              </label>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label className="w-20">आयु</label>
              <input
                type="text"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                className="w-20 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
                placeholder="वर्ष"
              />
              <label className="ml-4">जन्मतिथि-</label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleInputChange}
                className="border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label className="w-20">मो0-</label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleInputChange}
                className="w-40 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
                required
              />
              <label className="ml-4">ईमेल (यदि हो)</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="w-24">पूरा पता</label>
              <input
                type="text"
                name="fullAddress"
                value={formData.fullAddress}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
                required
              />
            </div>
          </div>
        </div>

        {/* व्यवसाय से जुड़ी जानकारी Section */}
        <div>
          <h2 className="text-center font-bold text-lg mb-4 underline">व्यवसाय से जुड़ी जानकारी</h2>

          <div className="space-y-3">
            <div className="flex items-center gap-4 flex-wrap">
              <label>व्यवसाय का प्रकार-</label>
              {['दुकान', 'सेवा', 'निर्माण', 'कृषि आधारित', 'अन्य'].map((type) => (
                <label key={type} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={formData.businessType.includes(type)}
                    onChange={() => handleCheckboxChange('businessType', type)}
                  />
                  {type}
                </label>
              ))}
            </div>

            {formData.businessType.includes('अन्य') && (
              <div className="flex items-center gap-2 ml-8">
                <label>अन्य:</label>
                <input
                  type="text"
                  name="otherBusinessType"
                  value={formData.otherBusinessType}
                  onChange={handleInputChange}
                  className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <label className="w-40">व्यवसाय का पूरा पता</label>
              <input
                type="text"
                name="businessAddress"
                value={formData.businessAddress}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label>व्यवसाय की स्थापना वर्ष</label>
              <input
                type="text"
                name="establishmentYear"
                value={formData.establishmentYear}
                onChange={handleInputChange}
                className="w-24 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
              <label className="ml-4">व्यवसाय का पंजीकरण:-</label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="isRegistered"
                  checked={formData.isRegistered === 'हाँ'}
                  onChange={() => handleRadioChange('isRegistered', 'हाँ')}
                />
                हाँ
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="isRegistered"
                  checked={formData.isRegistered === 'नहीं'}
                  onChange={() => handleRadioChange('isRegistered', 'नहीं')}
                />
                नहीं
              </label>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label>मासिक आय (अनुमानित):- रूपये</label>
              <input
                type="text"
                name="monthlyIncome"
                value={formData.monthlyIncome}
                onChange={handleInputChange}
                className="w-32 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
              <label className="ml-4">व्यवसाय में कर्मचारी संख्या:</label>
              <input
                type="text"
                name="employeeCount"
                value={formData.employeeCount}
                onChange={handleInputChange}
                className="w-20 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>

            <div className="flex items-center gap-2">
              <label>व्यवसाय का समय</label>
              <input
                type="text"
                name="businessTiming"
                value={formData.businessTiming}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>
          </div>
        </div>

        {/* सुविधायें एवं चुनौतियाँ Section */}
        <div>
          <h2 className="text-center font-bold text-lg mb-4 underline">सुविधायें एवं चुनौतियाँ</h2>

          <div className="space-y-3">
            <div className="flex items-center gap-4 flex-wrap">
              <label>क्या आपको सरकार की किसी योजना का लाभ मिला है?</label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="hasGovtBenefit"
                  checked={formData.hasGovtBenefit === 'हाँ'}
                  onChange={() => handleRadioChange('hasGovtBenefit', 'हाँ')}
                />
                हाँ
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="hasGovtBenefit"
                  checked={formData.hasGovtBenefit === 'नहीं'}
                  onChange={() => handleRadioChange('hasGovtBenefit', 'नहीं')}
                />
                नहीं
              </label>
            </div>

            {formData.hasGovtBenefit === 'हाँ' && (
              <div className="flex items-center gap-2 ml-8">
                <label>यदि हाँ, कौन सी योजना</label>
                <input
                  type="text"
                  name="whichScheme"
                  value={formData.whichScheme}
                  onChange={handleInputChange}
                  className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
                />
              </div>
            )}

            <div>
              <label className="block mb-2">आपके व्यवसाय की मुख्य समस्या क्या है?</label>
              <div className="flex items-center gap-4 flex-wrap ml-4">
                {['पूँजी की कमी', 'मार्केट की कमी', 'बिजली/पानी की समस्या', 'टैक्स/लाइसेंस समस्या', 'अन्य'].map((problem) => (
                  <label key={problem} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={formData.mainProblems.includes(problem)}
                      onChange={() => handleCheckboxChange('mainProblems', problem)}
                    />
                    {problem}
                  </label>
                ))}
              </div>
            </div>

            {formData.mainProblems.includes('अन्य') && (
              <div className="flex items-center gap-2 ml-8">
                <label>अन्य:</label>
                <input
                  type="text"
                  name="otherProblem"
                  value={formData.otherProblem}
                  onChange={handleInputChange}
                  className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
                />
              </div>
            )}

            <div className="flex items-center gap-4 flex-wrap">
              <label>क्या आप डिजिटल पेमेंट (UPI/QR/Online) का उपयोग करते है?</label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="usesDigitalPayment"
                  checked={formData.usesDigitalPayment === 'हाँ'}
                  onChange={() => handleRadioChange('usesDigitalPayment', 'हाँ')}
                />
                हाँ
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="usesDigitalPayment"
                  checked={formData.usesDigitalPayment === 'नहीं'}
                  onChange={() => handleRadioChange('usesDigitalPayment', 'नहीं')}
                />
                नहीं
              </label>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label>क्या आप व्यवसाय विस्तार चाहते है?</label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="wantsToExpand"
                  checked={formData.wantsToExpand === 'हाँ'}
                  onChange={() => handleRadioChange('wantsToExpand', 'हाँ')}
                />
                हाँ
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="wantsToExpand"
                  checked={formData.wantsToExpand === 'नहीं'}
                  onChange={() => handleRadioChange('wantsToExpand', 'नहीं')}
                />
                नहीं
              </label>
              {formData.wantsToExpand === 'हाँ' && (
                <>
                  <label>यदि हाँ, किस रूप में</label>
                  <input
                    type="text"
                    name="expansionType"
                    value={formData.expansionType}
                    onChange={handleInputChange}
                    className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* सुझाव/आवश्यकता Section */}
        <div>
          <h2 className="text-center font-bold text-lg mb-4 underline">सुझाव/आवश्यकता</h2>
          <div className="space-y-3">
            <div>
              <label className="block mb-2">आपके अनुसार छोटे व्यवसाय को आगे बढ़ाने के लिए क्या किया जाना चाहिए?</label>
              <textarea
                name="suggestion"
                value={formData.suggestion}
                onChange={handleInputChange}
                rows={3}
                className="w-full border border-gray-400 focus:border-gray-800 outline-none px-2 py-1 rounded"
              />
            </div>
          </div>
        </div>

        {/* सर्वे करने वाले की जानकारी */}
        <div>
          <h2 className="text-center font-bold text-lg mb-4 underline">सर्वे करने वाले की जानकारी</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <label className="w-32">पदनाम/संस्था</label>
              <input
                type="text"
                name="organizationName"
                value={formData.organizationName}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-24">दिनांक</label>
              <input
                type="date"
                name="surveyDate"
                value={formData.surveyDate}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>
            <div className="flex items-center gap-2 col-span-2">
              <label className="w-24">हस्ताक्षर</label>
              <input
                type="text"
                name="surveyorSignature"
                value={formData.surveyorSignature}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
                placeholder="नाम टाइप करें"
              />
            </div>
          </div>
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
