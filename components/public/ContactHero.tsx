export default function ContactHero() {
  return (
    <section className="relative text-white">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1611926653458-09294b3142bf?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')"
        }}
      ></div>
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/60"></div>

      <div className="relative container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Get in
            <span className="block text-yellow-300">Touch</span>
          </h1>

          <p className="text-lg md:text-xl lg:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto leading-relaxed">
            We'd love to hear from you. Whether you want to volunteer, partner with us,
            or simply learn more about our work, we're here to help.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-2xl mb-2">📧</div>
              <div className="text-sm md:text-base text-blue-200">Email Response</div>
              <div className="text-lg font-semibold text-yellow-300">Within 24 hours</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">📞</div>
              <div className="text-sm md:text-base text-blue-200">Phone Support</div>
              <div className="text-lg font-semibold text-yellow-300">Mon-Fri 9AM-6PM</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🏢</div>
              <div className="text-sm md:text-base text-blue-200">Office Visits</div>
              <div className="text-lg font-semibold text-yellow-300">By Appointment</div>
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