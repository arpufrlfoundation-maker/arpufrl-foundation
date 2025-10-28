export default function LocationMap() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Find Us
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Visit our main office or connect with our regional centers across India
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Map Placeholder */}
          <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center mb-8">
            <div className="text-center">
              <div className="text-6xl mb-4">🗺️</div>
              <p className="text-gray-600">Interactive Map</p>
              <p className="text-sm text-gray-500">
                ARPU Future Rise Life Foundation<br />
                123 Social Sector Hub, New Delhi - 110001
              </p>
            </div>
          </div>

          {/* Regional Offices */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <div className="text-3xl mb-3">🏢</div>
              <h3 className="font-semibold text-gray-900 mb-2">Delhi Office</h3>
              <p className="text-sm text-gray-600 mb-2">Headquarters</p>
              <p className="text-xs text-gray-500">
                123 Social Sector Hub<br />
                New Delhi - 110001
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <div className="text-3xl mb-3">🏢</div>
              <h3 className="font-semibold text-gray-900 mb-2">Mumbai Office</h3>
              <p className="text-sm text-gray-600 mb-2">Western Region</p>
              <p className="text-xs text-gray-500">
                456 NGO Complex<br />
                Mumbai - 400001
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <div className="text-3xl mb-3">🏢</div>
              <h3 className="font-semibold text-gray-900 mb-2">Bangalore Office</h3>
              <p className="text-sm text-gray-600 mb-2">Southern Region</p>
              <p className="text-xs text-gray-500">
                789 Tech Park<br />
                Bangalore - 560001
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}