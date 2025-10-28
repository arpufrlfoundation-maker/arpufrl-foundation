import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { InfoJSONSchema, getFallbackContent } from '@/lib/content-types';
import { gzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mobile = searchParams.get('mobile') === 'true';
    const acceptsGzip = request.headers.get('accept-encoding')?.includes('gzip') || false;

    // Read the info.json file
    const filePath = path.join(process.cwd(), 'data', 'info.json');
    const fileContent = await fs.readFile(filePath, 'utf8');

    // Parse JSON content
    let jsonData;
    try {
      jsonData = JSON.parse(fileContent);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);

      // Return fallback content with appropriate headers
      const fallbackContent = getFallbackContent();
      const responseData = mobile ? optimizeForMobile(fallbackContent) : fallbackContent;

      return NextResponse.json(responseData, {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          'Content-Type': 'application/json',
          'X-Content-Source': 'fallback',
          'X-Error': 'json-parse-error',
          'X-Mobile-Optimized': mobile.toString()
        }
      });
    }

    // Validate the JSON structure using Zod schema
    let validatedData;
    try {
      validatedData = InfoJSONSchema.parse(jsonData);
    } catch (validationError) {
      console.error('Content validation error:', validationError);

      // Log validation errors for debugging
      if (validationError instanceof Error) {
        console.error('Validation details:', validationError.message);
      }

      // Return fallback content for validation errors
      const fallbackContent = getFallbackContent();
      const responseData = mobile ? optimizeForMobile(fallbackContent) : fallbackContent;

      return NextResponse.json(responseData, {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          'Content-Type': 'application/json',
          'X-Content-Source': 'fallback',
          'X-Error': 'validation-error',
          'X-Mobile-Optimized': mobile.toString()
        }
      });
    }

    // Optimize content for mobile if requested
    const responseData = mobile ? optimizeForMobile(validatedData) : validatedData;

    // Prepare response headers
    const headers: Record<string, string> = {
      'Cache-Control': mobile
        ? 'public, s-maxage=600, stale-while-revalidate=1200' // Longer cache for mobile
        : 'public, s-maxage=300, stale-while-revalidate=600',
      'Content-Type': 'application/json',
      'X-Content-Source': 'file',
      'X-Mobile-Optimized': mobile.toString(),
      'Last-Modified': new Date().toUTCString(),
      'Vary': 'Accept-Encoding'
    };

    // Add compression if supported and content is large
    const jsonString = JSON.stringify(responseData);
    if (acceptsGzip && jsonString.length > 1024) {
      try {
        const compressed = await gzipAsync(Buffer.from(jsonString));
        headers['Content-Encoding'] = 'gzip';
        headers['Content-Length'] = compressed.length.toString();

        return new Response(compressed, {
          status: 200,
          headers
        });
      } catch (compressionError) {
        console.warn('Compression failed, serving uncompressed:', compressionError);
      }
    }

    // Return uncompressed response
    return NextResponse.json(responseData, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Content loading error:', error);

    // Return fallback content for any other errors
    const fallbackContent = getFallbackContent();
    const mobile = new URL(request.url).searchParams.get('mobile') === 'true';
    const responseData = mobile ? optimizeForMobile(fallbackContent) : fallbackContent;

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'Content-Type': 'application/json',
        'X-Content-Source': 'fallback',
        'X-Error': 'file-read-error',
        'X-Mobile-Optimized': mobile.toString()
      }
    });
  }
}

// Mobile optimization function to reduce payload size
function optimizeForMobile(content: any) {
  return {
    ...content,
    // Reduce image URLs to placeholders for faster loading
    hero_section: {
      ...content.hero_section,
      image: content.hero_section.image ? '/api/image/placeholder?w=800&h=400' : null
    },
    highlight_cards: content.highlight_cards.map((card: any) => ({
      ...card,
      image: card.image ? '/api/image/placeholder?w=300&h=200' : null
    })),
    achievements_section: {
      ...content.achievements_section,
      cards: content.achievements_section.cards.map((card: any) => ({
        ...card,
        image: card.image ? '/api/image/placeholder?w=200&h=150' : null
      }))
    },
    blog_section: {
      ...content.blog_section,
      posts: content.blog_section.posts.map((post: any) => ({
        ...post,
        image: post.image ? '/api/image/placeholder?w=250&h=150' : null
      }))
    },
    team_section: {
      ...content.team_section,
      members: content.team_section.members.map((member: any) => ({
        ...member,
        profile_image: member.profile_image ? '/api/image/placeholder?w=150&h=150' : null
      }))
    },
    // Truncate long text content for mobile
    mission_section: {
      ...content.mission_section,
      text: content.mission_section.text.length > 200
        ? content.mission_section.text.substring(0, 200) + '...'
        : content.mission_section.text
    },
    about_section: {
      ...content.about_section,
      text: content.about_section.text.length > 150
        ? content.about_section.text.substring(0, 150) + '...'
        : content.about_section.text
    }
  };
}

// Optional: Add revalidation endpoint for cache invalidation
export async function POST() {
  try {
    // This endpoint can be used to trigger content revalidation
    // For example, when content is updated via admin interface

    return NextResponse.json(
      { message: 'Content revalidation triggered', timestamp: new Date().toISOString() },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    );
  } catch (error) {
    console.error('Content revalidation error:', error);

    return NextResponse.json(
      { error: 'Failed to trigger content revalidation' },
      { status: 500 }
    );
  }
}