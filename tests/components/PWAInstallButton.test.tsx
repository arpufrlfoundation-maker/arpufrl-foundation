/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PWAInstallButton from '@/components/common/PWAInstallButton'

// Mock PWAInstaller
const mockInstaller = {
  isAppInstallable: jest.fn(),
  isAppInstalled: jest.fn(),
  install: jest.fn(),
}

jest.mock('@/lib/pwa', () => ({
  PWAInstaller: jest.fn().mockImplementation(() => mockInstaller),
}))

describe('PWAInstallButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockInstaller.isAppInstallable.mockReturnValue(false)
    mockInstaller.isAppInstalled.mockReturnValue(false)
    mockInstaller.install.mockResolvedValue(true)
  })

  it('should not render when app is not installable', () => {
    mockInstaller.isAppInstallable.mockReturnValue(false)

    render(<PWAInstallButton />)

    expect(screen.queryByText('Install App')).not.toBeInTheDocument()
  })

  it('should not render when app is already installed', () => {
    mockInstaller.isAppInstallable.mockReturnValue(true)
    mockInstaller.isAppInstalled.mockReturnValue(true)

    render(<PWAInstallButton />)

    expect(screen.queryByText('Install App')).not.toBeInTheDocument()
  })

  it('should render install button when app is installable', async () => {
    mockInstaller.isAppInstallable.mockReturnValue(true)
    mockInstaller.isAppInstalled.mockReturnValue(false)

    render(<PWAInstallButton />)

    // Simulate pwa-installable event
    fireEvent(window, new CustomEvent('pwa-installable'))

    await waitFor(() => {
      expect(screen.getByText('Install App')).toBeInTheDocument()
    })
  })

  it('should handle install button click', async () => {
    mockInstaller.isAppInstallable.mockReturnValue(true)
    mockInstaller.isAppInstalled.mockReturnValue(false)

    render(<PWAInstallButton />)

    // Simulate pwa-installable event
    fireEvent(window, new CustomEvent('pwa-installable'))

    await waitFor(() => {
      const installButton = screen.getByText('Install App')
      expect(installButton).toBeInTheDocument()

      fireEvent.click(installButton)
      expect(mockInstaller.install).toHaveBeenCalled()
    })
  })

  it('should show loading state during installation', async () => {
    mockInstaller.isAppInstallable.mockReturnValue(true)
    mockInstaller.isAppInstalled.mockReturnValue(false)

    // Make install return a pending promise
    let resolveInstall: (value: boolean) => void
    const installPromise = new Promise<boolean>((resolve) => {
      resolveInstall = resolve
    })
    mockInstaller.install.mockReturnValue(installPromise)

    render(<PWAInstallButton />)

    // Simulate pwa-installable event
    fireEvent(window, new CustomEvent('pwa-installable'))

    await waitFor(() => {
      const installButton = screen.getByText('Install App')
      fireEvent.click(installButton)
    })

    // Should show loading state
    expect(screen.getByText('Installing...')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()

    // Resolve the installation
    resolveInstall!(true)

    await waitFor(() => {
      expect(screen.queryByText('Installing...')).not.toBeInTheDocument()
    })
  })

  it('should handle installation failure', async () => {
    mockInstaller.isAppInstallable.mockReturnValue(true)
    mockInstaller.isAppInstalled.mockReturnValue(false)
    mockInstaller.install.mockRejectedValue(new Error('Installation failed'))

    // Mock console.error to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => { })

    render(<PWAInstallButton />)

    // Simulate pwa-installable event
    fireEvent(window, new CustomEvent('pwa-installable'))

    await waitFor(() => {
      const installButton = screen.getByText('Install App')
      fireEvent.click(installButton)
    })

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Installation failed:', expect.any(Error))
    })

    jest.restoreAllMocks()
  })

  it('should hide button after successful installation', async () => {
    mockInstaller.isAppInstallable.mockReturnValue(true)
    mockInstaller.isAppInstalled.mockReturnValue(false)

    render(<PWAInstallButton />)

    // Simulate pwa-installable event
    fireEvent(window, new CustomEvent('pwa-installable'))

    await waitFor(() => {
      expect(screen.getByText('Install App')).toBeInTheDocument()
    })

    // Simulate pwa-installed event
    fireEvent(window, new CustomEvent('pwa-installed'))

    await waitFor(() => {
      expect(screen.queryByText('Install App')).not.toBeInTheDocument()
    })
  })

  it('should have correct button styling', async () => {
    mockInstaller.isAppInstallable.mockReturnValue(true)
    mockInstaller.isAppInstalled.mockReturnValue(false)

    render(<PWAInstallButton />)

    // Simulate pwa-installable event
    fireEvent(window, new CustomEvent('pwa-installable'))

    await waitFor(() => {
      const button = screen.getByText('Install App')
      expect(button).toHaveClass('bg-green-600', 'hover:bg-green-700', 'text-white')
    })
  })
})