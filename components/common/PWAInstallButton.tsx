'use client'

import { useState, useEffect } from 'react'
import { PWAInstaller } from '@/lib/pwa'

export default function PWAInstallButton() {
  const [installer, setInstaller] = useState<PWAInstaller | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  useEffect(() => {
    const pwaInstaller = new PWAInstaller()
    setInstaller(pwaInstaller)

    setIsInstallable(pwaInstaller.isAppInstallable())
    setIsInstalled(pwaInstaller.isAppInstalled())

    // Listen for PWA events
    const handleInstallable = () => {
      setIsInstallable(true)
      setIsInstalled(false)
    }

    const handleInstalled = () => {
      setIsInstallable(false)
      setIsInstalled(true)
    }

    window.addEventListener('pwa-installable', handleInstallable)
    window.addEventListener('pwa-installed', handleInstalled)

    return () => {
      window.removeEventListener('pwa-installable', handleInstallable)
      window.removeEventListener('pwa-installed', handleInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!installer) return

    setIsInstalling(true)
    try {
      const success = await installer.install()
      if (success) {
        setIsInstallable(false)
        setIsInstalled(true)
      }
    } catch (error) {
      console.error('Installation failed:', error)
    } finally {
      setIsInstalling(false)
    }
  }

  // Don't show button if not installable or already installed
  if (!isInstallable || isInstalled) {
    return null
  }

  return (
    <button
      onClick={handleInstall}
      disabled={isInstalling}
      className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium rounded-lg transition-colors duration-200"
    >
      {isInstalling ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Installing...
        </>
      ) : (
        <>
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Install App
        </>
      )}
    </button>
  )
}