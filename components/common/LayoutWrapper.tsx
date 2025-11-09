'use client'

import { usePathname } from 'next/navigation'
import Header from './Header'
import Footer from './Footer'

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Hide Header and Footer on dashboard routes
  const isDashboardRoute = pathname.startsWith('/dashboard')

  return (
    <>
      {!isDashboardRoute && <Header />}
      <main className="flex-1">
        {children}
      </main>
      {!isDashboardRoute && <Footer />}
    </>
  )
}
