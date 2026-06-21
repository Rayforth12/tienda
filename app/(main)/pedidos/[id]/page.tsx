'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getPedidoById, updatePedido } from '@/lib/queries/pedidos'
import { Pedido, Solicitud } from '@/types'
import { formatearFecha, formatearPrecio, pedidoEstaVencido } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Plus, User, MapPin, Package, CheckCircle, XCircle, Clock, Truck, Search } from 'lucide-react'
import GastosPedido from '@/components/pedidos/GastosPedido'
import { getGastosByPedido } from '@/lib/queries/gastos'


const estadoSolicitud: Record<string, { label: string; icon: React.ReactNode; class: string }> = {
  pendiente:     { label: 'Pendiente',     icon: <Clock size={13} />,       class: 'bg-yellow-100 text-yellow-700' },
  conseguido:    { label: 'Conseguido',    icon: <CheckCircle size={13} />, class: 'bg-green-100 text-green-700' },
  no_disponible: { label: 'No disponible', icon: <XCircle size={13} />,     class: 'bg-red-100 text-red-700' },
  entregado:     { label: 'Entregado',     icon: <Truck size={13} />,       class: 'bg-gray-100 text-gray-600' },
}

export default function PedidoDetallePage() {
  const { id } = useParams()
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [totalGastos, setTotalGastos] = useState(0)

  async function cargar() {
    const data = await getPedidoById(id as string)
    const gastos = await getGastosByPedido(id as string)
    setPedido(data)
    setLoading(false)
    setTotalGastos(gastos.reduce((acc, g) => acc + g.monto, 0))
  }

 useEffect(() => {
    void cargar()
    // eslint-disable-next-line react-hooks/set-state-in-effect
  }, [id])

  async function handleCerrar() {
    if (!confirm('¿Cerrar este pedido? Ya no se podrán agregar solicitudes.')) return
    await updatePedido(id as string, { estado: 'cerrado' })
    cargar()
  }

  async function handleEntregar() {
    if (!confirm('¿Marcar este pedido como entregado?')) return
    await updatePedido(id as string, { estado: 'entregado' })
    cargar()
  }

  if (loading) return <p className="text-gray-400">Cargando...</p>
  if (!pedido) return <p className="text-red-500">Pedido no encontrado.</p>

  const solicitudes = (pedido.solicitudes || []) as Solicitud[]
  const totalGanancia = solicitudes.reduce((acc, s) => acc + (s.ganancia || 0), 0)
  const totalVenta = solicitudes.reduce((acc, s) => acc + (s.precio_venta || 0), 0)
  const vencido = pedidoEstaVencido(pedido.fecha_limite)
  const puedeAgregar = pedido.estado === 'abierto' && !vencido

  // Filtro combinado: búsqueda + estado
  const solicitudesFiltradas = solicitudes.filter(s => {
    const texto = busqueda.toLowerCase()
    const coincideTexto =
      s.articulo.toLowerCase().includes(texto) ||
      s.cliente?.nombre?.toLowerCase().includes(texto) ||
      s.lugar_entrega?.toLowerCase().includes(texto) || false

    const coincideEstado = filtroEstado === 'todos' || s.estado === filtroEstado

    return coincideTexto && coincideEstado
  })

  return (
    <div>
      {/* Encabezado */}
      <div className="flex items-center gap-3 mb-2">
        <Link href="/pedidos">
          <Button variant="ghost" size="icon"><ArrowLeft size={18} /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-violet-700">{pedido.nombre}</h1>
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5 flex-wrap">
            <span>Cierre: {formatearFecha(pedido.fecha_limite)}</span>
            {pedido.fecha_entrega && <span>Entrega: {formatearFecha(pedido.fecha_entrega)}</span>}
            <span className={`px-2 py-0.5 rounded-full font-medium ${
              pedido.estado === 'abierto' ? 'bg-green-100 text-green-700' :
              pedido.estado === 'cerrado' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {pedido.estado.charAt(0).toUpperCase() + pedido.estado.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Resumen */}
      {solicitudes.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Card><CardContent className="pt-4 pb-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Solicitudes</p>
            <p className="text-2xl font-bold text-violet-700">{solicitudes.length}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Total ventas</p>
            <p className="text-lg font-bold text-gray-700">{formatearPrecio(totalVenta)}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Ganancia bruta</p>
            <p className="text-lg font-bold text-green-600">{formatearPrecio(totalGanancia)}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Ganancia neta</p>
            <p className={`text-lg font-bold ${totalGanancia - totalGastos >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {formatearPrecio(totalGanancia - totalGastos)}
            </p>
            {totalGastos > 0 && (
              <p className="text-xs text-red-400">-{formatearPrecio(totalGastos)} gastos</p>
            )}
          </CardContent></Card>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {puedeAgregar && (
          <Link href={`/pedidos/${id}/solicitud/nueva`}>
            <Button className="bg-violet-600 hover:bg-violet-700 gap-2">
              <Plus size={16} /> Agregar solicitud
            </Button>
          </Link>
        )}
        {pedido.estado === 'abierto' && (
          <Button variant="outline" onClick={handleCerrar}>Cerrar pedido</Button>
        )}
        {pedido.estado === 'cerrado' && (
          <Button variant="outline" onClick={handleEntregar}>Marcar como entregado</Button>
        )}
        {!puedeAgregar && pedido.estado === 'abierto' && (
          <p className="text-sm text-red-500 self-center">
            ⚠️ La fecha límite venció — no se pueden agregar más solicitudes.
          </p>
        )}
      </div>

      {/* Gastos del viaje */}
      <GastosPedido pedidoId={id as string} />
      
      {/* Búsqueda y filtros */}
      {solicitudes.length > 0 && (
        <div className="space-y-3 mb-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar por artículo, cliente o lugar de entrega..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['todos', 'pendiente', 'conseguido', 'no_disponible', 'entregado'].map(e => (
              <button
                key={e}
                onClick={() => setFiltroEstado(e)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filtroEstado === e
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {e === 'todos' ? 'Todos' :
                 e === 'pendiente' ? 'Pendiente' :
                 e === 'conseguido' ? 'Conseguido' :
                 e === 'no_disponible' ? 'No disponible' : 'Entregado'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lista de solicitudes */}
      <h2 className="font-semibold text-gray-700 mb-3">
        Solicitudes ({solicitudesFiltradas.length}{busqueda || filtroEstado !== 'todos' ? ` de ${solicitudes.length}` : ''})
      </h2>

      {solicitudes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-10 text-gray-400">
            <Package size={36} className="mx-auto mb-2 opacity-30" />
            <p>No hay solicitudes en este pedido.</p>
            {puedeAgregar && <p className="text-sm mt-1">Usá el botón de arriba para agregar la primera.</p>}
          </CardContent>
        </Card>
      ) : solicitudesFiltradas.length === 0 ? (
        <Card>
          <CardContent className="text-center py-10 text-gray-400">
            <Search size={36} className="mx-auto mb-2 opacity-30" />
            <p>No se encontraron solicitudes.</p>
            <button onClick={() => { setBusqueda(''); setFiltroEstado('todos') }}
              className="text-xs text-violet-600 hover:underline mt-1">
              Limpiar filtros
            </button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {solicitudesFiltradas.map((s) => {
            const est = estadoSolicitud[s.estado]
            return (
              <Link key={s.id} href={`/pedidos/${id}/solicitud/${s.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-gray-800 truncate">{s.articulo}</span>
                          <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${est.class}`}>
                            {est.icon} {est.label}
                          </span>
                          {s.cobrado && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                              Cobrado ✓
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                          <User size={11} />
                          <span>{s.cliente?.nombre || 'Sin cliente'}</span>
                        </div>
                        {s.lugar_entrega && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin size={11} />
                            <span className="truncate">{s.lugar_entrega}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        {s.precio_venta && (
                          <p className="font-semibold text-gray-700">{formatearPrecio(s.precio_venta)}</p>
                        )}
                        {s.ganancia != null && s.ganancia > 0 && (
                          <p className="text-xs text-green-600">+{formatearPrecio(s.ganancia)}</p>
                        )}
                      </div>
                    </div>
                    {s.imagen_url && (
                      <img src={s.imagen_url} alt="Referencia"
                        className="mt-2 h-16 w-16 object-cover rounded-lg border" />
                    )}
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