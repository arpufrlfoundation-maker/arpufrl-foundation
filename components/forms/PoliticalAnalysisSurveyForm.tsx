'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

interface PoliticalAnalysisSurveyData {
  // मूल जानकारी (Basic Information)
  respondentName: string
  fatherHusbandName: string
  age: string
  gender: 'पुरुष' | 'महिला' | 'अन्य' | ''
  education: string
  occupation: string
  address: string
  village: string
  block: string
  district: string
  state: string
  pinCode: string
  mobileNumber: string
  voterId: string
  aadharNumber: string

  // मतदान क्षेत्र विवरण (Constituency Details)
  vidhanSabha: string
  lokSabha: string
  wardNumber: string
  boothNumber: string

  // राजनीतिक जुड़ाव (Political Affiliation)
  isPoliticallyActive: 'हाँ' | 'नहीं' | ''
  partyMembership: string
  partyPosition: string
  yearsInPolitics: string
  previousElectionContested: 'हाँ' | 'नहीं' | ''
  electionDetails: string

  // मतदान व्यवहार (Voting Behavior)
  regularVoter: 'हाँ' | 'नहीं' | ''
  votedInLastElection: 'हाँ' | 'नहीं' | ''
  lastElectionVotedFor: string // 2024 लोकसभा में किसे वोट दिया
  satisfiedWithCurrentMP: 'हाँ' | 'नहीं' | 'कह नहीं सकते' | ''
  satisfiedWithCurrentMLA: 'हाँ' | 'नहीं' | 'कह नहीं सकते' | ''
  satisfiedWithLocalLeader: 'हाँ' | 'नहीं' | 'कह नहीं सकते' | ''

  // स्थानीय मुद्दे (Local Issues)
  majorLocalIssues: string // प्रमुख स्थानीय मुद्दे (बेरोजगारी, सड़क, पानी, बिजली, शिक्षा, स्वास्थ्य)
  developmentSatisfaction: 'संतुष्ट' | 'असंतुष्ट' | 'आंशिक संतुष्ट' | ''
  governmentSchemesBeneficiary: 'हाँ' | 'नहीं' | ''
  schemesReceived: string // किन योजनाओं का लाभ मिला

  // जाति/समुदाय विश्लेषण (Caste/Community Analysis)
  caste: string
  subCaste: string
  religion: string
  communityVotePattern: string // समुदाय का मतदान रुझान
  casteBasedVoting: 'हाँ' | 'नहीं' | 'कभी-कभी' | ''

  // राष्ट्रीय मुद्दे पर राय (Opinion on National Issues)
  primeMinisterRating: 'उत्तम' | 'अच्छा' | 'औसत' | 'खराब' | ''
  chiefMinisterRating: 'उत्तम' | 'अच्छा' | 'औसत' | 'खराब' | ''
  economyOpinion: 'बेहतर' | 'पहले जैसी' | 'खराब' | ''
  inflationConcern: 'हाँ' | 'नहीं' | ''
  unemploymentConcern: 'हाँ' | 'नहीं' | ''

  // भविष्य का मतदान रुझान (Future Voting Trend)
  nextElectionVotePreference: string
  changeVoteReason: string
  influencingFactors: string // वोट देने में कौन से कारक प्रभावित करते हैं

  // सोशल मीडिया प्रभाव (Social Media Influence)
  usesSocialMedia: 'हाँ' | 'नहीं' | ''
  socialMediaPlatforms: string
  politicalNewsSource: string // राजनीतिक समाचार का स्रोत
  influencedBySocialMedia: 'हाँ' | 'नहीं' | 'कभी-कभी' | ''

  // सुझाव और टिप्पणी (Suggestions and Comments)
  suggestionForLeaders: string
  areaRequiredImprovement: string
  additionalComments: string

  // सर्वे विवरण (Survey Details)
  surveyDate: string
  surveyorName: string
  surveyorDesignation: string
  surveyorContact: string

  // प्रमाणन (Certification)
  certificationDate: string
  certificationPlace: string
  respondentSignature: string
}

export default function PoliticalAnalysisSurveyForm() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState<PoliticalAnalysisSurveyData>({
    respondentName: '',
    fatherHusbandName: '',
    age: '',
    gender: '',
    education: '',
    occupation: '',
    address: '',
    village: '',
    block: '',
    district: '',
    state: '',
    pinCode: '',
    mobileNumber: '',
    voterId: '',
    aadharNumber: '',
    vidhanSabha: '',
    lokSabha: '',
    wardNumber: '',
    boothNumber: '',
    isPoliticallyActive: '',
    partyMembership: '',
    partyPosition: '',
    yearsInPolitics: '',
    previousElectionContested: '',
    electionDetails: '',
    regularVoter: '',
    votedInLastElection: '',
    lastElectionVotedFor: '',
    satisfiedWithCurrentMP: '',
    satisfiedWithCurrentMLA: '',
    satisfiedWithLocalLeader: '',
    majorLocalIssues: '',
    developmentSatisfaction: '',
    governmentSchemesBeneficiary: '',
    schemesReceived: '',
    caste: '',
    subCaste: '',
    religion: '',
    communityVotePattern: '',
    casteBasedVoting: '',
    primeMinisterRating: '',
    chiefMinisterRating: '',
    economyOpinion: '',
    inflationConcern: '',
    unemploymentConcern: '',
    nextElectionVotePreference: '',
    changeVoteReason: '',
    influencingFactors: '',
    usesSocialMedia: '',
    socialMediaPlatforms: '',
    politicalNewsSource: '',
    influencedBySocialMedia: '',
    suggestionForLeaders: '',
    areaRequiredImprovement: '',
    additionalComments: '',
    surveyDate: new Date().toISOString().split('T')[0],
    surveyorName: '',
    surveyorDesignation: '',
    surveyorContact: '',
    certificationDate: new Date().toISOString().split('T')[0],
    certificationPlace: '',
    respondentSignature: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleRadioChange = (field: keyof PoliticalAnalysisSurveyData, value: string) => {
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
          surveyType: 'POLITICAL_ANALYSIS',
          data: formData,
          location: formData.address || formData.village || formData.block,
          district: formData.district || 'Not Specified',
          state: formData.state || 'Not Specified',
          surveyorName: formData.surveyorName || session?.user?.name || 'Anonymous',
          surveyorContact: formData.surveyorContact,
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
      <div className="border-2 border-black p-4 bg-gradient-to-r from-orange-50 to-green-50">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 flex-shrink-0">
            <img src="/pic/logo.png" alt="ARPU Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold text-gray-900">ARPU Future Rise Life Foundation</h1>
            <div className="mt-2 inline-block border-2 border-orange-500 bg-orange-50 px-6 py-2 rounded">
              <span className="text-lg font-bold text-orange-800">राजनीतिक विश्लेषण हेतु उन्नत सर्वे फॉर्म</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">(गोपनीय - केवल सांख्यिकीय विश्लेषण हेतु)</p>
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
          <h2 className="text-center font-bold text-lg mb-4 bg-blue-100 py-2 border border-blue-300">भाग-1: मूल जानकारी</h2>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="w-48">उत्तरदाता का नाम</label>
              <input
                type="text"
                name="respondentName"
                value={formData.respondentName}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="w-48">पिता/पति का नाम</label>
              <input
                type="text"
                name="fatherHusbandName"
                value={formData.fatherHusbandName}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label>आयु</label>
              <input
                type="text"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                className="w-20 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
              <label className="ml-4">लिंग</label>
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
              <label>शिक्षा</label>
              <input
                type="text"
                name="education"
                value={formData.education}
                onChange={handleInputChange}
                className="w-40 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
              <label className="ml-4">व्यवसाय</label>
              <input
                type="text"
                name="occupation"
                value={formData.occupation}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
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

            <div className="grid grid-cols-4 gap-4">
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
              <div className="flex items-center gap-2">
                <label className="w-16">राज्य</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
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
              <label className="ml-4">मोबाईल नम्बर</label>
              <input
                type="tel"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleInputChange}
                className="w-40 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label>वोटर आईडी नम्बर</label>
              <input
                type="text"
                name="voterId"
                value={formData.voterId}
                onChange={handleInputChange}
                className="w-40 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
              <label className="ml-4">आधार नम्बर</label>
              <input
                type="text"
                name="aadharNumber"
                value={formData.aadharNumber}
                onChange={handleInputChange}
                className="w-40 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>
          </div>
        </div>

        {/* मतदान क्षेत्र विवरण */}
        <div>
          <h2 className="text-center font-bold text-lg mb-4 bg-green-100 py-2 border border-green-300">भाग-2: मतदान क्षेत्र विवरण</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <label className="w-40">विधान सभा क्षेत्र</label>
              <input
                type="text"
                name="vidhanSabha"
                value={formData.vidhanSabha}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-40">लोक सभा क्षेत्र</label>
              <input
                type="text"
                name="lokSabha"
                value={formData.lokSabha}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-40">वार्ड नम्बर</label>
              <input
                type="text"
                name="wardNumber"
                value={formData.wardNumber}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-40">बूथ नम्बर</label>
              <input
                type="text"
                name="boothNumber"
                value={formData.boothNumber}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>
          </div>
        </div>

        {/* राजनीतिक जुड़ाव */}
        <div>
          <h2 className="text-center font-bold text-lg mb-4 bg-orange-100 py-2 border border-orange-300">भाग-3: राजनीतिक जुड़ाव</h2>

          <div className="space-y-3">
            <div className="flex items-center gap-4 flex-wrap">
              <label>क्या आप राजनीतिक रूप से सक्रिय हैं?</label>
              <label className="flex items-center gap-1">
                <input type="radio" name="isPoliticallyActive" checked={formData.isPoliticallyActive === 'हाँ'} onChange={() => handleRadioChange('isPoliticallyActive', 'हाँ')} />
                हाँ
              </label>
              <label className="flex items-center gap-1">
                <input type="radio" name="isPoliticallyActive" checked={formData.isPoliticallyActive === 'नहीं'} onChange={() => handleRadioChange('isPoliticallyActive', 'नहीं')} />
                नहीं
              </label>
            </div>

            <div className="flex items-center gap-2">
              <label className="w-48">पार्टी सदस्यता (यदि हो)</label>
              <input
                type="text"
                name="partyMembership"
                value={formData.partyMembership}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label>पार्टी में पद (यदि हो)</label>
              <input
                type="text"
                name="partyPosition"
                value={formData.partyPosition}
                onChange={handleInputChange}
                className="w-40 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
              <label className="ml-4">राजनीति में कितने वर्षों से</label>
              <input
                type="text"
                name="yearsInPolitics"
                value={formData.yearsInPolitics}
                onChange={handleInputChange}
                className="w-20 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label>क्या पहले चुनाव लड़ चुके हैं?</label>
              <label className="flex items-center gap-1">
                <input type="radio" name="previousElectionContested" checked={formData.previousElectionContested === 'हाँ'} onChange={() => handleRadioChange('previousElectionContested', 'हाँ')} />
                हाँ
              </label>
              <label className="flex items-center gap-1">
                <input type="radio" name="previousElectionContested" checked={formData.previousElectionContested === 'नहीं'} onChange={() => handleRadioChange('previousElectionContested', 'नहीं')} />
                नहीं
              </label>
              <label className="ml-4">विवरण</label>
              <input
                type="text"
                name="electionDetails"
                value={formData.electionDetails}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>
          </div>
        </div>

        {/* मतदान व्यवहार */}
        <div>
          <h2 className="text-center font-bold text-lg mb-4 bg-purple-100 py-2 border border-purple-300">भाग-4: मतदान व्यवहार</h2>

          <div className="space-y-3">
            <div className="flex items-center gap-4 flex-wrap">
              <label>क्या आप नियमित मतदाता हैं?</label>
              <label className="flex items-center gap-1">
                <input type="radio" name="regularVoter" checked={formData.regularVoter === 'हाँ'} onChange={() => handleRadioChange('regularVoter', 'हाँ')} />
                हाँ
              </label>
              <label className="flex items-center gap-1">
                <input type="radio" name="regularVoter" checked={formData.regularVoter === 'नहीं'} onChange={() => handleRadioChange('regularVoter', 'नहीं')} />
                नहीं
              </label>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label>क्या पिछले चुनाव में वोट दिया?</label>
              <label className="flex items-center gap-1">
                <input type="radio" name="votedInLastElection" checked={formData.votedInLastElection === 'हाँ'} onChange={() => handleRadioChange('votedInLastElection', 'हाँ')} />
                हाँ
              </label>
              <label className="flex items-center gap-1">
                <input type="radio" name="votedInLastElection" checked={formData.votedInLastElection === 'नहीं'} onChange={() => handleRadioChange('votedInLastElection', 'नहीं')} />
                नहीं
              </label>
            </div>

            <div className="flex items-center gap-2">
              <label className="w-64">2024 लोकसभा में किस पार्टी/उम्मीदवार को वोट दिया</label>
              <input
                type="text"
                name="lastElectionVotedFor"
                value={formData.lastElectionVotedFor}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label>वर्तमान सांसद (MP) से संतुष्ट हैं?</label>
              {['हाँ', 'नहीं', 'कह नहीं सकते'].map((opt) => (
                <label key={opt} className="flex items-center gap-1">
                  <input type="radio" name="satisfiedWithCurrentMP" checked={formData.satisfiedWithCurrentMP === opt} onChange={() => handleRadioChange('satisfiedWithCurrentMP', opt)} />
                  {opt}
                </label>
              ))}
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label>वर्तमान विधायक (MLA) से संतुष्ट हैं?</label>
              {['हाँ', 'नहीं', 'कह नहीं सकते'].map((opt) => (
                <label key={opt} className="flex items-center gap-1">
                  <input type="radio" name="satisfiedWithCurrentMLA" checked={formData.satisfiedWithCurrentMLA === opt} onChange={() => handleRadioChange('satisfiedWithCurrentMLA', opt)} />
                  {opt}
                </label>
              ))}
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label>स्थानीय नेता से संतुष्ट हैं?</label>
              {['हाँ', 'नहीं', 'कह नहीं सकते'].map((opt) => (
                <label key={opt} className="flex items-center gap-1">
                  <input type="radio" name="satisfiedWithLocalLeader" checked={formData.satisfiedWithLocalLeader === opt} onChange={() => handleRadioChange('satisfiedWithLocalLeader', opt)} />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* स्थानीय मुद्दे */}
        <div>
          <h2 className="text-center font-bold text-lg mb-4 bg-yellow-100 py-2 border border-yellow-300">भाग-5: स्थानीय मुद्दे</h2>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="w-64">प्रमुख स्थानीय मुद्दे (बेरोजगारी, सड़क, पानी, बिजली, शिक्षा, स्वास्थ्य)</label>
              <input
                type="text"
                name="majorLocalIssues"
                value={formData.majorLocalIssues}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label>विकास कार्यों से संतुष्टि</label>
              {['संतुष्ट', 'असंतुष्ट', 'आंशिक संतुष्ट'].map((opt) => (
                <label key={opt} className="flex items-center gap-1">
                  <input type="radio" name="developmentSatisfaction" checked={formData.developmentSatisfaction === opt} onChange={() => handleRadioChange('developmentSatisfaction', opt)} />
                  {opt}
                </label>
              ))}
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label>क्या सरकारी योजनाओं का लाभ मिला?</label>
              <label className="flex items-center gap-1">
                <input type="radio" name="governmentSchemesBeneficiary" checked={formData.governmentSchemesBeneficiary === 'हाँ'} onChange={() => handleRadioChange('governmentSchemesBeneficiary', 'हाँ')} />
                हाँ
              </label>
              <label className="flex items-center gap-1">
                <input type="radio" name="governmentSchemesBeneficiary" checked={formData.governmentSchemesBeneficiary === 'नहीं'} onChange={() => handleRadioChange('governmentSchemesBeneficiary', 'नहीं')} />
                नहीं
              </label>
            </div>

            <div className="flex items-center gap-2">
              <label className="w-48">किन योजनाओं का लाभ मिला</label>
              <input
                type="text"
                name="schemesReceived"
                value={formData.schemesReceived}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>
          </div>
        </div>

        {/* जाति/समुदाय विश्लेषण */}
        <div>
          <h2 className="text-center font-bold text-lg mb-4 bg-pink-100 py-2 border border-pink-300">भाग-6: जाति/समुदाय विश्लेषण</h2>

          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <label className="w-16">जाति</label>
                <input
                  type="text"
                  name="caste"
                  value={formData.caste}
                  onChange={handleInputChange}
                  className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-16">उपजाति</label>
                <input
                  type="text"
                  name="subCaste"
                  value={formData.subCaste}
                  onChange={handleInputChange}
                  className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-16">धर्म</label>
                <input
                  type="text"
                  name="religion"
                  value={formData.religion}
                  onChange={handleInputChange}
                  className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="w-48">समुदाय का मतदान रुझान</label>
              <input
                type="text"
                name="communityVotePattern"
                value={formData.communityVotePattern}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label>क्या जाति के आधार पर वोट देते हैं?</label>
              {['हाँ', 'नहीं', 'कभी-कभी'].map((opt) => (
                <label key={opt} className="flex items-center gap-1">
                  <input type="radio" name="casteBasedVoting" checked={formData.casteBasedVoting === opt} onChange={() => handleRadioChange('casteBasedVoting', opt)} />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* राष्ट्रीय मुद्दे पर राय */}
        <div>
          <h2 className="text-center font-bold text-lg mb-4 bg-indigo-100 py-2 border border-indigo-300">भाग-7: राष्ट्रीय मुद्दे पर राय</h2>

          <div className="space-y-3">
            <div className="flex items-center gap-4 flex-wrap">
              <label>प्रधानमंत्री के कार्यों की रेटिंग</label>
              {['उत्तम', 'अच्छा', 'औसत', 'खराब'].map((rating) => (
                <label key={rating} className="flex items-center gap-1">
                  <input type="radio" name="primeMinisterRating" checked={formData.primeMinisterRating === rating} onChange={() => handleRadioChange('primeMinisterRating', rating)} />
                  {rating}
                </label>
              ))}
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label>मुख्यमंत्री के कार्यों की रेटिंग</label>
              {['उत्तम', 'अच्छा', 'औसत', 'खराब'].map((rating) => (
                <label key={rating} className="flex items-center gap-1">
                  <input type="radio" name="chiefMinisterRating" checked={formData.chiefMinisterRating === rating} onChange={() => handleRadioChange('chiefMinisterRating', rating)} />
                  {rating}
                </label>
              ))}
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label>अर्थव्यवस्था की स्थिति</label>
              {['बेहतर', 'पहले जैसी', 'खराब'].map((opt) => (
                <label key={opt} className="flex items-center gap-1">
                  <input type="radio" name="economyOpinion" checked={formData.economyOpinion === opt} onChange={() => handleRadioChange('economyOpinion', opt)} />
                  {opt}
                </label>
              ))}
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label>महंगाई से परेशान हैं?</label>
              <label className="flex items-center gap-1">
                <input type="radio" name="inflationConcern" checked={formData.inflationConcern === 'हाँ'} onChange={() => handleRadioChange('inflationConcern', 'हाँ')} />
                हाँ
              </label>
              <label className="flex items-center gap-1">
                <input type="radio" name="inflationConcern" checked={formData.inflationConcern === 'नहीं'} onChange={() => handleRadioChange('inflationConcern', 'नहीं')} />
                नहीं
              </label>
              <label className="ml-8">बेरोजगारी से परेशान हैं?</label>
              <label className="flex items-center gap-1">
                <input type="radio" name="unemploymentConcern" checked={formData.unemploymentConcern === 'हाँ'} onChange={() => handleRadioChange('unemploymentConcern', 'हाँ')} />
                हाँ
              </label>
              <label className="flex items-center gap-1">
                <input type="radio" name="unemploymentConcern" checked={formData.unemploymentConcern === 'नहीं'} onChange={() => handleRadioChange('unemploymentConcern', 'नहीं')} />
                नहीं
              </label>
            </div>
          </div>
        </div>

        {/* भविष्य का मतदान रुझान */}
        <div>
          <h2 className="text-center font-bold text-lg mb-4 bg-teal-100 py-2 border border-teal-300">भाग-8: भविष्य का मतदान रुझान</h2>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="w-64">अगले चुनाव में किसे वोट देंगे</label>
              <input
                type="text"
                name="nextElectionVotePreference"
                value={formData.nextElectionVotePreference}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="w-64">पिछली बार से वोट बदलने का कारण (यदि हो)</label>
              <input
                type="text"
                name="changeVoteReason"
                value={formData.changeVoteReason}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="w-64">वोट देने में कौन से कारक प्रभावित करते हैं</label>
              <input
                type="text"
                name="influencingFactors"
                value={formData.influencingFactors}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
                placeholder="व्यक्ति, पार्टी, मुद्दे, जाति, धर्म, विकास..."
              />
            </div>
          </div>
        </div>

        {/* सोशल मीडिया प्रभाव */}
        <div>
          <h2 className="text-center font-bold text-lg mb-4 bg-cyan-100 py-2 border border-cyan-300">भाग-9: सोशल मीडिया प्रभाव</h2>

          <div className="space-y-3">
            <div className="flex items-center gap-4 flex-wrap">
              <label>क्या सोशल मीडिया का उपयोग करते हैं?</label>
              <label className="flex items-center gap-1">
                <input type="radio" name="usesSocialMedia" checked={formData.usesSocialMedia === 'हाँ'} onChange={() => handleRadioChange('usesSocialMedia', 'हाँ')} />
                हाँ
              </label>
              <label className="flex items-center gap-1">
                <input type="radio" name="usesSocialMedia" checked={formData.usesSocialMedia === 'नहीं'} onChange={() => handleRadioChange('usesSocialMedia', 'नहीं')} />
                नहीं
              </label>
            </div>

            <div className="flex items-center gap-2">
              <label className="w-48">कौन से प्लेटफॉर्म</label>
              <input
                type="text"
                name="socialMediaPlatforms"
                value={formData.socialMediaPlatforms}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
                placeholder="WhatsApp, Facebook, YouTube, Instagram, Twitter..."
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="w-48">राजनीतिक समाचार का स्रोत</label>
              <input
                type="text"
                name="politicalNewsSource"
                value={formData.politicalNewsSource}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
                placeholder="TV, अखबार, सोशल मीडिया, रेडियो..."
              />
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <label>क्या सोशल मीडिया आपके मतदान निर्णय को प्रभावित करता है?</label>
              {['हाँ', 'नहीं', 'कभी-कभी'].map((opt) => (
                <label key={opt} className="flex items-center gap-1">
                  <input type="radio" name="influencedBySocialMedia" checked={formData.influencedBySocialMedia === opt} onChange={() => handleRadioChange('influencedBySocialMedia', opt)} />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* सुझाव और टिप्पणी */}
        <div>
          <h2 className="text-center font-bold text-lg mb-4 bg-gray-100 py-2 border border-gray-300">भाग-10: सुझाव और टिप्पणी</h2>

          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <label className="w-48">नेताओं के लिए सुझाव</label>
              <textarea
                name="suggestionForLeaders"
                value={formData.suggestionForLeaders}
                onChange={handleInputChange}
                className="flex-1 border border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1 min-h-[60px]"
              />
            </div>

            <div className="flex items-start gap-2">
              <label className="w-48">क्षेत्र में किन क्षेत्रों में सुधार की आवश्यकता</label>
              <textarea
                name="areaRequiredImprovement"
                value={formData.areaRequiredImprovement}
                onChange={handleInputChange}
                className="flex-1 border border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1 min-h-[60px]"
              />
            </div>

            <div className="flex items-start gap-2">
              <label className="w-48">अतिरिक्त टिप्पणी</label>
              <textarea
                name="additionalComments"
                value={formData.additionalComments}
                onChange={handleInputChange}
                className="flex-1 border border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1 min-h-[60px]"
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
                name="surveyorDesignation"
                value={formData.surveyorDesignation}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-32">सम्पर्क नम्बर</label>
              <input
                type="tel"
                name="surveyorContact"
                value={formData.surveyorContact}
                onChange={handleInputChange}
                className="flex-1 border-b border-dotted border-gray-400 focus:border-gray-800 outline-none px-2 py-1"
              />
            </div>
          </div>
        </div>

        {/* प्रमाणन (Certification) */}
        <div className="border-t-2 border-gray-400 pt-4">
          <h2 className="text-center font-bold text-lg mb-4 underline">प्रमाणन</h2>
          <p className="text-sm text-gray-700 mb-4 text-center">
            मैं यह प्रमाणित करता/करती हूँ कि मैंने स्वेच्छा से यह जानकारी दी है।
            मुझे विश्वास है कि यह सर्वे गोपनीय रखा जाएगा और केवल सांख्यिकीय विश्लेषण हेतु उपयोग किया जाएगा।
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
            <div className="flex items-center gap-2 col-span-2">
              <label className="w-48">उत्तरदाता का हस्ताक्षर</label>
              <input
                type="text"
                name="respondentSignature"
                value={formData.respondentSignature}
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
            className="px-8 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'जमा हो रहा है...' : 'सर्वे जमा करें'}
          </button>
        </div>
      </form>
    </div>
  )
}
