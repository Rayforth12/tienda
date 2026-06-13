import Navbar from '@/components/Navbar'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="md:ml-56 pb-20 md:pb-0">
        <div className="p-4 md:p-6 max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}