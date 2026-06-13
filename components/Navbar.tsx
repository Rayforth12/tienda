'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  Settings,
  LogOut,
} from 'lucide-react'

const links = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { href: '/inventario', label: 'Inventario', icon: Package },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/configuracion', label: 'Configuración', icon: Settings },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Sidebar para pantallas grandes */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen bg-violet-700 text-white fixed left-0 top-0">
        <div className="p-5 border-b border-violet-600">
          <div className="text-2xl mb-1">🛍️</div>
          <h1 className="font-bold text-lg leading-tight">Tienda Frontera</h1>
          <p className="text-violet-300 text-xs">Gestión de pedidos</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-white text-violet-700'
                    : 'text-violet-100 hover:bg-violet-600'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-violet-600">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-violet-100 hover:bg-violet-600 w-full transition-colors"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Barra inferior para celular */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-violet-700 text-white flex justify-around items-center h-16 z-50">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 text-xs px-2 py-1 rounded-lg transition-colors ${
                active ? 'text-white font-bold' : 'text-violet-300'
              }`}
            >
              <Icon size={20} />
              {label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}