import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a unique ID for users
 * Format: ARPU-YYYY-XXXXXX (e.g., ARPU-2025-123456)
 */
export function generateUniqueId(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(100000 + Math.random() * 900000) // 6-digit random number
  return `ARPU-${year}-${random}`
}

/**
 * Format date to Indian locale
 */
export function formatIndianDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

/**
 * Format currency to Indian Rupees
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}