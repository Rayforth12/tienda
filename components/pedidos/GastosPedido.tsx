'use client'

import { useEffect, useState } from 'react'
import { getGastosByPedido, createGasto, deleteGasto, GastoPedido } from '@/lib/queries/gastos'
import { formatearPrecio } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Trash2, Plus, Receipt } from 'lucide-react'

const tiposGasto = [
  { value: 'combustible', label: '⛽ Combustible' },
  { value: 'comida', label: '🍽️ Comida' },
  { value: 'alojamiento', label: '🏨 Alojamiento' },
  { value: 'compras_extras', label: '🛍️ Compras extras' },
  { value: 'otro', label: '📦 Otro' },
]


export default function GastosPedido({
  pedidoId,
  onCambio,
    bloqueado = false,
}: {
  pedidoId: string
  onCambio?: () => void
  bloqueado?: boolean
}) {
  const [gastos, setGastos] = useState<GastoPedido[]>([])
  const [loading, setLoading] = useState(true)
  const [agregando, setAgregando] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ descripcion: '', monto: '', tipo: 'combustible' })

  async function cargar() {
    const data = await getGastosByPedido(pedidoId)
    setGastos(data)
    setLoading(false)
  }

  useEffect(() => { cargar() }, [pedidoId])

  async function handleAgregar() {
    if (!form.descripcion || !form.monto) return
    setSaving(true)
    await createGasto({
      pedido_id: pedidoId,
      descripcion: form.descripcion,
      monto: parseFloat(form.monto),
      tipo: form.tipo,
    })
    setForm({ descripcion: '', monto: '', tipo: 'combustible' })
    setAgregando(false)
    await cargar()
    onCambio?.()
    setSaving(false)
  }

  async function handleEliminar(id: string) {
    if (!confirm('¿Eliminar este gasto?')) return
    await deleteGasto(id)
    await cargar()
    onCambio?.()
  }

  const totalGastos = gastos.reduce((acc, g) => acc + g.monto, 0)

  if (loading) return null

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-gray-700 flex items-center gap-2">
            <Receipt size={16} /> Gastos del viaje
          </CardTitle>
          {totalGastos > 0 && (
            <span className="text-sm font-bold text-red-500">
              Total: {formatearPrecio(totalGastos)}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {gastos.length === 0 && !agregando && (
          <p className="text-xs text-gray-400 text-center py-2">No hay gastos registrados.</p>
        )}

        {gastos.map(g => (
          <div key={g.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
            <div>
              <p className="text-sm text-gray-700">{g.descripcion}</p>
              <p className="text-xs text-gray-400">
                {tiposGasto.find(t => t.value === g.tipo)?.label || g.tipo}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-red-500">{formatearPrecio(g.monto)}</span>
              {!bloqueado && (
                <button onClick={() => handleEliminar(g.id)}
                  className="p-1 rounded bg-red-50 hover:bg-red-100">
                  <Trash2 size={12} className="text-red-400" />
                </button>
              )}
            </div>
          </div>
        ))}

        {!bloqueado && (
          agregando ? (
            <div className="space-y-2 pt-2">
              <select value={form.tipo}
                onChange={e => setForm({ ...form, tipo: e.target.value })}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                {tiposGasto.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <Input placeholder="Descripción (ej: Gasolina ida)"
                value={form.descripcion}
                onChange={e => setForm({ ...form, descripcion: e.target.value })} />
              <Input type="number" placeholder="Monto en ₡"
                value={form.monto}
                onChange={e => setForm({ ...form, monto: e.target.value })} />
              <div className="flex gap-2">
                <Button className="flex-1 bg-violet-600 hover:bg-violet-700 h-8 text-xs"
                  onClick={handleAgregar} disabled={saving}>
                  {saving ? 'Guardando...' : 'Agregar'}
                </Button>
                <Button variant="outline" className="h-8 text-xs"
                  onClick={() => setAgregando(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAgregando(true)}
              className="flex items-center gap-1 text-xs text-violet-600 hover:underline pt-1">
              <Plus size={12} /> Agregar gasto
            </button>
          )
        )}

        {bloqueado && (
          <p className="text-xs text-gray-400 italic">
            El pedido fue entregado — no se pueden agregar más gastos.
          </p>
        )}
      </CardContent>
    </Card>
  )
}