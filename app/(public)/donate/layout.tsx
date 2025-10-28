import { generateMetadata, pageMetadata } from '@/lib/seo'

export const metadata = generateMetadata(pageMetadata.donate)

export default function DonateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}