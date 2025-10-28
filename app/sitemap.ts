import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.APP_URL || 'https://arpufuturerise.org'

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/programs`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/donate`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/stories`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ]

  // TODO: Add dynamic pages (programs, stories) when database is available
  // This would require fetching from the database in a real implementation

  return staticPages
}

// Alternative function for generating dynamic sitemap with database data
export async function generateDynamicSitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.APP_URL || 'https://arpufuturerise.org'

  try {
    // Fetch programs from database
    // const programs = await fetchPrograms()
    // const programPages = programs.map(program => ({
    //   url: `${baseUrl}/programs/${program.slug}`,
    //   lastModified: new Date(program.updatedAt),
    //   changeFrequency: 'monthly' as const,
    //   priority: 0.7,
    // }))

    // For now, return static pages only
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 1,
      },
      {
        url: `${baseUrl}/about`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      },
      {
        url: `${baseUrl}/programs`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      },
      {
        url: `${baseUrl}/donate`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.9,
      },
      {
        url: `${baseUrl}/contact`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      },
      {
        url: `${baseUrl}/stories`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      },
    ]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    // Return static pages as fallback
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 1,
      },
    ]
  }
}