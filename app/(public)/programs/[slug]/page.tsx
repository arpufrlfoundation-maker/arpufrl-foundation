import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import ProgramDetail from '@/components/public/ProgramDetail'
import LoadingSpinner from '@/components/common/LoadingSpinner'

interface ProgramPageProps {
  params: {
    slug: string
  }
}

// Mock function to fetch program by slug - replace with actual API call
async function getProgram(slug: string) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))

  const mockPrograms = [
    {
      _id: '1',
      name: 'Education for All',
      slug: 'education-for-all',
      description: 'Providing quality education and learning resources to underprivileged children in rural communities.',
      longDescription: `Our Education for All program is a comprehensive initiative designed to bridge the educational gap in rural India. We focus on providing quality education through multiple channels:

**Key Components:**
- **Infrastructure Development**: Building and renovating schools in remote areas
- **Teacher Training**: Comprehensive training programs for local educators
- **Learning Resources**: Providing books, digital tools, and educational materials
- **Scholarship Programs**: Financial support for deserving students
- **Adult Literacy**: Programs for parents and community members

**Impact Areas:**
We currently operate in 15 districts across 5 states, directly impacting over 5,000 children and their families. Our holistic approach ensures that education becomes a sustainable part of the community fabric.

**Success Stories:**
Many of our beneficiaries have gone on to pursue higher education and secure meaningful employment, breaking the cycle of poverty in their families.`,
      image: '/images/education-program.jpg',
      gallery: [
        '/images/education-1.jpg',
        '/images/education-2.jpg',
        '/images/education-3.jpg'
      ],
      targetAmount: 500000,
      raisedAmount: 325000,
      donationCount: 156,
      active: true,
      featured: true,
      category: 'education',
      metaTitle: 'Education for All - ARPU Future Rise Life Foundation',
      metaDescription: 'Support our Education for All program providing quality education to underprivileged children in rural communities.'
    },
    {
      _id: '2',
      name: 'Healthcare Access',
      slug: 'healthcare-access',
      description: 'Ensuring basic healthcare services and medical support reach remote villages and urban slums.',
      longDescription: `Healthcare Access initiative brings essential medical services to underserved areas through innovative delivery methods:

**Program Features:**
- **Mobile Clinics**: Fully equipped medical vans serving remote villages
- **Telemedicine**: Digital consultations with specialist doctors
- **Community Health Workers**: Training local volunteers as health advocates
- **Preventive Care**: Vaccination drives and health awareness campaigns
- **Emergency Response**: 24/7 ambulance services for critical cases

**Medical Services:**
Our comprehensive healthcare approach covers primary care, maternal health, child nutrition, and chronic disease management.

**Technology Integration:**
We leverage technology to maintain electronic health records and provide remote consultations, ensuring continuity of care even in the most remote locations.`,
      image: '/images/healthcare-program.jpg',
      gallery: [
        '/images/healthcare-1.jpg',
        '/images/healthcare-2.jpg'
      ],
      targetAmount: 750000,
      raisedAmount: 480000,
      donationCount: 203,
      active: true,
      featured: true,
      category: 'healthcare',
      metaTitle: 'Healthcare Access - ARPU Future Rise Life Foundation',
      metaDescription: 'Support healthcare access for remote villages and urban slums through mobile clinics and telemedicine.'
    }
  ]

  return mockPrograms.find(program => program.slug === slug)
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