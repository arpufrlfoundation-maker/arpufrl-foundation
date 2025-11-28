'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

interface CitizenSurveyData {
  // मूल जानकारी (Basic Information)
  citizenName: string
  fatherOrHusbandName: string
  gender: 'पुरुष' | 'महिला' | 'अन्य' | ''
  isWidow: 'हाँ' | 'नहीं' | ''
  age: string
  dob: string
  mobile: string
  email: string
  fullAddress: string

  // शैक्षिक विवरण (Educational Details)
  educationLevel: string // निरक्षर, प्राथमिक, उच्च प्रा0, स्नातक, स्नाकोत्तर
  hasVocationalTraining: 'हाँ' | 'नहीं' | ''

  // रोजगार व आय जानकारी (Employment & Income)
  currentOccupation: string
  monthlyIncome: string
  hasGovtBenefit: 'हाँ' | 'नहीं' | ''
  whichScheme: string

  // कृषि/उद्योग जानकारी
  isFarmer: 'हाँ' | 'नहीं' | ''
  landArea: string
  landType: 'अपनी' | 'पट्टे पर' | ''
  hasFactory: 'हाँ' | 'नहीं' | ''
  factoryName: string
  factoryType: string // उत्पादन, सेवा, अन्य

  // परिवार की जानकारी (Family Information)
  familyMembers: string
  childrenCount: string
  areParentsAlive: 'हाँ' | 'नहीं' | ''
  hasDisabledMember: 'हाँ' | 'नहीं' | ''

  // वाहन व संपत्ति जानकारी
  hasBike: 'हाँ' | 'नहीं' | ''
  hasCar: 'हाँ' | 'नहीं' | ''

  // घरेलू उपकरण
  appliances: string[] // पंखा, टी.वी., फ्रिज, वाशिंग मशीन, मिक्सर/ग्राइंडर, इन्वर्टर/सोलर, सिस्टम, अन्य
  otherAppliance: string

  // सामाजिक व स्वास्थ्य जानकारी
  hasRationCard: 'हाँ' | 'नहीं' | ''
  hasToilet: 'हाँ' | 'नहीं' | ''
  hasElectricity: 'हाँ' | 'नहीं' | ''
  healthFacility: string // सरकारी हॉ0, निजी हॉ0, अन्य
  hasInsurance: 'हाँ' | 'नहीं' | ''

  // विचार/सुझाव
  mainProblem: string
  foundationWorkSuggestion: string

  // सर्वे करने वाले की जानकारी
  surveyorName: string
  surveyDate: string
  surveyorSignature: string
}

export default function CitizenSurveyForm() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState<CitizenSurveyData>({
    citizenName: '',
    fatherOrHusbandName: '',
    gender: '',
    isWidow: '',
    age: '',
    dob: '',
    mobile: '',
    email: '',
    fullAddress: '',
    educationLevel: '',
    hasVocationalTraining: '',
    currentOccupation: '',
    monthlyIncome: '',
    hasGovtBenefit: '',
    whichScheme: '',
    isFarmer: '',
    landArea: '',
    landType: '',
    hasFactory: '',
    factoryName: '',
    factoryType: '',
    familyMembers: '',
    childrenCount: '',
    areParentsAlive: '',
    hasDisabledMember: '',
    hasBike: '',
    hasCar: '',
    appliances: [],
    otherAppliance: '',
    hasRationCard: '',
    hasToilet: '',
    hasElectricity: '',
    healthFacility: '',
    hasInsurance: '',
    mainProblem: '',
    foundationWorkSuggestion: '',
    surveyorName: '',
    surveyDate: new Date().toISOString().split('T')[0],
    surveyorSignature: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (value: string) => {
    setFormData(prev => {
      const currentValues = prev.appliances
      if (currentValues.includes(value)) {
        return { ...prev, appliances: currentValues.filter(v => v !== value) }
      } else {
        return { ...prev, appliances: [...currentValues, value] }
      }
    })
  }

  const handleRadioChange = (field: keyof CitizenSurveyData, value: string) => {
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
          surveyType: 'CITIZEN',
          data: formData,
          location: formData.fullAddress,
          district: '',
          state: '',
          surveyorName: formData.surveyorName || session?.user?.name || 'Anonymous',
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
              <span className="text-lg font-semibold">नागरिक सर्वे फॉर्म</span>
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
              <label className="w-40">नागरिक का नाम</label>
              <input
                type="text"
                name="citizenName"
                value={formData.citizenName}
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
              {['पुरुष', 'महिला', 'अन्य'].map((g) => (
                <label key={g} className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="gender"
                    checked={formData.gender === g}
                    onChange={() => handleRadioChange('gender', g)}
                  />
                  {g}
                </label>
              ))}
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label>क्या आप विधवा/विधुर हैं।</label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="isWidow"
                  checked={formData.isWidow === 'हाँ'}
                  onChange={() => handleRadioChange('isWidow', 'हाँ')}
                />
                हाँ
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="isWidow"
                  checked={formData.isWidow === 'नहीं'}
                  onChange={() => handleRadioChange('isWidow', 'नहीं')}
                />
                नहीं
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

        {/* शैक्षिक विवरण */}
        <div>
          <h2 className="text-center font-bold text-lg mb-4 underline">शैक्षिक विवरण</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-4 flex-wrap">
              <label>शिक्षा स्तर-</label>
              {['निरक्षर', 'प्राथमिक', 'उच्च प्रा0', 'स्नातक', 'स्नाकोत्तर'].map((level) => (
                <label key={level} className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="educationLevel"
                    checked={formData.educationLevel === level}
                    onChange={() => handleRadioChange('educationLevel', level)}
                  />
                  {level}
                </label>
              ))}
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label>क्या कोई व्यवसायिक प्रशिक्षण प्राप्त किया है?</label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="hasVocationalTraining"
                  checked={formData.hasVocationalTraining === 'हाँ'}
                  onChange={() => handleRadioChange('hasVocationalTraining', 'हाँ')}
                />
                हाँ
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="hasVocationalTraining"
                  checked={formData.hasVocationalTraining === 'नहीं'}
                  onChange={() => handleRadioChange('hasVocationalTraining', 'नहीं')}
                />
                नहीं
              </label>
            </div>
          </div>
        </div>

        {/* रोजगार व आय जानकारी */}
        <div>
          <h2 className="text-center font-bold text-lg mb-4 underline">रोजगार व आय जानकारी</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="w-40">वर्तमान व्यवसाय</label>
              <input
                type="text"
                name="currentOccupation"
                value={formData.currentOccupation}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="w-48">मासिक आय (अनुमानित):- रू0</label>
              <input
                type="text"
                name="monthlyIncome"
                value={formData.monthlyIncome}
                onChange={handleInputChange}
                className="w-40 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label>क्या सरकारी योजना का लाभ मिल रहा है?</label>
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
                <label>यदि हाँ, तो कौन सी योजना</label>
                <input
                  type="text"
                  name="whichScheme"
                  value={formData.whichScheme}
                  onChange={handleInputChange}
                  className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
                />
              </div>
            )}
          </div>
        </div>

        {/* कृषि/उद्योग जानकारी */}
        <div>
          <h2 className="text-center font-bold text-lg mb-4 underline">कृषि/उद्योग जानकारी</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-4 flex-wrap">
              <label>क्या आप कृषक (कृषक) हैं?</label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="isFarmer"
                  checked={formData.isFarmer === 'हाँ'}
                  onChange={() => handleRadioChange('isFarmer', 'हाँ')}
                />
                हाँ
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="isFarmer"
                  checked={formData.isFarmer === 'नहीं'}
                  onChange={() => handleRadioChange('isFarmer', 'नहीं')}
                />
                नहीं
              </label>
            </div>

            {formData.isFarmer === 'हाँ' && (
              <>
                <div className="flex items-center gap-4 flex-wrap ml-8">
                  <label>यदि हाँ आपके पास कितनी जमीन है?</label>
                  <input
                    type="text"
                    name="landArea"
                    value={formData.landArea}
                    onChange={handleInputChange}
                    className="w-32 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
                    placeholder="बीघा/एकड़"
                  />
                </div>
                <div className="flex items-center gap-4 flex-wrap ml-8">
                  <label>क्या जमीन अपनी है या पट्टे पर</label>
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="landType"
                      checked={formData.landType === 'अपनी'}
                      onChange={() => handleRadioChange('landType', 'अपनी')}
                    />
                    अपनी
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="landType"
                      checked={formData.landType === 'पट्टे पर'}
                      onChange={() => handleRadioChange('landType', 'पट्टे पर')}
                    />
                    पट्टे पर
                  </label>
                </div>
              </>
            )}

            <div className="flex items-center gap-4 flex-wrap">
              <label>क्या आपके पास फैक्ट्री/छोटा उद्योग है?</label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="hasFactory"
                  checked={formData.hasFactory === 'हाँ'}
                  onChange={() => handleRadioChange('hasFactory', 'हाँ')}
                />
                हाँ
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="hasFactory"
                  checked={formData.hasFactory === 'नहीं'}
                  onChange={() => handleRadioChange('hasFactory', 'नहीं')}
                />
                नहीं
              </label>
            </div>

            {formData.hasFactory === 'हाँ' && (
              <>
                <div className="flex items-center gap-2 ml-8">
                  <label>यदि हाँ, तो फैक्ट्री/उद्योग का नाम</label>
                  <input
                    type="text"
                    name="factoryName"
                    value={formData.factoryName}
                    onChange={handleInputChange}
                    className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
                  />
                </div>
                <div className="flex items-center gap-4 flex-wrap ml-8">
                  <label>प्रकार</label>
                  {['उत्पादन', 'सेवा', 'अन्य'].map((type) => (
                    <label key={type} className="flex items-center gap-1">
                      <input
                        type="radio"
                        name="factoryType"
                        checked={formData.factoryType === type}
                        onChange={() => handleRadioChange('factoryType', type)}
                      />
                      {type}
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* परिवार की जानकारी */}
        <div>
          <h2 className="text-center font-bold text-lg mb-4 underline">परिवार की जानकारी</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="w-48">परिवार के कुल सदस्य</label>
              <input
                type="text"
                name="familyMembers"
                value={formData.familyMembers}
                onChange={handleInputChange}
                className="w-20 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="w-48">बच्चों की संख्या</label>
              <input
                type="text"
                name="childrenCount"
                value={formData.childrenCount}
                onChange={handleInputChange}
                className="w-20 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label>माता पिता जीवित है?</label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="areParentsAlive"
                  checked={formData.areParentsAlive === 'हाँ'}
                  onChange={() => handleRadioChange('areParentsAlive', 'हाँ')}
                />
                हाँ
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="areParentsAlive"
                  checked={formData.areParentsAlive === 'नहीं'}
                  onChange={() => handleRadioChange('areParentsAlive', 'नहीं')}
                />
                नहीं
              </label>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label>परिवार में कोई दिव्यांग सदस्य है?</label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="hasDisabledMember"
                  checked={formData.hasDisabledMember === 'हाँ'}
                  onChange={() => handleRadioChange('hasDisabledMember', 'हाँ')}
                />
                हाँ
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="hasDisabledMember"
                  checked={formData.hasDisabledMember === 'नहीं'}
                  onChange={() => handleRadioChange('hasDisabledMember', 'नहीं')}
                />
                नहीं
              </label>
            </div>
          </div>
        </div>

        {/* वाहन व संपत्ति जानकारी */}
        <div>
          <h2 className="text-center font-bold text-lg mb-4 underline">वाहन व संपत्ति जानकारी</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-4 flex-wrap">
              <label>क्या आपके पास बाइक है?</label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="hasBike"
                  checked={formData.hasBike === 'हाँ'}
                  onChange={() => handleRadioChange('hasBike', 'हाँ')}
                />
                हाँ
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="hasBike"
                  checked={formData.hasBike === 'नहीं'}
                  onChange={() => handleRadioChange('hasBike', 'नहीं')}
                />
                नहीं
              </label>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label>क्या आपके पास कार है?</label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="hasCar"
                  checked={formData.hasCar === 'हाँ'}
                  onChange={() => handleRadioChange('hasCar', 'हाँ')}
                />
                हाँ
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="hasCar"
                  checked={formData.hasCar === 'नहीं'}
                  onChange={() => handleRadioChange('hasCar', 'नहीं')}
                />
                नहीं
              </label>
            </div>

            <div>
              <label className="block mb-2">क्या आपके घर में निम्न इलेक्ट्रिक उपकरण है?</label>
              <div className="flex items-center gap-4 flex-wrap ml-4">
                {['पंखा', 'टी.वी.', 'फ्रिज', 'वाशिंग मशीन', 'मिक्सर/ग्राइंडर', 'इन्वर्टर/सोलर', 'सिस्टम', 'अन्य'].map((appliance) => (
                  <label key={appliance} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={formData.appliances.includes(appliance)}
                      onChange={() => handleCheckboxChange(appliance)}
                    />
                    {appliance}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* सामाजिक व स्वास्थ्य जानकारी */}
        <div>
          <h2 className="text-center font-bold text-lg mb-4 underline">सामाजिक व स्वास्थ्य जानकारी</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-4 flex-wrap">
              <label>क्या आपके पास राशन कार्ड है?</label>
              <label className="flex items-center gap-1">
                <input type="radio" name="hasRationCard" checked={formData.hasRationCard === 'हाँ'} onChange={() => handleRadioChange('hasRationCard', 'हाँ')} />
                हाँ
              </label>
              <label className="flex items-center gap-1">
                <input type="radio" name="hasRationCard" checked={formData.hasRationCard === 'नहीं'} onChange={() => handleRadioChange('hasRationCard', 'नहीं')} />
                नहीं
              </label>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label>क्या आपके घर में शौचालय है?</label>
              <label className="flex items-center gap-1">
                <input type="radio" name="hasToilet" checked={formData.hasToilet === 'हाँ'} onChange={() => handleRadioChange('hasToilet', 'हाँ')} />
                हाँ
              </label>
              <label className="flex items-center gap-1">
                <input type="radio" name="hasToilet" checked={formData.hasToilet === 'नहीं'} onChange={() => handleRadioChange('hasToilet', 'नहीं')} />
                नहीं
              </label>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label>क्या आपके घर में बिजली है?</label>
              <label className="flex items-center gap-1">
                <input type="radio" name="hasElectricity" checked={formData.hasElectricity === 'हाँ'} onChange={() => handleRadioChange('hasElectricity', 'हाँ')} />
                हाँ
              </label>
              <label className="flex items-center gap-1">
                <input type="radio" name="hasElectricity" checked={formData.hasElectricity === 'नहीं'} onChange={() => handleRadioChange('hasElectricity', 'नहीं')} />
                नहीं
              </label>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label>स्वास्थ्य सुविधा कहाँ से लेते है?</label>
              {['सरकारी हॉ0', 'निजी हॉ0', 'अन्य'].map((facility) => (
                <label key={facility} className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="healthFacility"
                    checked={formData.healthFacility === facility}
                    onChange={() => handleRadioChange('healthFacility', facility)}
                  />
                  {facility}
                </label>
              ))}
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label>क्या किसी सरकारी बीमा योजना से जुड़े है?</label>
              <label className="flex items-center gap-1">
                <input type="radio" name="hasInsurance" checked={formData.hasInsurance === 'हाँ'} onChange={() => handleRadioChange('hasInsurance', 'हाँ')} />
                हाँ
              </label>
              <label className="flex items-center gap-1">
                <input type="radio" name="hasInsurance" checked={formData.hasInsurance === 'नहीं'} onChange={() => handleRadioChange('hasInsurance', 'नहीं')} />
                नहीं
              </label>
            </div>
          </div>
        </div>

        {/* विचार/सुझाव */}
        <div>
          <h2 className="text-center font-bold text-lg mb-4 underline">विचार/सुझाव</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="w-64">आपके क्षेत्र की सबसे बड़ी समस्या क्या है?</label>
              <input
                type="text"
                name="mainProblem"
                value={formData.mainProblem}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="w-64">आप चाहते हैं कि फाउन्डेशन आपके क्षेत्र में कौन से कार्य करें?</label>
              <input
                type="text"
                name="foundationWorkSuggestion"
                value={formData.foundationWorkSuggestion}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>
          </div>
        </div>

        {/* सर्वे करने वाले की जानकारी */}
        <div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <label className="w-40">सर्वेकर्ता का नाम</label>
              <input
                type="text"
                name="surveyorName"
                value={formData.surveyorName}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-24">सर्वे की तिथि</label>
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
