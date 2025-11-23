/**
 * Input Sanitization Utility
 * Prevents XSS, SQL Injection, and other injection attacks
 */

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (!input) return ''

  return input
    .trim()
    // Remove potential script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove event handlers
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove data: protocol (can be used for XSS)
    .replace(/data:text\/html/gi, '')
}

/**
 * Sanitize HTML content (for rich text)
 * Allows safe HTML tags only
 */
export function sanitizeHtml(html: string): string {
  if (!html) return ''

  // List of allowed tags
  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']
  
  // Remove all tags except allowed ones
  const tagRegex = /<(\/?)([\w]+)([^>]*)>/gi
  
  return html.replace(tagRegex, (match, slash, tag, attrs) => {
    const tagLower = tag.toLowerCase()
    
    if (!allowedTags.includes(tagLower)) {
      return ''
    }

    // For anchor tags, sanitize href
    if (tagLower === 'a' && !slash) {
      const hrefMatch = attrs.match(/href\s*=\s*["']([^"']*)["']/i)
      if (hrefMatch) {
        const href = hrefMatch[1]
        // Only allow http(s) and mailto links
        if (!/^(https?:\/\/|mailto:)/i.test(href)) {
          return ''
        }
      }
    }

    return match
  })
}

/**
 * Sanitize email to prevent injection
 */
export function sanitizeEmail(email: string): string {
  if (!email) return ''

  return email
    .trim()
    .toLowerCase()
    // Remove any characters that aren't valid in email
    .replace(/[^a-z0-9@._+-]/gi, '')
}

/**
 * Sanitize phone number
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return ''

  // Keep only digits, +, -, (, ), and spaces
  return phone.replace(/[^0-9+\-() ]/g, '').trim()
}

/**
 * Sanitize MongoDB query to prevent NoSQL injection
 */
export function sanitizeMongoQuery(query: any): any {
  if (typeof query !== 'object' || query === null) {
    return query
  }

  // Remove $where and other potentially dangerous operators
  const dangerousOperators = ['$where', '$function', '$accumulator']
  
  const sanitized: any = Array.isArray(query) ? [] : {}

  for (const key in query) {
    if (dangerousOperators.includes(key)) {
      continue // Skip dangerous operators
    }

    if (typeof query[key] === 'object' && query[key] !== null) {
      sanitized[key] = sanitizeMongoQuery(query[key])
    } else {
      sanitized[key] = query[key]
    }
  }

  return sanitized
}

/**
 * Validate and sanitize file upload
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName) return ''

  return fileName
    // Remove path traversal attempts
    .replace(/\.\./g, '')
    .replace(/[\/\\]/g, '')
    // Remove special characters except dot, dash, underscore
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .trim()
}

/**
 * Sanitize URL to prevent open redirect
 */
export function sanitizeUrl(url: string, allowedDomains: string[] = []): string | null {
  if (!url) return null

  try {
    const parsedUrl = new URL(url)

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return null
    }

    // If allowed domains specified, check if domain is in the list
    if (allowedDomains.length > 0) {
      const isAllowed = allowedDomains.some(domain => 
        parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
      )

      if (!isAllowed) {
        return null
      }
    }

    return parsedUrl.toString()
  } catch {
    return null
  }
}

/**
 * Escape special characters for regex
 */
export function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Remove null bytes (can cause issues in some contexts)
 */
export function removeNullBytes(input: string): string {
  return input.replace(/\0/g, '')
}
