import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
import ProgramDetail from '@/components/public/ProgramDetail'
import LoadingSpinner from '@/components/common/LoadingSpinner'

interface ProgramPageProps {
  params: {
    slug: string
  }
}

// Clean slug by removing trailing/leading hyphens
function cleanSlug(slug: string): string {
  return slug.replace(/-+$/, '').replace(/^-+/, '').trim()
}

// Fetch program by slug from API
async function getProgram(slug: string) {
  try {
    const clean = cleanSlug(slug)
    
    const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || 'https://arpufrl.org'
    const response = await fetch(`${baseUrl}/api/programs?slug=${clean}`, {
      cache: 'no-store',
      next: { revalidate: 60 } // Revalidate every minute
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    if (data.success && data.data?.programs?.length > 0) {
      return data.data.programs[0]
    }

    return null
  } catch (error) {
    console.error('Error fetching program:', error)
    return null
  }
}

export default async function ProgramPage({ params }: ProgramPageProps) {
  const { slug } = params
  const clean = cleanSlug(slug)
  
  // Redirect if slug has trailing/leading hyphens
  if (slug !== clean) {
    redirect(`/programs/${clean}`)
  }
  
  const program = await getProgram(slug)

  if (!program) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<LoadingSpinner />}>
        <ProgramDetail program={program} />
      </Suspense>
    </div>
  )
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ProgramPageProps) {
  const program = await getProgram(params.slug)

  if (!program) {
    return {
      title: 'Program Not Found - ARPU Future Rise Life Foundation',
      description: 'The requested program could not be found.'
    }
  }

  return {
    title: program.metaTitle || `${program.name} - ARPU Future Rise Life Foundation`,
    description: program.metaDescription || program.description,
    openGraph: {
      title: program.name,
      description: program.description,
      images: program.image ? [program.image] : [],
      type: 'article'
    }
  }
}