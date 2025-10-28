// Main homepage - using the public route structure
export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">ARPU Future Rise Life Foundation</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Supporting communities through education, healthcare, and sustainable development programs
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/donate"
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Donate Now
          </a>
          <a
            href="/programs"
            className="border border-border px-6 py-3 rounded-lg hover:bg-accent transition-colors"
          >
            View Programs
          </a>
        </div>
      </div>
    </div>
  )
}
