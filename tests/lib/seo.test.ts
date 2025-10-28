import {
  generateMetadata,
  pageMetadata,
  generateOrganizationStructuredData,
  generateProgramStructuredData,
  generateBreadcrumbStructuredData
} from '@/lib/seo'

describe('SEO Utilities', () => {
  describe('generateMetadata', () => {
    it('should generate basic metadata correctly', () => {
      const config = {
        title: 'Test Page',
        description: 'Test description',
        url: '/test',
      }

      const metadata = generateMetadata(config)

      expect(metadata.title).toBe('Test Page | ARPU Future Rise Life Foundation')
      expect(metadata.description).toBe('Test description')
      expect(metadata.openGraph?.title).toBe('Test Page')
      expect(metadata.openGraph?.description).toBe('Test description')
      expect(metadata.twitter?.title).toBe('Test Page')
    })

    it('should include default keywords', () => {
      const config = {
        title: 'Test Page',
        description: 'Test description',
      }

      const metadata = generateMetadata(config)
      const keywords = metadata.keywords as string

      expect(keywords).toContain('NGO')
      expect(keywords).toContain('charity')
      expect(keywords).toContain('donation')
      expect(keywords).toContain('ARPU Future Rise Life Foundation')
    })

    it('should merge custom keywords with defaults', () => {
      const config = {
        title: 'Test Page',
        description: 'Test description',
        keywords: ['custom', 'keywords'],
      }

      const metadata = generateMetadata(config)
      const keywords = metadata.keywords as string

      expect(keywords).toContain('custom')
      expect(keywords).toContain('keywords')
      expect(keywords).toContain('NGO')
    })

    it('should generate correct Open Graph data', () => {
      const config = {
        title: 'Test Page',
        description: 'Test description',
        image: '/test-image.jpg',
        url: '/test',
      }

      const metadata = generateMetadata(config)

      expect(metadata.openGraph?.type).toBe('website')
      expect(metadata.openGraph?.siteName).toBe('ARPU Future Rise Life Foundation')
      expect(metadata.openGraph?.locale).toBe('en_IN')
      expect(metadata.openGraph?.images).toHaveLength(1)
    })

    it('should set robots configuration correctly', () => {
      const config = {
        title: 'Test Page',
        description: 'Test description',
      }

      const metadata = generateMetadata(config)

      expect(metadata.robots?.index).toBe(true)
      expect(metadata.robots?.follow).toBe(true)
      expect(metadata.robots?.googleBot?.index).toBe(true)
    })
  })

  describe('pageMetadata', () => {
    it('should havmetadata for all main pages', () => {
      expect(pageMetadata.home).toBeDefined()
      expect(pageMetadata.about).toBeDefined()
      expect(pageMetadata.programs).toBeDefined()
      expect(pageMetadata.donate).toBeDefined()
      expect(pageMetadata.contact).toBeDefined()
      expect(pageMetadata.stories).toBeDefined()
    })

    it('should have required fields for each page', () => {
      Object.values(pageMetadata).forEach((page) => {
        expect(page.title).toBeDefined()
        expect(page.description).toBeDefined()
        expect(page.url).toBeDefined()
        expect(page.keywords).toBeDefined()
        expect(Array.isArray(page.keywords)).toBe(true)
      })
    })
  })

  describe('generateOrganizationStructuredData', () => {
    it('should generate valid organization structured data', () => {
      const data = generateOrganizationStructuredData()

      expect(data['@context']).toBe('https://schema.org')
      expect(data['@type']).toBe('NGO')
      expect(data.name).toBe('ARPU Future Rise Life Foundation')
      expect(data.alternateName).toBe('ARPU Foundation')
      expect(data.description).toBeDefined()
      expect(data.contactPoint).toBeDefined()
      expect(data.address).toBeDefined()
      expect(data.sameAs).toBeInstanceOf(Array)
      expect(data.knowsAbout).toBeInstanceOf(Array)
      expect(data.potentialAction).toBeDefined()
    })

    it('should include contact information', () => {
      const data = generateOrganizationStructuredData()

      expect(data.contactPoint['@type']).toBe('ContactPoint')
      expect(data.contactPoint.contactType).toBe('customer service')
      expect(data.contactPoint.availableLanguage).toContain('English')
      expect(data.contactPoint.availableLanguage).toContain('Hindi')
    })

    it('should include address information', () => {
      const data = generateOrganizationStructuredData()

      expect(data.address['@type']).toBe('PostalAddress')
      expect(data.address.addressCountry).toBe('IN')
    })
  })

  describe('generateProgramStructuredData', () => {
    it('should generate valid program structured data', () => {
      const program = {
        name: 'Test Program',
        description: 'Test program description',
        slug: 'test-program',
        image: '/test-image.jpg',
        targetAmount: 100000,
        raisedAmount: 50000,
      }

      const data = generateProgramStructuredData(program)

      expect(data['@context']).toBe('https://schema.org')
      expect(data['@type']).toBe('Project')
      expect(data.name).toBe(program.name)
      expect(data.description).toBe(program.description)
      expect(data.organizer['@type']).toBe('NGO')
      expect(data.organizer.name).toBe('ARPU Future Rise Life Foundation')
    })

    it('should include funding information when target amount is provided', () => {
      const program = {
        name: 'Test Program',
        description: 'Test program description',
        slug: 'test-program',
        targetAmount: 100000,
        raisedAmount: 50000,
      }

      const data = generateProgramStructuredData(program)

      expect(data.funding).toBeDefined()
      expect(data.funding['@type']).toBe('Grant')
      expect(data.funding.amount.currency).toBe('INR')
      expect(data.funding.amount.value).toBe(program.raisedAmount)
    })

    it('should work without target amount', () => {
      const program = {
        name: 'Test Program',
        description: 'Test program description',
        slug: 'test-program',
        raisedAmount: 50000,
      }

      const data = generateProgramStructuredData(program)

      expect(data.name).toBe(program.name)
      expect(data.funding).toBeUndefined()
    })
  })

  describe('generateBreadcrumbStructuredData', () => {
    it('should generate valid breadcrumb structured data', () => {
      const breadcrumbs = [
        { name: 'Home', url: '/' },
        { name: 'Programs', url: '/programs' },
        { name: 'Education', url: '/programs/education' },
      ]

      const data = generateBreadcrumbStructuredData(breadcrumbs)

      expect(data['@context']).toBe('https://schema.org')
      expect(data['@type']).toBe('BreadcrumbList')
      expect(data.itemListElement).toHaveLength(3)
    })

    it('should set correct positions and items', () => {
      const breadcrumbs = [
        { name: 'Home', url: '/' },
        { name: 'Programs', url: '/programs' },
      ]

      const data = generateBreadcrumbStructuredData(breadcrumbs)

      expect(data.itemListElement[0].position).toBe(1)
      expect(data.itemListElement[0].name).toBe('Home')
      expect(data.itemListElement[1].position).toBe(2)
      expect(data.itemListElement[1].name).toBe('Programs')
    })

    it('should handle empty breadcrumbs', () => {
      const data = generateBreadcrumbStructuredData([])

      expect(data.itemListElement).toHaveLength(0)
    })
  })
})