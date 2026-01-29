'use client'

import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function WhatsAppButton() {
  const [isHovered, setIsHovered] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919876543210'
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=Hello%20ARPUFRL,%20I%20would%20like%20to%20know%20more%20about%20your%20programs`

  return (
    <div className="fixed bottom-8 right-8 z-40">
      {/* Tooltip */}
      {isHovered && (
        <div className="absolute bottom-24 right-0 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap shadow-lg animate-fadeIn">
          Chat with us on WhatsApp
          <div className="absolute bottom-0 right-4 w-3 h-3 bg-gray-900 transform rotate-45 translate-y-1.5"></div>
        </div>
      )}

      {/* WhatsApp Button */}
      <Link
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-green-400 to-green-500 text-white shadow-lg hover:shadow-2xl transition-all duration-300 ease-out ${isHovered ? 'scale-110' : 'scale-100'}`}
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
      </Link>

      {/* Alternative WhatsApp SVG Icon (if you prefer the WhatsApp logo) */}
      {/* 
      <Link
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-green-400 to-green-500 text-white shadow-lg hover:shadow-2xl transition-all duration-300"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.272-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-4.255.949c-1.238.503-2.335 1.236-3.156 2.241C3.060 10.738 2.5 12.063 2.5 13.5c0 .585.063 1.15.175 1.695l.195 1.005L2.5 21l5.803-.865.963.175c1.545.28 3.154.282 4.753 0 5.508-1.048 9.509-5.876 9.509-11.477 0-2.792-1.049-5.41-2.957-7.421-1.908-2.01-4.446-3.11-7.148-3.11z"/>
        </svg>
      </Link>
      */}
    </div>
  )
}

