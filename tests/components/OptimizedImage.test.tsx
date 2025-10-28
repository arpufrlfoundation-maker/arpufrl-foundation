/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import OptimizedImage from '@/components/common/OptimizedImage'

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({
    src,
    alt,
    onLoad,
    onError,
    className,
    ...props
  }: any) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        onLoad={onLoad}
        onError={onError}
        data-testid="next-image"
        {...props}
      />
    )
  }
})

describe('OptimizedImage', () => {
  const defaultProps = {
    src: '/test-image.jpg',
    alt: 'Test image',
    width: 400,
    height: 300,
  }

  it('should render image with correct props', () => {
    render(<OptimizedImage {...defaultProps} />)

    const image = screen.getByTestId('next-image')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', '/test-image.jpg')
    expect(image).toHaveAttribute('alt', 'Test image')
  })

  it('should show loading state initially', () => {
    render(<OptimizedImage {...defaultProps} />)

    const loadingSpinner = screen.getByRole('img', { hidden: true })
    expect(loadingSpinner.parentElement).toHaveClass('animate-pulse')
  })

  it('should hide loading state after image loads', async () => {
    render(<OptimizedImage {...defaultProps} />)

    const image = screen.getByTestId('next-image')
    fireEvent.load(image)

    await waitFor(() => {
      expect(image).toHaveClass('opacity-100')
    })
  })

  it('should show error state when image fails to load', async () => {
    render(<OptimizedImage {...defaultProps} />)

    const image = screen.getByTestId('next-image')
    fireEvent.error(image)

    await waitFor(() => {
      const errorIcon = screen.getByRole('img', { hidden: true })
      expect(errorIcon.parentElement).toHaveClass('bg-gray-200')
    })
  })

  it('should handle fill prop correctly', () => {
    render(<OptimizedImage {...defaultProps} fill />)

    const image = screen.getByTestId('next-image')
    expect(image).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const customClass = 'custom-image-class'
    render(<OptimizedImage {...defaultProps} className={customClass} />)

    const container = screen.getByTestId('next-image').parentElement
    expect(container).toHaveClass(customClass)
  })

  it('should set priority prop correctly', () => {
    render(<OptimizedImage {...defaultProps} priority />)

    const image = screen.getByTestId('next-image')
    expect(image).toBeInTheDocument()
  })

  it('should handle custom quality setting', () => {
    render(<OptimizedImage {...defaultProps} quality={95} />)

    const image = screen.getByTestId('next-image')
    expect(image).toBeInTheDocument()
  })

  it('should handle sizes prop for responsive images', () => {
    const sizes = '(max-width: 768px) 100vw, 50vw'
    render(<OptimizedImage {...defaultProps} sizes={sizes} />)

    const image = screen.getByTestId('next-image')
    expect(image).toBeInTheDocument()
  })

  it('should handle blur placeholder', () => {
    render(
      <OptimizedImage
        {...defaultProps}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ"
      />
    )

    const image = screen.getByTestId('next-image')
    expect(image).toBeInTheDocument()
  })
})