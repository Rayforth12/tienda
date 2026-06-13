'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getPedidos, cerrarPedidosVencidos } from '@/lib/queries/pedidos'
import { Pedido } from '@/types'
import { formatearFecha, pedidoEstaVencido } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, ChevronRight, Calendar, Package } from 'lucide-react'

const estadoConfig = {
  abierto: { label: 'Abierto', class: 'bg-green-100 text-green-700' },
  cerrado: { label: 'Cerrado', class: 'bg-yellow-100 text-yellow-700' },
  entregado: { label: 'Entregado', class: 'bg-gray-100 text-gray-600' },
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      await cerrarPedidosVencidos()
      const data = await getPedidos()
      setPedidos(data)
      setLoading(false)
    }
    cargar()
  }, [])

  if (loading) return <p className="text-gray-400">Cargando pedidos...</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-violet-700">Pedidos</h1>
          <p className="text-sm text-gray-500">{pedidos.length} pedidos en total</p>
        </div>
        <Link href="/pedidos/nuevo">
          <Button className="bg-violet-600 hover:bg-violet-700 gap-2">
            <Plus size={16} /> Nuevo pedido
          </Button>
        </Link>
      </div>

      {pedidos.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-gray-400">
            <Package size={40} className="mx-auto mb-3 opacity-30" />
            <p>No hay pedidos todavía.</p>
            <p className="text-sm">Creá el primero con el botón de arriba.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pedidos.map((pedido) => {
            const cfg = estadoConfig[pedido.estado]
            const vencido = pedidoEstaVencido(pedido.fecha_limite)
            return (
              <Link key={pedido.id} href={`/pedidos/${pedido.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="font-semibold text-gray-800">{pedido.nombre}</h2>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.class}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          Cierre: {formatearFecha(pedido.fecha_limite)}
                          {vencido && pedido.estado === 'abierto' && (
                            <span className="text-red-500 font-medium ml-1">· Vencido</span>
                          )}
                        </span>
                        {pedido.fecha_entrega && (
                          <span>Entrega: {formatearFecha(pedido.fecha_entrega)}</span>
                        )}
                      </div>
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