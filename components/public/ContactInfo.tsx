import info from '@/data/info.json'

export default function ContactInfo() {
  const org = info.organization

  const contactMethods = [
    {
      icon: '📧',
      title: 'Email Us',
      details: [
        `General Inquiries: ${org.email}`,
        'Quick response within 24 hours',
        'Support available for all queries'
      ]
    },
    {
      icon: '📞',
      title: 'Call Us',
      details: org.phone_numbers.map((phone, index) =>
        index === 0 ? `Main: ${phone}` : phone
      )
    },
    {
      icon: '🏢',
      title: 'Visit Our Office',
      details: [
        org.name,
        org.head_office_address,
        'India'
      ]
    },
    {
      icon: '🕒',
      title: 'Office Hours',
      details: [
        'Monday - Friday: 9:00 AM - 6:00 PM',
        'Saturday: 10:00 AM - 4:00 PM',
        'Sunday: Closed'
      ]
    }
  ]

  const socialLinks = [
    {
      name: 'Facebook',
      icon: '📘',
      url: org.social_links.facebook
    },
    {
      name: 'Instagram',
      icon: '📷',
      url: org.social_links.instagram
    },
    {
      name: 'Twitter',
      icon: '𝕏',
      url: org.social_links.twitter || '#'
    },
    {
      name: 'YouTube',
      icon: '📺',
      url: org.social_links.youtube
    }
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>

        <div className="space-y-6">
          {contactMethods.map((method, index) => (
            <div key={index} className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">{method.icon}</span>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">{method.title}</h3>
                <div className="space-y-1">
                  {method.details.map((detail, detailIndex) => (
                    <p key={detailIndex} className="text-gray-600 text-sm">
                      {detail}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Social Media Links */}
      <div className="border-t pt-8">
        <h3 className="font-semibold text-gray-900 mb-4">Follow Us</h3>
        <div className="flex space-x-4">
          {socialLinks.map((social, index) => (
            <a
              key={index}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-gray-100 hover:bg-blue-100 rounded-lg flex items-center justify-center transition-colors"
              title={social.name}
            >
              <span className="text-lg">{social.icon}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="border-t pt-8">
        <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
        <div className="space-y-2">
          <a href="/volunteer" className="block text-blue-600 hover:text-blue-800 text-sm">
            Volunteer Opportunities
          </a>
          <a href="/partnerships" className="block text-blue-600 hover:text-blue-800 text-sm">
            Partnership Inquiries
          </a>
          <a href="/careers" className="block text-blue-600 hover:text-blue-800 text-sm">
            Career Opportunities
          </a>
          <a href="/media" className="block text-blue-600 hover:text-blue-800 text-sm">
            Media & Press
          </a>
        </div>
      </div>
    </div>
  )
}