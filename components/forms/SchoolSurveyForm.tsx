'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

interface SchoolSurveyData {
  // मूल जानकारी (Basic Information)
  schoolName: string
  establishmentYear: string
  schoolType: string // प्राथमिक, उच्च प्राथमिक, माध्यमिक, उच्च माध्यमिक
  managementType: string // सरकारी, सहायता प्राप्त, निजी
  address: string
  village: string
  block: string
  district: string
  pinCode: string
  contactNumber: string
  email: string

  // शैखणिक विवरण (Academic Details)
  totalTeachers: string
  totalStudents: string
  boysCount: string
  girlsCount: string
  classesOffered: string // कक्षायें संचालित
  teacherStudentRatio: string // अध्यापक विद्यार्थी का स्तर

  // श्रेणीवार छात्र संख्या (Category-wise Student Count)
  playGroupCount: string
  primaryCount: string
  class6to8Count: string
  highSchoolCount: string

  // विशेष छात्र विवरण (Special Student Details)
  orphanStudents: string // माता पिता विहीन छात्र
  disabledStudents: string // विकलांग/विशेष आवश्यकता वाले छात्र
  ewsStudents: string // आर्थिक रूप से कमजोर वर्ग (EWS) छात्र

  // भवन व सुविधायें (Building and Facilities)
  buildingCondition: string // अच्छी, मरम्मत योग्य, खराब
  classroomCount: string
  hasToilet: 'हाँ' | 'नहीं' | ''
  hasToiletForGirls: 'हाँ' | 'नहीं' | ''
  hasDrinkingWater: 'हाँ' | 'नहीं' | ''
  hasElectricity: 'हाँ' | 'नहीं' | ''
  hasLibrary: 'हाँ' | 'नहीं' | ''
  hasComputerLab: 'हाँ' | 'नहीं' | ''
  hasPlayground: 'हाँ' | 'नहीं' | ''

  // अन्य विवरण (Other Details)
  hasMidDayMeal: 'हाँ' | 'नहीं' | ''
  hasSMS: 'हाँ' | 'नहीं' | '' // स्कूल प्रबंधन समिति
  hasRegularPTM: 'हाँ' | 'नहीं' | '' // अभिभावक बैठक नियमित होती है
  specialAchievements: string // कोई विशेष उपलब्धि या कार्यक्रम

  // सर्वे विवरण (Survey Details)
  surveyDate: string
  surveyorName: string
  designation: string
  contactNo: string

  // प्रमाणन (Principal Certification)
  principalName: string
  principalMobile: string
  principalSignature: string
  certificationDate: string
  certificationPlace: string
}

export default function SchoolSurveyForm() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState<SchoolSurveyData>({
    schoolName: '',
    establishmentYear: '',
    schoolType: '',
    managementType: '',
    address: '',
    village: '',
    block: '',
    district: '',
    pinCode: '',
    contactNumber: '',
    email: '',
    totalTeachers: '',
    totalStudents: '',
    boysCount: '',
    girlsCount: '',
    classesOffered: '',
    teacherStudentRatio: '',
    playGroupCount: '',
    primaryCount: '',
    class6to8Count: '',
    highSchoolCount: '',
    orphanStudents: '',
    disabledStudents: '',
    ewsStudents: '',
    buildingCondition: '',
    classroomCount: '',
    hasToilet: '',
    hasToiletForGirls: '',
    hasDrinkingWater: '',
    hasElectricity: '',
    hasLibrary: '',
    hasComputerLab: '',
    hasPlayground: '',
    hasMidDayMeal: '',
    hasSMS: '',
    hasRegularPTM: '',
    specialAchievements: '',
    surveyDate: new Date().toISOString().split('T')[0],
    surveyorName: '',
    designation: '',
    contactNo: '',
    principalName: '',
    principalMobile: '',
    principalSignature: '',
    certificationDate: new Date().toISOString().split('T')[0],
    certificationPlace: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleRadioChange = (field: keyof SchoolSurveyData, value: string) => {
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
          surveyType: 'SCHOOL',
          data: formData,
          location: formData.address || formData.schoolName,
          district: formData.district || 'Not Specified',
          state: 'Not Specified',
          surveyorName: formData.surveyorName || session?.user?.name || 'Anonymous',
          surveyorContact: formData.contactNo,
          surveyDate: formData.surveyDate
        })
      })

      const result = await response.json()

      if (!response.ok) {
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
              <span className="text-lg font-semibold">स्कूल सर्वे फॉर्म</span>
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
              <label className="w-40">स्कूल का नाम</label>
              <input
                type="text"
                name="schoolName"
                value={formData.schoolName}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
                required
              />
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label>स्थापना वर्ष</label>
              <input
                type="text"
                name="establishmentYear"
                value={formData.establishmentYear}
                onChange={handleInputChange}
                className="w-24 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
              <label className="ml-4">स्कूल का प्रकार</label>
              {['प्राथमिक', 'उच्च प्राथमिक', 'माध्यमिक', 'उच्च माध्यमिक'].map((type) => (
                <label key={type} className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="schoolType"
                    checked={formData.schoolType === type}
                    onChange={() => handleRadioChange('schoolType', type)}
                  />
                  {type}
                </label>
              ))}
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label>प्रबंधन प्रकार</label>
              {['सरकारी', 'सहायता प्राप्त', 'निजी'].map((type) => (
                <label key={type} className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="managementType"
                    checked={formData.managementType === type}
                    onChange={() => handleRadioChange('managementType', type)}
                  />
                  {type}
                </label>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <label className="w-20">पता</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <label className="w-20">ग्राम/वार्ड</label>
                <input
                  type="text"
                  name="village"
                  value={formData.village}
                  onChange={handleInputChange}
                  className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-16">ब्लॉक</label>
                <input
                  type="text"
                  name="block"
                  value={formData.block}
                  onChange={handleInputChange}
                  className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-16">जिला</label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label>पिन कोड</label>
              <input
                type="text"
                name="pinCode"
                value={formData.pinCode}
                onChange={handleInputChange}
                className="w-32 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label>सम्पर्क नम्बर</label>
              <input
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleInputChange}
                className="w-40 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
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
          </div>
        </div>

        {/* शैखणिक विवरण Section */}
        <div>
          <h2 className="text-center font-bold text-lg mb-4 underline">शैखणिक विवरण</h2>

          <div className="space-y-3">
            <div className="flex items-center gap-4 flex-wrap">
              <label>कुल शिक्षक संख्या</label>
              <input
                type="text"
                name="totalTeachers"
                value={formData.totalTeachers}
                onChange={handleInputChange}
                className="w-24 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
              <label className="ml-4">कुल छात्र संख्या</label>
              <input
                type="text"
                name="totalStudents"
                value={formData.totalStudents}
                onChange={handleInputChange}
                className="w-24 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label>लड़कों</label>
              <input
                type="text"
                name="boysCount"
                value={formData.boysCount}
                onChange={handleInputChange}
                className="w-24 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
              <label className="ml-4">लड़कियाँ</label>
              <input
                type="text"
                name="girlsCount"
                value={formData.girlsCount}
                onChange={handleInputChange}
                className="w-24 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label>कक्षाओं की कुल संख्या</label>
              <input
                type="text"
                name="classesOffered"
                value={formData.classesOffered}
                onChange={handleInputChange}
                className="w-24 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
              <label className="ml-4">अध्यापक विद्यार्थी का स्तर</label>
              <input
                type="text"
                name="teacherStudentRatio"
                value={formData.teacherStudentRatio}
                onChange={handleInputChange}
                className="w-24 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>
          </div>
        </div>

        {/* श्रेणीवार छात्र संख्या */}
        <div>
          <h2 className="text-center font-bold text-lg mb-4 underline">श्रेणीवार छात्र संख्या</h2>

          <div className="grid grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <label>प्ले ग्रुप</label>
              <input
                type="text"
                name="playGroupCount"
                value={formData.playGroupCount}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <label>प्राथमिक क्लास 1 से 5</label>
              <input
                type="text"
                name="primaryCount"
                value={formData.primaryCount}
                onChange={handleInputChange}
                className="w-20 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <label>मिडिल क्लास 6 से 8</label>
              <input
                type="text"
                name="class6to8Count"
                value={formData.class6to8Count}
                onChange={handleInputChange}
                className="w-20 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <label>हाईस्कूल क्लास 11 से 12</label>
              <input
                type="text"
                name="highSchoolCount"
                value={formData.highSchoolCount}
                onChange={handleInputChange}
                className="w-20 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>
          </div>
        </div>

        {/* विशेष छात्र विवरण */}
        <div>
          <h2 className="text-center font-bold text-lg mb-4 underline">विशेष छात्र विवरण</h2>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="w-64">श्रेणी छात्र संख्या - माता पिता विहीन छात्र (Orphan Students)</label>
              <input
                type="text"
                name="orphanStudents"
                value={formData.orphanStudents}
                onChange={handleInputChange}
                className="w-24 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-64">विकलांग/विशेष आवश्यकता वाले छात्र</label>
              <input
                type="text"
                name="disabledStudents"
                value={formData.disabledStudents}
                onChange={handleInputChange}
                className="w-24 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-64">आर्थिक रूप से कमजोर वर्ग (EWS) छात्र</label>
              <input
                type="text"
                name="ewsStudents"
                value={formData.ewsStudents}
                onChange={handleInputChange}
                className="w-24 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>
          </div>
        </div>

        {/* भवन व सुविधायें */}
        <div>
          <h2 className="text-center font-bold text-lg mb-4 underline">भवन व सुविधायें-</h2>

          <div className="space-y-3">
            <div className="flex items-center gap-4 flex-wrap">
              <label>भवन की स्थिति</label>
              {['अच्छी', 'मरम्मत योग्य', 'खराब'].map((condition) => (
                <label key={condition} className="flex items-center gap-1">
                  <input
                    type="radio"
                    name="buildingCondition"
                    checked={formData.buildingCondition === condition}
                    onChange={() => handleRadioChange('buildingCondition', condition)}
                  />
                  {condition}
                </label>
              ))}
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label>कक्षाओं की संख्या</label>
              <input
                type="text"
                name="classroomCount"
                value={formData.classroomCount}
                onChange={handleInputChange}
                className="w-24 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
              <label className="ml-4">शौचालय सुविधा</label>
              <label className="flex items-center gap-1">
                <input type="radio" name="hasToilet" checked={formData.hasToilet === 'हाँ'} onChange={() => handleRadioChange('hasToilet', 'हाँ')} />
                हाँ
              </label>
              <label className="flex items-center gap-1">
                <input type="radio" name="hasToilet" checked={formData.hasToilet === 'नहीं'} onChange={() => handleRadioChange('hasToilet', 'नहीं')} />
                नहीं
              </label>
              <label className="ml-4">लड़कियाँ</label>
              <label className="flex items-center gap-1">
                <input type="radio" name="hasToiletForGirls" checked={formData.hasToiletForGirls === 'हाँ'} onChange={() => handleRadioChange('hasToiletForGirls', 'हाँ')} />
                हाँ
              </label>
              <label className="flex items-center gap-1">
                <input type="radio" name="hasToiletForGirls" checked={formData.hasToiletForGirls === 'नहीं'} onChange={() => handleRadioChange('hasToiletForGirls', 'नहीं')} />
                नहीं
              </label>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label>पेयजल सुविधा</label>
              <label className="flex items-center gap-1">
                <input type="radio" name="hasDrinkingWater" checked={formData.hasDrinkingWater === 'हाँ'} onChange={() => handleRadioChange('hasDrinkingWater', 'हाँ')} />
                हाँ
              </label>
              <label className="flex items-center gap-1">
                <input type="radio" name="hasDrinkingWater" checked={formData.hasDrinkingWater === 'नहीं'} onChange={() => handleRadioChange('hasDrinkingWater', 'नहीं')} />
                नहीं
              </label>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label>बिजली</label>
              <label className="flex items-center gap-1">
                <input type="radio" name="hasElectricity" checked={formData.hasElectricity === 'हाँ'} onChange={() => handleRadioChange('hasElectricity', 'हाँ')} />
                हाँ
              </label>
              <label className="flex items-center gap-1">
                <input type="radio" name="hasElectricity" checked={formData.hasElectricity === 'नहीं'} onChange={() => handleRadioChange('hasElectricity', 'नहीं')} />
                नहीं
              </label>
              <label className="ml-4">पुस्तकालय</label>
              <label className="flex items-center gap-1">
                <input type="radio" name="hasLibrary" checked={formData.hasLibrary === 'हाँ'} onChange={() => handleRadioChange('hasLibrary', 'हाँ')} />
                हाँ
              </label>
              <label className="flex items-center gap-1">
                <input type="radio" name="hasLibrary" checked={formData.hasLibrary === 'नहीं'} onChange={() => handleRadioChange('hasLibrary', 'नहीं')} />
                नहीं
              </label>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label>कम्प्यूटर/स्मार्ट क्लास</label>
              <label className="flex items-center gap-1">
                <input type="radio" name="hasComputerLab" checked={formData.hasComputerLab === 'हाँ'} onChange={() => handleRadioChange('hasComputerLab', 'हाँ')} />
                हाँ
              </label>
              <label className="flex items-center gap-1">
                <input type="radio" name="hasComputerLab" checked={formData.hasComputerLab === 'नहीं'} onChange={() => handleRadioChange('hasComputerLab', 'नहीं')} />
                नहीं
              </label>
              <label className="ml-4">खेल मैदान</label>
              <label className="flex items-center gap-1">
                <input type="radio" name="hasPlayground" checked={formData.hasPlayground === 'हाँ'} onChange={() => handleRadioChange('hasPlayground', 'हाँ')} />
                हाँ
              </label>
              <label className="flex items-center gap-1">
                <input type="radio" name="hasPlayground" checked={formData.hasPlayground === 'नहीं'} onChange={() => handleRadioChange('hasPlayground', 'नहीं')} />
                नहीं
              </label>
            </div>
          </div>
        </div>

        {/* अन्य विवरण */}
        <div>
          <h2 className="text-center font-bold text-lg mb-4 underline">अन्य विवरण</h2>

          <div className="space-y-3">
            <div className="flex items-center gap-4 flex-wrap">
              <label>मिड डे मील योजना</label>
              <label className="flex items-center gap-1">
                <input type="radio" name="hasMidDayMeal" checked={formData.hasMidDayMeal === 'हाँ'} onChange={() => handleRadioChange('hasMidDayMeal', 'हाँ')} />
                हाँ
              </label>
              <label className="flex items-center gap-1">
                <input type="radio" name="hasMidDayMeal" checked={formData.hasMidDayMeal === 'नहीं'} onChange={() => handleRadioChange('hasMidDayMeal', 'नहीं')} />
                नहीं
              </label>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label>स्कूल प्रबंधन समिति (SMS)</label>
              <label className="flex items-center gap-1">
                <input type="radio" name="hasSMS" checked={formData.hasSMS === 'हाँ'} onChange={() => handleRadioChange('hasSMS', 'हाँ')} />
                हाँ
              </label>
              <label className="flex items-center gap-1">
                <input type="radio" name="hasSMS" checked={formData.hasSMS === 'नहीं'} onChange={() => handleRadioChange('hasSMS', 'नहीं')} />
                नहीं
              </label>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label>अभिभावक बैठक नियमित होती है</label>
              <label className="flex items-center gap-1">
                <input type="radio" name="hasRegularPTM" checked={formData.hasRegularPTM === 'हाँ'} onChange={() => handleRadioChange('hasRegularPTM', 'हाँ')} />
                हाँ
              </label>
              <label className="flex items-center gap-1">
                <input type="radio" name="hasRegularPTM" checked={formData.hasRegularPTM === 'नहीं'} onChange={() => handleRadioChange('hasRegularPTM', 'नहीं')} />
                नहीं
              </label>
            </div>

            <div className="flex items-center gap-2">
              <label className="w-64">कोई विशेष उपलब्धि या कार्यक्रम</label>
              <input
                type="text"
                name="specialAchievements"
                value={formData.specialAchievements}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>
          </div>
        </div>

        {/* सर्वे विवरण */}
        <div>
          <h2 className="text-center font-bold text-lg mb-4 underline">सर्वे विवरण</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <label className="w-32">सर्वे दिनांक</label>
              <input
                type="date"
                name="surveyDate"
                value={formData.surveyDate}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-40">सर्वे करने वाले का नाम</label>
              <input
                type="text"
                name="surveyorName"
                value={formData.surveyorName}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-32">पद</label>
              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-32">सम्पर्क नम्बर</label>
              <input
                type="tel"
                name="contactNo"
                value={formData.contactNo}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>
          </div>
        </div>

        {/* प्रमाणन (Principal Certification) */}
        <div className="border-t-2 border-gray-400 pt-4">
          <h2 className="text-center font-bold text-lg mb-4 underline">प्रमाणन (Principal Certification)</h2>
          <p className="text-sm text-gray-700 mb-4 text-center">
            मैं यह प्रमाणित करता/करती हूँ कि ऊपर दी गई सभी जानकारी सत्य एवं सही है।
            आवश्यक होने पर प्रमाण प्रस्तुत किए जा सकते हैं।
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <label className="w-24">दिनांक</label>
              <input
                type="date"
                name="certificationDate"
                value={formData.certificationDate}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-24">स्थान</label>
              <input
                type="text"
                name="certificationPlace"
                value={formData.certificationPlace}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-48">प्रधानाचार्य/प्रिसिपल का नाम</label>
              <input
                type="text"
                name="principalName"
                value={formData.principalName}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-24">मोबाईल नम्बर</label>
              <input
                type="tel"
                name="principalMobile"
                value={formData.principalMobile}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>
            <div className="flex items-center gap-2 col-span-2">
              <label className="w-24">हस्ताक्षर</label>
              <input
                type="text"
                name="principalSignature"
                value={formData.principalSignature}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
                placeholder="नाम टाइप करें"
              />
            </div>
          </div>
          <p className="text-right text-sm text-gray-600 mt-4">स्कूल की मुहर-</p>
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
