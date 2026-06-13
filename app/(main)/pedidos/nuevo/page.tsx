'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPedido } from '@/lib/queries/pedidos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NuevoPedidoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    nombre: '',
    fecha_limite: '',
    fecha_entrega: '',
    notas: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit() {
    if (!form.nombre || !form.fecha_limite) {
      setError('El nombre y la fecha límite son obligatorios.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const pedido = await createPedido({
        nombre: form.nombre,
        fecha_limite: form.fecha_limite,
        fecha_entrega: form.fecha_entrega || undefined,
        notas: form.notas || undefined,
      })
      router.push(`/pedidos/${pedido.id}`)
    } catch {
      setError('Ocurrió un error al crear el pedido.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/pedidos">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-violet-700">Nuevo Pedido</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-gray-700">Información del viaje</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del pedido *</Label>
            <Input
              id="nombre"
              name="nombre"
              placeholder="Ej: Viaje junio #1"
              value={form.nombre}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fecha_limite">Fecha límite de solicitudes *</Label>
            <Input
              id="fecha_limite"
              name="fecha_limite"
              type="date"
              value={form.fecha_limite}
              onChange={handleChange}
            />
            <p className="text-xs text-gray-400">Hasta esta fecha se pueden agregar solicitudes.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fecha_entrega">Fecha estimada de entrega</Label>
            <Input
              id="fecha_entrega"
              name="fecha_entrega"
              type="date"
              value={form.fecha_entrega}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas del viaje</Label>
            <Textarea
              id="notas"
              name="notas"
              placeholder="Observaciones generales del viaje..."
              value={form.notas}
              onChange={handleChange}
              rows={3}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            className="w-full bg-violet-600 hover:bg-violet-700"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Creando...' : 'Crear pedido'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}