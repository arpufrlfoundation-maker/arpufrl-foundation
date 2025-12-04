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
  siteName: 'ARPU Future Rise Life Foundation | ARPUFRL',
  locale: 'en_IN',
  type: 'website' as const,
  image: '/images/og-default.jpg',
  baseUrl: process.env.APP_URL || 'https://arpufrl.org',
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
    'ARPUFRL',
    'arpufrl',
    'ARPU',
    'arpu',
    'ARPU Future Rise Life Foundation',
    'ARPU Foundation',
    'arpufrl.org',
    'NGO',
    'charity',
    'donation',
    'India',
    'education',
    'healthcare',
    'community development',
    'social impact',
    'NGO in India',
    'donate to NGO India',
    'best NGO India',
    ...keywords,
    ...tags
  ]

  return {
    title: fullTitle,
    description,
    keywords: allKeywords.join(', '),

    // Favicon and icons
    icons: {
      icon: '/favicon_io/favicon.ico',
      shortcut: '/favicon_io/favicon.ico',
      apple: '/favicon_io/apple-touch-icon.png',
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
    title: 'ARPUFRL - ARPU Future Rise Life Foundation | Empowering Communities Through Education & Healthcare',
    description: 'ARPUFRL (ARPU Future Rise Life Foundation) is a leading NGO in India creating positive change through education, healthcare, and sustainable development programs. Donate now to make an impact at arpufrl.org',
    keywords: ['ARPUFRL', 'arpufrl', 'ARPU', 'ARPU Foundation', 'arpufrl.org', 'NGO India', 'education programs', 'healthcare initiatives', 'community development', 'donate online', 'best NGO India'],
    url: '/',
  },

  about: {
    title: 'About ARPUFRL - Our Mission to Transform Lives',
    description: 'Learn about ARPUFRL (ARPU Future Rise Life Foundation) mission, vision, and the dedicated team working to create positive change in communities across India since 2018.',
    keywords: ['about ARPUFRL', 'about ARPU', 'ARPU Foundation mission', 'NGO mission vision', 'team', 'social impact', 'community work'],
    url: '/about',
  },

  programs: {
    title: 'ARPUFRL Programs - Education, Healthcare & Community Development',
    description: 'Discover ARPUFRL comprehensive initiatives in education, healthcare, and community development designed to create lasting positive change across India.',
    keywords: ['ARPUFRL programs', 'ARPU NGO programs', 'education initiatives', 'healthcare programs', 'community projects India'],
    url: '/programs',
  },

  donate: {
    title: 'Donate to ARPUFRL - Make a Difference Today',
    description: 'Support ARPUFRL mission by making a secure online donation. Every contribution to ARPU Future Rise Life Foundation helps create positive change in education, healthcare, and community development.',
    keywords: ['donate ARPUFRL', 'donate ARPU', 'charity donation India', 'support NGO', 'make impact', 'secure payment', '80G tax benefit'],
    url: '/donate',
  },

  contact: {
    title: 'Contact ARPUFRL - Get in Touch',
    description: 'Connect with ARPUFRL (ARPU Future Rise Life Foundation). Find our contact information, office locations, and get in touch to learn more about our work.',
    keywords: ['contact ARPUFRL', 'contact ARPU', 'ARPU Foundation contact', 'get in touch', 'office location', 'partnership'],
    url: '/contact',
  },

  stories: {
    title: 'ARPUFRL Success Stories - Real Impact, Real Change',
    description: 'Read inspiring success stories from ARPUFRL programs and see the real impact of your donations on communities across India.',
    keywords: ['ARPUFRL success stories', 'ARPU impact stories', 'testimonials', 'real change', 'beneficiaries', 'NGO impact'],
    url: '/stories',
  },
}

// Generate structured data for organization
export function generateOrganizationStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'NGO',
    name: 'ARPU Future Rise Life Foundation',
    alternateName: ['ARPUFRL', 'ARPU Foundation', 'ARPU', 'arpufrl'],
    url: defaultConfig.baseUrl,
    logo: `${defaultConfig.baseUrl}/favicon_io/android-chrome-512x512.png`,
    image: `${defaultConfig.baseUrl}/images/og-default.jpg`,
    description: 'ARPUFRL (ARPU Future Rise Life Foundation) is a leading non-profit organization in India dedicated to empowering communities through education, healthcare, and sustainable development programs. Visit arpufrl.org to donate and make an impact.',

    // Contact Information
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-9919003332',
      email: 'arpufrlfoundation@gmail.com',
      contactType: 'customer service',
      availableLanguage: ['English', 'Hindi'],
    },

    // Address
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'New Delhi',
      addressRegion: 'Delhi',
      addressCountry: 'IN',
    },

    // Social Media
    sameAs: [
      'https://www.facebook.com/share/1PNHJHKMLa/',
      'https://x.com/ArpufrlF',
      'https://www.instagram.com/arpufuture',
      'https://youtube.com/@arpufutureriselifefoundation',
    ],

    // Organization details
    foundingDate: '2018',
    nonprofitStatus: 'Nonprofit501c3',
    taxID: '80G Registered',

    // Areas of focus
    knowsAbout: [
      'Education',
      'Healthcare',
      'Community Development',
      'Sustainable Development',
      'Social Impact',
      'Rural Development',
      'Women Empowerment',
      'Child Education',
    ],

    // Donation information
    potentialAction: {
      '@type': 'DonateAction',
      target: `${defaultConfig.baseUrl}/donate`,
      name: 'Donate to ARPUFRL',
    },

    // Additional SEO properties
    slogan: 'Empowering Communities, Transforming Lives',
    areaServed: 'India',
    award: '80G Tax Exemption Certificate',
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