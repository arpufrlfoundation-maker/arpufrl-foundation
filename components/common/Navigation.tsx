import Link from 'next/link'

interface BreadcrumbItem {
  name: string
  href?: string
}

interface NavigationProps {
  items: BreadcrumbItem[]
}

export default function Navigation({ items }: NavigationProps) {
  return (
    <nav className="bg-white border-b">
      <div className="container mx-auto px-4 py-4">
        <ol className="flex items-center space-x-2 text-sm text-gray-600">
          {items.map((item, index) => (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <span className="mx-2 text-gray-400">/</span>
              )}

              {item.href ? (
                <Link
                  href={item.href}
                  className="hover:text-blue-600 transition-colors"
                >
                  {item.name}
                </Link>
              ) : (
                <span className="text-gray-900 font-medium">
                  {item.name}
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  )
}