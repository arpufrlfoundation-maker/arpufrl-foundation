/**
 * SEO Optimization Utility
 * Generates proper meta tags and structured data
 */

interface SEOProps {
  title: string
  description: string
  keywords?: string[]
  ogImage?: string
  ogType?: 'website' | 'article' | 'profile'
  canonical?: string
  noindex?: boolean
  structuredData?: object
}

export function generateMetadata({
  title,
  description,
  keywords = [],
  ogImage = '/og-image.jpg',
  ogType = 'website',
  canonical,
  noindex = false
}: SEOProps) {
  const baseUrl = process.env.APP_URL || 'https://arpufrl.org'
  const fullTitle = title.includes('ARPU') ? title : `${title} | ARPU Future Rise Life Foundation`

  return {
    title: fullTitle,
    description,
    keywords: keywords.join(', '),
    authors: [{ name: 'ARPU Future Rise Life Foundation' }],
    creator: 'ARPU Future Rise Life Foundation',
    publisher: 'ARPU Future Rise Life Foundation',
    ...(noindex && { robots: 'noindex, nofollow' }),
    openGraph: {
      title: fullTitle,
      description,
      url: canonical || baseUrl,
      siteName: 'ARPU Future Rise Life Foundation',
      images: [
        {
          url: ogImage.startsWith('http') ? ogImage : `${baseUrl}${ogImage}`,
          width: 1200,
          height: 630,
          alt: title
        }
      ],
      locale: 'en_IN',
      type: ogType
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage.startsWith('http') ? ogImage : `${baseUrl}${ogImage}`],
      creator: '@ArpufrlF' // Update with actual Twitter handle
    },
    alternates: {
      canonical: canonical || baseUrl
    },
    verification: {
      // Add when available
      // google: 'YOUR_GOOGLE_VERIFICATION_CODE',
      // yandex: 'YOUR_YANDEX_VERIFICATION_CODE',
    }
  }
}

/**
 * Generate structured data (JSON-LD) for organization
 */
export function generateOrganizationSchema() {
  const baseUrl = process.env.APP_URL || 'https://arpufrl.org'

  return {
    '@context': 'https://schema.org',
    '@type': 'NGO',
    name: 'ARPU Future Rise Life Foundation',
    alternateName: 'ARPUFRL',
    url: baseUrl,
    logo: `${baseUrl}/ARPU-Logo.png`,
    description: 'A non-profit organization dedicated to empowering communities through education, healthcare, and social welfare programs.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IN',
      addressRegion: 'Uttar Pradesh',
      // Add complete address
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-9919003332',
      contactType: 'Customer Service',
      areaServed: 'IN',
      availableLanguage: ['en', 'hi']
    },
    sameAs: [
      'https://www.facebook.com/ArpufrlFoundation',
      'https://www.instagram.com/arpufrl_foundation',
      'https://twitter.com/ArpufrlF',
      'https://www.youtube.com/@Arpufrl'
    ]
  }
}

/**
 * Generate structured data for donation page
 */
export function generateDonationSchema() {
  const baseUrl = process.env.APP_URL || 'https://arpufrl.org'

  return {
    '@context': 'https://schema.org',
    '@type': 'DonateAction',
    name: 'Support ARPU Foundation',
    recipient: {
      '@type': 'NGO',
      name: 'ARPU Future Rise Life Foundation',
      url: baseUrl
    },
    url: `${baseUrl}/donate`,
    description: 'Make a donation to support education, healthcare, and community development programs.'
  }
}

/**
 * Generate breadcrumb structured data
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  const baseUrl = process.env.APP_URL || 'https://arpufrl.org'

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`
    }))
  }
}

/**
 * Generate article/blog post structured data
 */
export function generateArticleSchema({
  headline,
  description,
  image,
  datePublished,
  dateModified,
  author
}: {
  headline: string
  description: string
  image: string
  datePublished: string
  dateModified?: string
  author?: string
}) {
  const baseUrl = process.env.APP_URL || 'https://arpufrl.org'

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    image: image.startsWith('http') ? image : `${baseUrl}${image}`,
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Organization',
      name: author || 'ARPU Future Rise Life Foundation'
    },
    publisher: {
      '@type': 'Organization',
      name: 'ARPU Future Rise Life Foundation',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/ARPU-Logo.png`
      }
    }
  }
}
