import Link from 'next/link'

export default function Footer() {
  const quickLinks = [
    { name: 'About Us', href: '/about' },
    { name: 'Programs', href: '/programs' },
    { name: 'Success Stories', href: '/stories' },
    { name: 'Contact', href: '/contact' }
  ]

  const supportLinks = [
    { name: 'Donate', href: '/donate' },
    { name: 'Volunteer', href: '/volunteer' },
    { name: 'Partner with Us', href: '/partnerships' },
    { name: 'Corporate CSR', href: '/csr' }
  ]

  const legalLinks = [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Refund Policy', href: '/refund' },
    { name: 'Annual Reports', href: '/reports' }
  ]

  const socialLinks = [
    { name: 'Facebook', icon: '📘', href: '#' },
    { name: 'Twitter', icon: '🐦', href: '#' },
    { name: 'LinkedIn', icon: '💼', href: '#' },
    { name: 'Instagram', icon: '📷', href: '#' },
    { name: 'YouTube', icon: '📺', href: '#' }
  ]

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Organization Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <div className="font-bold text-lg">ARPU Foundation</div>
                <div className="text-sm text-gray-400">Future Rise Life</div>
              </div>
            </div>

            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              Empowering communities through sustainable development programs
              in education, healthcare, and social welfare across India.
            </p>

            {/* Contact Info */}
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center space-x-2">
                <span>📧</span>
                <span>info@arpufoundation.org</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>📞</span>
                <span>+91 11 2345 6789</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>🏢</span>
                <span>New Delhi, India</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-white text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Get Involved</h3>
            <ul className="space-y-2">
              {supportLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-white text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Social */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Legal</h3>
            <ul className="space-y-2 mb-6">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-white text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Social Media */}
            <div>
              <h4 className="font-medium mb-3">Follow Us</h4>
              <div className="flex space-x-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    className="w-8 h-8 bg-gray-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors"
                    title={social.name}
                  >
                    <span className="text-sm">{social.icon}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-400">
              © 2024 ARPU Future Rise Life Foundation. All rights reserved.
            </div>

            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <span>🔒 Secure Donations</span>
              <span>✅ 80G Tax Benefits</span>
              <span>📊 Transparent Operations</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}