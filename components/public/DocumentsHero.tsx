export default function DocumentsHero() {
  return (
    <section className="relative bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-700 text-white">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/20"></div>

      <div className="relative container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Official
            <span className="block text-yellow-300">Documents & Certificates</span>
          </h1>

          <p className="text-lg md:text-xl lg:text-2xl mb-8 text-indigo-100 max-w-3xl mx-auto leading-relaxed">
            View our legal registrations, certificates, and official documentation
            that demonstrate our legitimacy and compliance.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-2xl mb-2">📄</div>
              <div className="text-sm md:text-base text-indigo-200">Registration</div>
              <div className="text-lg font-semibold text-yellow-300">NGO Documents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🏆</div>
              <div className="text-sm md:text-base text-indigo-200">Certifications</div>
              <div className="text-lg font-semibold text-yellow-300">Official Seals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">✅</div>
              <div className="text-sm md:text-base text-indigo-200">Verification</div>
              <div className="text-lg font-semibold text-yellow-300">Legal Compliance</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave decoration */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="relative block w-full h-16 fill-gray-50"
        >
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
        </svg>
      </div>
    </section>
  )
}
