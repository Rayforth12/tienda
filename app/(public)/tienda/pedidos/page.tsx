'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Pedido } from '@/types'
import { formatearFecha } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, ChevronRight, Package } from 'lucide-react'
import Link from 'next/link'

export default function PedidosPublicosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      const supabase = createClient()
      const hoy = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('pedidos')
        .select('*')
        .eq('estado', 'abierto')
        .gte('fecha_limite', hoy)
        .order('fecha_limite', { ascending: true })
      setPedidos(data || [])
      setLoading(false)
    }
    cargar()
  }, [])

  if (loading) return (
    <div className="text-center py-16 text-gray-400">
      <Package size={40} className="mx-auto mb-3 opacity-30" />
      <p>Cargando pedidos...</p>
    </div>
  )

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Hacer un encargo</h2>
        <p className="text-sm text-gray-500 mt-1">
          Seleccioná un viaje y agregá los productos que querés que te traigan desde Panamá.
        </p>
      </div>

      {pedidos.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16 text-gray-400">
            <Package size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No hay viajes abiertos en este momento.</p>
            <p className="text-sm mt-1">Revisá más adelante o escribinos por WhatsApp.</p>
            <a
              href="https://wa.me/50688427367"
              target="_blank"
              className="inline-block mt-4 bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
            >
              Escribir por WhatsApp
            </a>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pedidos.map(p => {
            const diasRestantes = Math.ceil(
              (new Date(p.fecha_limite + 'T00:00:00').getTime() - new Date().setHours(0,0,0,0)) /
              (1000 * 60 * 60 * 24)
            )
            return (
              <Link key={p.id} href={`/tienda/pedidos/${p.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="py-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">{p.nombre}</h3>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar size={12} />
                        <span>Cierre: {formatearFecha(p.fecha_limite)}</span>
                      </div>
                      {p.fecha_entrega && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Entrega estimada: {formatearFecha(p.fecha_entrega)}
                        </p>
                      )}
                      <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                        diasRestantes <= 2
                          ? 'bg-red-100 text-red-600'
                          : diasRestantes <= 5
                          ? 'bg-yellow-100 text-yellow-600'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {diasRestantes === 1 ? '⚠️ Último día' :
                         diasRestantes <= 2 ? `⚠️ ${diasRestantes} días restantes` :
                         `✅ ${diasRestantes} días restantes`}
                      </span>
                    </div>
                    <ChevronRight size={18} className="text-gray-400" />
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}