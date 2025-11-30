import { Metadata } from 'next'

export interface SEOConfig {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article' | 'profile'
  siteName?: string
  locale?: string
  publishedTime?: string
  modifiedTime?: string
  author?: string
  section?: string
  tags?: string[]
}

const defaultConfig = {
  siteName: 'ARPU Future Rise Life Foundation',
  locale: 'en_IN',
  type: 'website' as const,
  image: '/images/og-default.jpg',
  baseUrl: process.env.APP_URL || 'https://arpufuturerise.org',
}

export function generateMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description,
    keywords = [],
    image,
    url,
    type = 'website',
    siteName = defaultConfig.siteName,
    locale = defaultConfig.locale,
    publishedTime,
    modifiedTime,
    author,
    section,
    tags = [],
  } = config

  const fullTitle = title
    ? `${title} | ${defaultConfig.siteName}`
    : defaultConfig.siteName

  const fullUrl = url
    ? `${defaultConfig.baseUrl}${url}`
    : defaultConfig.baseUrl

  const ogImage = image || defaultConfig.image
  const fullImageUrl = ogImage.startsWith('http')
    ? ogImage
    : `${defaultConfig.baseUrl}${ogImage}`

  const allKeywords = [
    'NGO',
    'charity',
    'donation',
    'India',
    'education',
    'healthcare',
    'community development',
    'social impact',
    'ARPU Future Rise Life Foundation',
    ...keywords,
    ...tags
  ]

  return {
    title: fullTitle,
    description,
    keywords: allKeywords.join(', '),

    // Favicon and icons
    icons: {
      icon: [
        { url: '/ARPUICON.ico', type: 'image/x-icon' },
        { url: '/ARPU-Logo.png', type: 'image/png', sizes: '192x192' },
      ],
      shortcut: '/ARPUICON.ico',
      apple: '/ARPU-Logo.png',
    },

    // Open Graph
    openGraph: {
      title: title || defaultConfig.siteName,
      description,
      url: fullUrl,
      siteName,
      locale,
      type,
      images: [
        {
          url: fullImageUrl,
          width: 1200,
          height: 630,
          alt: title || defaultConfig.siteName,
        },
      ],
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(author && { authors: [author] }),
      ...(section && { section }),
      ...(tags.length > 0 && { tags }),
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: title || defaultConfig.siteName,
      description,
      images: [fullImageUrl],
      creator: '@arpufuturerise',
      site: '@arpufuturerise',
    },

    // Additional meta tags
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // Verification tags (add your verification codes)
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
      yandex: process.env.YANDEX_VERIFICATION,
      yahoo: process.env.YAHOO_VERIFICATION,
    },

    // Canonical URL
    alternates: {
      canonical: fullUrl,
    },

    // Additional metadata
    category: 'Non-Profit Organization',
    classification: 'NGO, Charity, Social Impact',
  }
}

// Predefined metadata for common pages
export const pageMetadata = {
  home: {
    title: 'ARPU Future Rise Life Foundation - Empowering Communities Through Education & Healthcare',
    description: 'Join ARPU Future Rise Life Foundation in creating positive change through education, healthcare, and sustainable development programs across India. Donate now to make an impact.',
    keywords: ['NGO India', 'education programs', 'healthcare initiatives', 'community development', 'donate online'],
    url: '/',
  },

  about: {
    title: 'About Us - Our Mission to Transform Lives',
    description: 'Learn about ARPU Future Rise Life Foundation\'s mission, vision, and the dedicated team working to create positive change in communities across India.',
    keywords: ['about NGO', 'mission vision', 'team', 'social impact', 'community work'],
    url: '/about',
  },

  programs: {
    title: 'Our Programs - Education, Healthcare & Community Development',
    description: 'Discover our comprehensive initiatives in education, healthcare, and community development designed to create lasting positive change across India.',
    keywords: ['NGO programs', 'education initiatives', 'healthcare programs', 'community projects'],
    url: '/programs',
  },

  donate: {
    title: 'Donate Now - Make a Difference Today',
    description: 'Support our mission by making a secure online donation. Every contribution helps us create positive change in education, healthcare, and community development.',
    keywords: ['donate online', 'charity donation', 'support NGO', 'make impact', 'secure payment'],
    url: '/donate',
  },

  contact: {
    title: 'Contact Us - Get in Touch',
    description: 'Connect with ARPU Future Rise Life Foundation. Find our contact information, office locations, and get in touch to learn more about our work.',
    keywords: ['contact NGO', 'get in touch', 'office location', 'partnership'],
    url: '/contact',
  },

  stories: {
    title: 'Success Stories - Real Impact, Real Change',
    description: 'Read inspiring success stories from our programs and see the real impact of your donations on communities across India.',
    keywords: ['success stories', 'impact stories', 'testimonials', 'real change', 'beneficiaries'],
    url: '/stories',
  },
}

// Generate structured data for organization
export function generateOrganizationStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'NGO',
    name: 'ARPU Future Rise Life Foundation',
    alternateName: 'ARPU Foundation',
    url: defaultConfig.baseUrl,
    logo: `${defaultConfig.baseUrl}/ARPU-Logo.png`,
    image: `${defaultConfig.baseUrl}/images/og-default.jpg`,
    description: 'A non-profit organization dedicated to empowering communities through education, healthcare, and sustainable development programs across India.',

    // Contact Information
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-XXXXXXXXXX',
      contactType: 'customer service',
      availableLanguage: ['English', 'Hindi'],
    },

    // Address
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Your Street Address',
      addressLocality: 'Your City',
      addressRegion: 'Your State',
      postalCode: 'Your Postal Code',
      addressCountry: 'IN',
    },

    // Social Media
    sameAs: [
      'https://www.facebook.com/arpufuturerise',
      'https://www.twitter.com/arpufuturerise',
      'https://www.instagram.com/arpufuturerise',
      'https://www.linkedin.com/company/arpufuturerise',
    ],

    // Organization details
    foundingDate: '2020',
    nonprofitStatus: 'NonprofitType',

    // Areas of focus
    knowsAbout: [
      'Education',
      'Healthcare',
      'Community Development',
      'Sustainable Development',
      'Social Impact',
    ],

    // Donation information
    potentialAction: {
      '@type': 'DonateAction',
      target: `${defaultConfig.baseUrl}/donate`,
    },
  }
}

// Generate structured data for programs
export function generateProgramStructuredData(program: {
  name: string
  description: string
  slug: string
  image?: string
  targetAmount?: number
  raisedAmount: number
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Project',
    name: program.name,
    description: program.description,
    url: `${defaultConfig.baseUrl}/programs/${program.slug}`,
    image: program.image ? `${defaultConfig.baseUrl}${program.image}` : undefined,

    // Funding information
    ...(program.targetAmount && {
      funding: {
        '@type': 'Grant',
        amount: {
          '@type': 'MonetaryAmount',
          currency: 'INR',
          value: program.raisedAmount,
        },
        funder: {
          '@type': 'Organization',
          name: 'Community Donors',
        },
      },
    }),

    // Organization
    organizer: {
      '@type': 'NGO',
      name: 'ARPU Future Rise Life Foundation',
      url: defaultConfig.baseUrl,
    },

    // Categories
    category: 'Social Impact',
    keywords: 'NGO, charity, social impact, community development',
  }
}

// Generate breadcrumb structured data
export function generateBreadcrumbStructuredData(breadcrumbs: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${defaultConfig.baseUrl}${crumb.url}`,
    })),
  }
}