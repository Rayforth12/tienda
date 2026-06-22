'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { ArticuloInventario } from '@/types'
import { formatearPrecio } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ShoppingCart, Plus, Minus, Trash2, Package, Send } from 'lucide-react'

interface ItemCarrito {
  articulo: ArticuloInventario
  cantidad: number
}

const WHATSAPP = '50688427367'

export default function TiendaPage() {
  const [articulos, setArticulos] = useState<ArticuloInventario[]>([])
  const [loading, setLoading] = useState(true)
  const [carrito, setCarrito] = useState<ItemCarrito[]>([])
  const [carritoAbierto, setCarritoAbierto] = useState(false)
  const [checkout, setCheckout] = useState(false)
  const [filtro, setFiltro] = useState('todos')
  const [form, setForm] = useState({ nombre: '', apellidos: '', lugar_entrega: '' })
  const [error, setError] = useState('')
  const [imagenViewer, setImagenViewer] = useState<string | null>(null)

  useEffect(() => {
    async function cargar() {
      const supabase = createClient()
      const { data } = await supabase
        .from('inventario')
        .select('*')
        .eq('estado', 'disponible')
        .gt('cantidad', 0)
        .order('created_at', { ascending: false })
      setArticulos(data || [])
      setLoading(false)
    }
    cargar()
  }, [])

  function agregarAlCarrito(articulo: ArticuloInventario) {
    setCarrito(prev => {
      const existe = prev.find(i => i.articulo.id === articulo.id)
      if (existe) {
        return prev.map(i =>
          i.articulo.id === articulo.id
            ? { ...i, cantidad: Math.min(i.cantidad + 1, articulo.cantidad) }
            : i
        )
      }
      return [...prev, { articulo, cantidad: 1 }]
    })
  }

  function cambiarCantidad(id: string, delta: number) {
    setCarrito(prev =>
      prev.map(i => {
        if (i.articulo.id !== id) return i
        const nueva = i.cantidad + delta
        if (nueva <= 0) return i
        if (nueva > i.articulo.cantidad) return i
        return { ...i, cantidad: nueva }
      })
    )
  }

  function eliminarDelCarrito(id: string) {
    setCarrito(prev => prev.filter(i => i.articulo.id !== id))
  }

  const totalCarrito = carrito.reduce((acc, i) => acc + i.articulo.precio_venta * i.cantidad, 0)
  const cantidadItems = carrito.reduce((acc, i) => acc + i.cantidad, 0)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleEnviar() {
    if (!form.nombre || !form.apellidos || !form.lugar_entrega) {
      setError('Por favor completá todos los campos.')
      return
    }

    const lineas = carrito.map(i =>
      `• ${i.articulo.nombre} x${i.cantidad} — ${formatearPrecio(i.articulo.precio_venta * i.cantidad)}`
    ).join('\n')

    const mensaje = `¡Hola! Quiero hacer un pedido 🛍️

*Mis datos:*
Nombre: ${form.nombre} ${form.apellidos}
Lugar de entrega: ${form.lugar_entrega}

*Artículos:*
${lineas}

*Total: ${formatearPrecio(totalCarrito)}*

¿Me podés confirmar disponibilidad y forma de pago? 😊`

    const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank')
    setCarritoAbierto(false)
    setCheckout(false)
    setCarrito([])
    setForm({ nombre: '', apellidos: '', lugar_entrega: '' })
  }

  const categorias = ['todos', ...Array.from(new Set(articulos.map(a => a.categoria || 'otro')))]
  const filtrados = articulos.filter(a =>
    filtro === 'todos' ? true : (a.categoria || 'otro') === filtro
  )

  if (loading) return (
    <div className="text-center py-16 text-gray-400">
      <Package size={40} className="mx-auto mb-3 opacity-30" />
      <p>Cargando productos...</p>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Productos disponibles</h2>
          <p className="text-sm text-gray-500">{articulos.length} artículos en tienda</p>
        </div>
        {cantidadItems > 0 && (
          <button
            onClick={() => setCarritoAbierto(true)}
            className="relative bg-violet-600 text-white rounded-full p-3 shadow-lg"
          >
            <ShoppingCart size={20} />
            <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {cantidadItems}
            </span>
          </button>
        )}
      </div>

      {/* Filtro por categoría */}
      {categorias.length > 1 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {categorias.map(c => (
            <button
              key={c}
              onClick={() => setFiltro(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filtro === c ? 'bg-violet-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'
              }`}
            >
              {c === 'todos' ? 'Todos' : c.charAt(0).toUpperCase() + c.replace('_', ' ').slice(1)}
            </button>
          ))}
        </div>
      )}

      {filtrados.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Package size={40} className="mx-auto mb-3 opacity-30" />
          <p>No hay productos disponibles en este momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtrados.map(a => {
            const enCarrito = carrito.find(i => i.articulo.id === a.id)
            return (
              <Card key={a.id} className="overflow-hidden">
                {a.imagen_url ? (
                  <img
                    src={a.imagen_url}
                    alt={a.nombre}
                    className="w-full h-36 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setImagenViewer(a.imagen_url!)}
                  />
                ) : (
                  <div className="w-full h-36 bg-gray-100 flex items-center justify-center">
                    <Package size={32} className="text-gray-300" />
                  </div>
                )}
                <CardContent className="p-3">
                  <h3 className="font-semibold text-sm text-gray-800 leading-tight mb-1">{a.nombre}</h3>
                  <p className="text-violet-700 font-bold text-sm mb-2">{formatearPrecio(a.precio_venta)}</p>
                  {enCarrito ? (
                    <div className="flex items-center justify-between">
                      <button onClick={() => cambiarCantidad(a.id, -1)}
                        className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                        <Minus size={14} />
                      </button>
                      <span className="font-semibold text-sm">{enCarrito.cantidad}</span>
                      <button onClick={() => cambiarCantidad(a.id, 1)}
                        className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center">
                        <Plus size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => agregarAlCarrito(a)}
                      className="w-full bg-violet-600 text-white rounded-lg py-1.5 text-xs font-medium hover:bg-violet-700 transition-colors"
                    >
                      Agregar
                    </button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal carrito */}
      <Dialog open={carritoAbierto} onOpenChange={setCarritoAbierto}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tu carrito ({cantidadItems} items)</DialogTitle>
          </DialogHeader>

          {!checkout ? (
            <div className="space-y-3">
              {carrito.map(item => (
                <div key={item.articulo.id} className="flex items-center gap-3 py-2 border-b">
                  {item.articulo.imagen_url && (
                    <img src={item.articulo.imagen_url} alt={item.articulo.nombre}
                      className="w-12 h-12 object-cover rounded-lg" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.articulo.nombre}</p>
                    <p className="text-xs text-violet-600">{formatearPrecio(item.articulo.precio_venta * item.cantidad)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => cambiarCantidad(item.articulo.id, -1)}
                      className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                      <Minus size={12} />
                    </button>
                    <span className="text-sm font-semibold w-4 text-center">{item.cantidad}</span>
                    <button onClick={() => cambiarCantidad(item.articulo.id, 1)}
                      className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center">
                      <Plus size={12} />
                    </button>
                    <button onClick={() => eliminarDelCarrito(item.articulo.id)}
                      className="w-6 h-6 rounded-full bg-red-50 text-red-400 flex items-center justify-center ml-1">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-2 font-bold">
                <span>Total:</span>
                <span className="text-violet-700">{formatearPrecio(totalCarrito)}</span>
              </div>

              <Button className="w-full bg-violet-600 hover:bg-violet-700"
                onClick={() => setCheckout(true)}>
                Continuar con mis datos
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Completá tus datos para enviar el pedido por WhatsApp.</p>

              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input name="nombre" placeholder="Tu nombre"
                  value={form.nombre} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label>Apellidos *</Label>
                <Input name="apellidos" placeholder="Tus apellidos"
                  value={form.apellidos} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label>Lugar de entrega *</Label>
                <Input name="lugar_entrega" placeholder="Dirección o referencia"
                  value={form.lugar_entrega} onChange={handleChange} />
              </div>

              <div className="bg-violet-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Resumen del pedido:</p>
                {carrito.map(i => (
                  <p key={i.articulo.id} className="text-xs text-gray-700">
                    • {i.articulo.nombre} x{i.cantidad} — {formatearPrecio(i.articulo.precio_venta * i.cantidad)}
                  </p>
                ))}
                <p className="text-sm font-bold text-violet-700 mt-2">Total: {formatearPrecio(totalCarrito)}</p>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button className="w-full bg-green-600 hover:bg-green-700 gap-2"
                onClick={handleEnviar}>
                <Send size={16} /> Enviar por WhatsApp
              </Button>
              <button onClick={() => setCheckout(false)}
                className="w-full text-xs text-gray-400 hover:text-gray-600">
                ← Volver al carrito
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={!!imagenViewer} onOpenChange={() => setImagenViewer(null)}>
        <DialogContent className="max-w-xs p-2">
          {imagenViewer && (
            <img
              src={imagenViewer}
              alt="Imagen ampliada"
              className="w-full rounded-lg object-contain max-h-[70vh]"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}