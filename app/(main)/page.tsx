'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { formatearPrecio } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, Legend
} from 'recharts'
import { TrendingUp, ShoppingBag, Package, AlertCircle } from 'lucide-react'

const COLORES = ['#7C3AED', '#DB2777', '#059669', '#D97706', '#2563EB', '#DC2626']

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [gananciaPorPedido, setGananciaPorPedido] = useState<any[]>([])
  const [gananciasPorCategoria, setGananciasPorCategoria] = useState<any[]>([])
  const [gananciaMensual, setGananciaMensual] = useState<any[]>([])
  const [articulosMasPedidos, setArticulosMasPedidos] = useState<any[]>([])
  const [resumen, setResumen] = useState({
    gananciaTotal: 0,
    gananciaUltimoPedido: 0,
    articulosDisponibles: 0,
    cobrosPendientes: 0,
  })

  useEffect(() => {
    async function cargar() {
      const supabase = createClient()

      // Traer todos los pedidos con sus solicitudes
      const { data: pedidos } = await supabase
        .from('pedidos')
        .select('*, solicitudes(*)')
        .order('created_at', { ascending: true })

      // Traer inventario disponible
      const { data: inventario } = await supabase
        .from('inventario')
        .select('*')
        .eq('estado', 'disponible')

      if (!pedidos) return

      // Ganancia por pedido
      const porPedido = pedidos.map(p => ({
        nombre: p.nombre.length > 15 ? p.nombre.slice(0, 15) + '...' : p.nombre,
        ganancia: (p.solicitudes || []).reduce((acc: number, s: any) => acc + (s.ganancia || 0), 0),
        ventas: (p.solicitudes || []).reduce((acc: number, s: any) => acc + (s.precio_venta || 0), 0),
      }))
      setGananciaPorPedido(porPedido)

      // Ganancia mensual
      const porMes: Record<string, number> = {}
      pedidos.forEach(p => {
        const mes = new Date(p.created_at).toLocaleDateString('es-CR', { month: 'short', year: '2-digit' })
        const ganancia = (p.solicitudes || []).reduce((acc: number, s: any) => acc + (s.ganancia || 0), 0)
        porMes[mes] = (porMes[mes] || 0) + ganancia
      })
      setGananciaMensual(Object.entries(porMes).map(([mes, ganancia]) => ({ mes, ganancia })))

      // Artículos más pedidos
      const conteo: Record<string, number> = {}
      pedidos.forEach(p => {
        (p.solicitudes || []).forEach((s: any) => {
          const nombre = s.articulo.length > 20 ? s.articulo.slice(0, 20) + '...' : s.articulo
          conteo[nombre] = (conteo[nombre] || 0) + 1
        })
      })
      const top = Object.entries(conteo)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }))
      setArticulosMasPedidos(top)

      // Ganancias por categoría
      const porCategoria: Record<string, number> = {}
      pedidos.forEach(p => {
        (p.solicitudes || []).forEach((s: any) => {
          const cat = s.categoria || 'sin_categoria'
          const label = cat === 'sin_categoria' ? 'Sin categoría' :
            cat === 'cuidado_personal' ? 'Cuidado personal' :
            cat === 'dulces_snacks' ? 'Dulces y snacks' :
            cat.charAt(0).toUpperCase() + cat.slice(1)
          porCategoria[label] = (porCategoria[label] || 0) + (s.ganancia || 0)
        })
      })
      const categoriaData = Object.entries(porCategoria)
        .filter(([, v]) => v > 0)
        .sort(([, a], [, b]) => b - a)
        .map(([name, ganancia]) => ({ name, ganancia }))
      setGananciasPorCategoria(categoriaData)

      // Resumen
      const todasSolicitudes = pedidos.flatMap(p => p.solicitudes || [])
      const gananciaTotal = todasSolicitudes.reduce((acc: number, s: any) => acc + (s.ganancia || 0), 0)
      const ultimoPedido = pedidos[pedidos.length - 1]
      const gananciaUltimo = ultimoPedido
        ? (ultimoPedido.solicitudes || []).reduce((acc: number, s: any) => acc + (s.ganancia || 0), 0)
        : 0
      const cobrosPendientes = todasSolicitudes
        .filter((s: any) => !s.cobrado && s.precio_venta)
        .reduce((acc: number, s: any) => acc + (s.precio_venta || 0), 0)

      setResumen({
        gananciaTotal, 
        gananciaUltimoPedido: gananciaUltimo,
        articulosDisponibles: inventario?.length || 0,
        cobrosPendientes,
      })

      setLoading(false)
    }
    cargar()
  }, [])

  if (loading) return <p className="text-gray-400">Cargando dashboard...</p>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-violet-700">Dashboard</h1>
        <p className="text-sm text-gray-500">Resumen del negocio</p>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-violet-500" />
              <p className="text-xs text-gray-500">Ganancia total</p>
            </div>
            <p className="text-lg font-bold text-violet-700">{formatearPrecio(resumen.gananciaTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingBag size={16} className="text-pink-500" />
              <p className="text-xs text-gray-500">Último pedido</p>
            </div>
            <p className="text-lg font-bold text-pink-600">{formatearPrecio(resumen.gananciaUltimoPedido)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Package size={16} className="text-green-500" />
              <p className="text-xs text-gray-500">En inventario</p>
            </div>
            <p className="text-lg font-bold text-green-600">{resumen.articulosDisponibles} artículos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle size={16} className="text-orange-500" />
              <p className="text-xs text-gray-500">Por cobrar</p>
            </div>
            <p className="text-lg font-bold text-orange-600">{formatearPrecio(resumen.cobrosPendientes)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfica de barras — ganancia por pedido */}
      {gananciaPorPedido.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm text-gray-700">Ganancia por pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={gananciaPorPedido} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₡${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => formatearPrecio(v)} />
                <Bar dataKey="ganancia" name="Ganancia" fill="#7C3AED" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {gananciasPorCategoria.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm text-gray-700">Ganancia por categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={gananciasPorCategoria} margin={{ top: 5, right: 10, left: 10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₡${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => formatearPrecio(v)} />
                <Bar dataKey="ganancia" name="Ganancia" fill="#DB2777" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gráfica de línea — evolución mensual */}
        {gananciaMensual.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-gray-700">Evolución mensual</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={gananciaMensual}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₡${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => formatearPrecio(v)} />
                  <Line type="monotone" dataKey="ganancia" name="Ganancia"
                    stroke="#DB2777" strokeWidth={2} dot={{ fill: '#DB2777' }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Gráfica de pastel — artículos más pedidos */}
        {articulosMasPedidos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-gray-700">Artículos más pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={articulosMasPedidos} cx="50%" cy="50%"
                    outerRadius={70} dataKey="value" nameKey="name">
                    {articulosMasPedidos.map((_, i) => (
                      <Cell key={i} fill={COLORES[i % COLORES.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {gananciaPorPedido.length === 0 && (
        <Card>
          <CardContent className="text-center py-12 text-gray-400">
            <TrendingUp size={40} className="mx-auto mb-3 opacity-30" />
            <p>Las gráficas aparecerán cuando haya pedidos con solicitudes.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}