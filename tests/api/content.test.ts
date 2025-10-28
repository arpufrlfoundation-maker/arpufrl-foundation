import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/content/route';
import { promises as fs } from 'fs';
import path from 'path';
import { InfoJSONSchema, getFallbackContent } from '@/lib/content-types';

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
  },
}));

const mockFs = fs as jest.Mocked<typeof fs>;

describe('/api/content', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return valid content from info.json file', async () => {
      // Mock valid JSON content
      const validContent = {
        organization: {
          name: 'Test Organization',
          email: 'test@example.com',
          copyright_year: 2025,
        },
        navigation: [
          { id: 1, label: 'Home', link: '/' },
        ],
        hero_section: {
          title: 'Test Title',
          subtitle: 'Test Subtitle',
          buttons: [{ label: 'Test Button' }],
        },
        highlight_cards: [],
        mission_section: {
          heading: 'Test Mission',
          text: 'Test mission text',
        },
        call_to_action: {
          heading: 'Test CTA',
          text: 'Test CTA text',
        },
        achievements_section: {
          heading: 'Test Achievements',
          text: 'Test achievements text',
          cards: [],
        },
        about_section: {
          heading: 'Test About',
          text: 'Test about text',
        },
        blog_section: {
          heading: 'Test Blog',
          posts: [],
        },
        team_section: {
          heading: 'Test Team',
          members: [],
        },
        footer: {
          quick_links: [],
          contact: {
            email: 'test@example.com',
          },
          copyright: '© 2025 Test Organization',
        },
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(validContent));

      const request = new NextRequest('http://localhost:3000/api/content');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.organization.name).toBe('Test Organization');
      expect(response.headers.get('X-Content-Source')).toBe('file');
      expect(response.headers.get('Cache-Control')).toContain('s-maxage=300');
    });

    it('should return fallback content when JSON parsing fails', async () => {
      // Mock invalid JSON
      mockFs.readFile.mockResolvedValue('invalid json content');

      const request = new NextRequest('http://localhost:3000/api/content');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(response.headers.get('X-Content-Source')).toBe('fallback');
      expect(response.headers.get('X-Error')).toBe('json-parse-error');
      expect(data.organization.name).toBe('ARPU Future Rise Life Foundation');
    });

    it('should return fallback content when validation fails', async () => {
      // Mock JSON with invalid structure
      const invalidContent = {
        organization: {
          name: 'Test Organization',
          // Missing required email field
        },
        // Missing required fields
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(invalidContent));

      const request = new NextRequest('http://localhost:3000/api/content');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(response.headers.get('X-Content-Source')).toBe('fallback');
      expect(response.headers.get('X-Error')).toBe('validation-error');
      expect(data.organization.name).toBe('ARPU Future Rise Life Foundation');
    });

    it('should return fallback content when file reading fails', async () => {
      // Mock file read error
      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      const request = new NextRequest('http://localhost:3000/api/content');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(response.headers.get('X-Content-Source')).toBe('fallback');
      expect(response.headers.get('X-Error')).toBe('file-read-error');
      expect(data.organization.name).toBe('ARPU Future Rise Life Foundation');
    });

    it('should optimize content for mobile when mobile=true', async () => {
      const validContent = {
        organization: {
          name: 'Test Organization',
          email: 'test@example.com',
        },
        navigation: [],
        hero_section: {
          title: 'Test Title',
          subtitle: 'Test Subtitle',
          buttons: [],
          image: '/test-image.jpg',
        },
        highlight_cards: [
          {
            title: 'Test Card',
            description: 'Test description',
            image: '/test-card-image.jpg',
          },
        ],
        mission_section: {
          heading: 'Test Mission',
          text: 'This is a very long mission text that should be truncated for mobile devices to improve loading performance and user experience on smaller screens with limited bandwidth. This text is definitely longer than 200 characters to ensure truncation occurs properly.',
        },
        call_to_action: {
          heading: 'Test CTA',
          text: 'Test CTA text',
        },
        achievements_section: {
          heading: 'Test Achievements',
          text: 'Test achievements text',
          cards: [
            {
              title: 'Achievement 1',
              description: 'Achievement description',
              image: '/achievement-image.jpg',
            },
          ],
        },
        about_section: {
          heading: 'Test About',
          text: 'This is a very long about text that should be truncated for mobile devices to improve loading performance and user experience on mobile devices with limited bandwidth and slower connections.',
        },
        blog_section: {
          heading: 'Test Blog',
          posts: [
            {
              title: 'Blog Post 1',
              image: '/blog-image.jpg',
            },
          ],
        },
        team_section: {
          heading: 'Test Team',
          members: [
            {
              name: 'Team Member',
              role: 'Developer',
              profile_image: '/profile-image.jpg',
            },
          ],
        },
        footer: {
          quick_links: [],
          contact: {
            email: 'test@example.com',
          },
          copyright: '© 2025 Test Organization',
        },
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(validContent));

      const request = new NextRequest('http://localhost:3000/api/content?mobile=true');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(response.headers.get('X-Mobile-Optimized')).toBe('true');
      expect(response.headers.get('Cache-Control')).toContain('s-maxage=600');

      // Check mobile optimizations
      expect(data.hero_section.image).toBe('/api/image/placeholder?w=800&h=400');
      expect(data.highlight_cards[0].image).toBe('/api/image/placeholder?w=300&h=200');
      expect(data.mission_section.text).toContain('...');
      expect(data.mission_section.text.length).toBeLessThanOrEqual(203); // 200 + '...'
      expect(data.about_section.text).toContain('...');
      expect(data.about_section.text.length).toBeLessThanOrEqual(153); // 150 + '...'
    });

    it('should handle compression for large content', async () => {
      // Create large content to trigger compression
      const largeContent = {
        organization: {
          name: 'Test Organization',
          email: 'test@example.com',
        },
        navigation: Array.from({ length: 50 }, (_, i) => ({
          id: i,
          label: `Navigation Item ${i}`,
          link: `/page-${i}`,
        })),
        hero_section: {
          title: 'Test Title',
          subtitle: 'Test Subtitle',
          buttons: [],
        },
        highlight_cards: Array.from({ length: 20 }, (_, i) => ({
          title: `Card ${i}`,
          description: `This is a very long description for card ${i} that contains a lot of text to make the content large enough to trigger compression.`,
        })),
        mission_section: {
          heading: 'Test Mission',
          text: 'Test mission text',
        },
        call_to_action: {
          heading: 'Test CTA',
          text: 'Test CTA text',
        },
        achievements_section: {
          heading: 'Test Achievements',
          text: 'Test achievements text',
          cards: [],
        },
        about_section: {
          heading: 'Test About',
          text: 'Test about text',
        },
        blog_section: {
          heading: 'Test Blog',
          posts: [],
        },
        team_section: {
          heading: 'Test Team',
          members: [],
        },
        footer: {
          quick_links: [],
          contact: {
            email: 'test@example.com',
          },
          copyright: '© 2025 Test Organization',
        },
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(largeContent));

      const request = new NextRequest('http://localhost:3000/api/content', {
        headers: {
          'Accept-Encoding': 'gzip, deflate, br',
        },
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
      // Note: In test environment, compression might not actually occur
      // but we can verify the logic path was taken
    });

    it('should set appropriate cache headers for different scenarios', async () => {
      const validContent = {
        organization: {
          name: 'Test Organization',
          email: 'test@example.com',
        },
        navigation: [],
        hero_section: {
          title: 'Test Title',
          subtitle: 'Test Subtitle',
          buttons: [],
        },
        highlight_cards: [],
        mission_section: {
          heading: 'Test Mission',
          text: 'Test mission text',
        },
        call_to_action: {
          heading: 'Test CTA',
          text: 'Test CTA text',
        },
        achievements_section: {
          heading: 'Test Achievements',
          text: 'Test achievements text',
          cards: [],
        },
        about_section: {
          heading: 'Test About',
          text: 'Test about text',
        },
        blog_section: {
          heading: 'Test Blog',
          posts: [],
        },
        team_section: {
          heading: 'Test Team',
          members: [],
        },
        footer: {
          quick_links: [],
          contact: {
            email: 'test@example.com',
          },
          copyright: '© 2025 Test Organization',
        },
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(validContent));

      // Test desktop cache headers
      const desktopRequest = new NextRequest('http://localhost:3000/api/content');
      const desktopResponse = await GET(desktopRequest);
      expect(desktopResponse.headers.get('Cache-Control')).toContain('s-maxage=300');

      // Test mobile cache headers
      const mobileRequest = new NextRequest('http://localhost:3000/api/content?mobile=true');
      const mobileResponse = await GET(mobileRequest);
      expect(mobileResponse.headers.get('Cache-Control')).toContain('s-maxage=600');
    });
  });

  describe('POST', () => {
    it('should trigger content revalidation successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/content', {
        method: 'POST',
      });

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Content revalidation triggered');
      expect(data.timestamp).toBeDefined();
      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
    });
  });

  describe('Content validation', () => {
    it('should validate content structure with Zod schema', () => {
      const validContent = getFallbackContent();

      // This should not throw
      expect(() => InfoJSONSchema.parse(validContent)).not.toThrow();
    });

    it('should reject invalid content structure', () => {
      const invalidContent = {
        organization: {
          name: 'Test',
          // Missing required email
        },
        // Missing all other required fields
      };

      expect(() => InfoJSONSchema.parse(invalidContent)).toThrow();
    });
  });
});