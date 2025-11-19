import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import ProgramDetail from '@/components/public/ProgramDetail'
import LoadingSpinner from '@/components/common/LoadingSpinner'

interface ProgramPageProps {
  params: {
    slug: string
  }
}

// Fetch program by slug from API
async function getProgram(slug: string) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/programs?slug=${slug}`, {
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
  const program = await getProgram(params.slug)

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