export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header público */}
      <header className="bg-violet-700 text-white sticky top-0 z-50 shadow-md">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">🛍️</span>
          <div>
            <h1 className="font-bold text-lg leading-tight">Tienda Frontera</h1>
            <p className="text-violet-300 text-xs">Productos desde Panamá</p>
          </div>
        </div>
      </header>

      {/* Navegación pública */}
      <nav className="bg-white border-b sticky top-[60px] z-40">
        <div className="max-w-2xl mx-auto px-4 flex gap-1 py-2">
          <a href="/tienda"
            className="px-4 py-2 rounded-lg text-sm font-medium text-violet-700 hover:bg-violet-50 transition-colors">
            🛒 Tienda
          </a>
          <a href="/tienda/pedidos"
            className="px-4 py-2 rounded-lg text-sm font-medium text-violet-700 hover:bg-violet-50 transition-colors">
            📦 Hacer un encargo
          </a>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-10">
        {children}
      </main>
    </div>
  )
}