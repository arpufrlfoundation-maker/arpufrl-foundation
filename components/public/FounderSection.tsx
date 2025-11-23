'use client'

export default function FounderSection() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Meet Our Founder
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Founder Image */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-400 via-yellow-400 to-green-500 rounded-lg transform rotate-3"></div>
                <div className="relative bg-white p-2 rounded-lg shadow-xl">
                  <img
                    src="/pic/Founder.png"
                    alt="Prajjwal Shukla - Founder"
                    className="w-full h-auto rounded-lg"
                    onError={(e) => {
                      e.currentTarget.src = '/pic/about_our.jpg'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Founder Info */}
            <div>
              <h3 className="text-3xl font-bold text-blue-900 mb-4">
                Prajjwal Shukla
              </h3>

              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Founder of ARPU Future Rise Life Foundation, Prajjwal Shukla is a socially
                committed leader with a strong academic foundation.
              </p>

              <p className="text-gray-700 mb-4 leading-relaxed">
                He holds a B.Sc. in Mathematics, M.A. in Geography, B.Ed., D.Pharma, and LL.B.
              </p>

              <p className="text-gray-700 leading-relaxed">
                His multidisciplinary background reflects his deep engagement with education,
                health, society, and law. This empowers him to address complex community
                challenges with insight and compassion. His vision is to build a more inclusive,
                educated, and empowered society.
              </p>

              <div className="mt-8 pt-8 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Qualifications:</h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>B.Sc. in Mathematics</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>M.A. in Geography</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Bachelor of Education (B.Ed.)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Diploma in Pharmacy (D.Pharma)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span>Bachelor of Laws (LL.B.)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
