'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useContent } from '@/lib/content-provider'

export default function CallToActionSection() {
  const { content, loading, error } = useContent()

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-3/4 h-8 bg-white/20 animate-pulse rounded mx-auto mb-4"></div>
            <div className="w-full h-4 bg-white/20 animate-pulse rounded mx-auto mb-2"></div>
            <div className="w-2/3 h-4 bg-white/20 animate-pulse rounded mx-auto mb-8"></div>
            <div className="w-40 h-12 bg-white/20 animate-pulse rounded mx-auto"></div>
          </div>
        </div>
      </section>
    )
  }

  if (error || !content) {
    return null
  }

  const { call_to_action } = content

  return (
    <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800 text-white relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      {/* Background image if provided */}
      {call_to_action.image && (
        <div className="absolute inset-0">
          <img
            src={call_to_action.image}
            alt="Call to action background"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
      )}

      <div className="relative container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            {call_to_action.heading}
          </h2>

          <p className="text-lg md:text-xl text-blue-100 leading-relaxed mb-8 max-w-3xl mx-auto">
            {call_to_action.text}
          </p>

          {call_to_action.button && (
            <Button
              asChild
              size="lg"
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-8 py-4 text-lg"
            >
              <Link href={call_to_action.button.link || "/donate"}>
                {call_to_action.button.label}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}