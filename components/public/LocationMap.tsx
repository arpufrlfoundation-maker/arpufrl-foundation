import info from '@/data/info.json'
import { Phone, Mail, MapPin, Instagram, Facebook, Twitter, Youtube } from 'lucide-react'

export default function LocationMap() {
  const org = info.organization

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Contact Us
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get in touch with us for any inquiries or support
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Main Contact Info */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-8 mb-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Office Address */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Head Office</h3>
                <div className="space-y-3 text-gray-700">
                  <p className="font-medium">{org.name}</p>
                  <p>{org.head_office_address}</p>

                  <div className="pt-4 border-t border-blue-200">
                    <p className="font-semibold mb-2 flex items-center"><Phone className="w-4 h-4 mr-2" /> Phone</p>
                    {org.phone_numbers.map((phone, index) => (
                      <p key={index}>
                        <a href={`tel:${phone}`} className="hover:text-blue-600">
                          {phone}
                        </a>
                      </p>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-blue-200">
                    <p className="font-semibold mb-2 flex items-center"><Mail className="w-4 h-4 mr-2" /> Email</p>
                    <a href={`mailto:${org.email}`} className="hover:text-blue-600">
                      {org.email}
                    </a>
                  </div>
                </div>
              </div>

              {/* Membership Info in Hindi */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-4">सदस्यता लेने के लिए संपर्क करे</h3>
                <div className="space-y-4">
                  <p className="text-lg flex items-center">
                    <Phone className="w-5 h-5 mr-2" /> <a href="tel:+919919003332" className="text-blue-600 hover:text-blue-700 font-semibold">9919003332</a>
                  </p>

                  <div>
                    <p className="font-semibold text-gray-700 mb-3">Follow us on social media:</p>
                    <div className="space-y-2">
                      <a
                        href={org.social_links.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-pink-600 hover:text-pink-700"
                      >
                        <Instagram className="w-6 h-6 mr-2" />
                        <span>Instagram</span>
                      </a>
                      <a
                        href={org.social_links.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:text-blue-700"
                      >
                        <Facebook className="w-6 h-6 mr-2" />
                        <span>Facebook</span>
                      </a>
                      <a
                        href={org.social_links.twitter || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-sky-500 hover:text-sky-600"
                      >
                        <Twitter className="w-6 h-6 mr-2" />
                        <span>Twitter / X</span>
                      </a>
                      <a
                        href={org.social_links.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-red-600 hover:text-red-700"
                      >
                        <Youtube className="w-6 h-6 mr-2" />
                        <span>YouTube</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Contact Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <div className="flex justify-center mb-3">
                <MapPin className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Main Office</h3>
              <p className="text-sm text-gray-600 mb-2">Headquarters</p>
              <p className="text-xs text-gray-500">
                {org.head_office_address}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <div className="flex justify-center mb-3">
                <Phone className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Contact Us</h3>
              <p className="text-sm text-gray-600 mb-2">Get in Touch</p>
              <p className="text-xs text-gray-500">
                {org.phone_numbers[0]}<br />
                {org.email}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <div className="text-3xl mb-3">🕒</div>
              <h3 className="font-semibold text-gray-900 mb-2">Office Hours</h3>
              <p className="text-sm text-gray-600 mb-2">Working Days</p>
              <p className="text-xs text-gray-500">
                Mon-Fri: 9:00 AM - 6:00 PM<br />
                Sat: 10:00 AM - 4:00 PM
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}