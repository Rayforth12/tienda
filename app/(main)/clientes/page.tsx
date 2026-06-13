'use client'

import { useEffect, useState } from 'react'
import { getClientes, createCliente } from '@/lib/queries/clientes'
import { Cliente } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Users, Plus, Phone, MapPin } from 'lucide-react'

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    lugar_entrega_habitual: '',
    notas: '',
  })

  async function cargar() {
    const data = await getClientes()
    setClientes(data)
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleGuardar() {
    if (!form.nombre) { setError('El nombre es obligatorio.'); return }
    setSaving(true)
    setError('')
    try {
      await createCliente({
        nombre: form.nombre,
        telefono: form.telefono || undefined,
        lugar_entrega_habitual: form.lugar_entrega_habitual || undefined,
        notas: form.notas || undefined,
      })
      setOpen(false)
      setForm({ nombre: '', telefono: '', lugar_entrega_habitual: '', notas: '' })
      cargar()
    } catch {
      setError('Error al guardar el cliente.')
    }
    setSaving(false)
  }

  const filtrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  if (loading) return <p className="text-gray-400">Cargando clientes...</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-violet-700">Clientes</h1>
          <p className="text-sm text-gray-500">{clientes.length} clientes registrados</p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700 gap-2" onClick={() => setOpen(true)}>
          <Plus size={16} /> Nuevo cliente
        </Button>
      </div>

      <Input
        placeholder="Buscar cliente..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="mb-4"
      />

      {filtrados.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-gray-400">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p>{busqueda ? 'No se encontraron clientes.' : 'No hay clientes todavía.'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtrados.map((c) => (
            <Card key={c.id}>
              <CardContent className="py-4">
                <h2 className="font-semibold text-gray-800 mb-1">{c.nombre}</h2>
                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                  {c.telefono && (
                    <span className="flex items-center gap-1">
                      <Phone size={11} /> {c.telefono}
                    </span>
                  )}
                  {c.lugar_entrega_habitual && (
                    <span className="flex items-center gap-1">
                      <MapPin size={11} /> {c.lugar_entrega_habitual}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-2">
              <Label>Nombre completo *</Label>
              <Input name="nombre" placeholder="Nombre del cliente"
                value={form.nombre} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Teléfono / WhatsApp</Label>
              <Input name="telefono" placeholder="+506 8888-0000"
                value={form.telefono} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Lugar de entrega habitual</Label>
              <Input name="lugar_entrega_habitual" placeholder="Dirección más usada"
                value={form.lugar_entrega_habitual} onChange={handleChange} />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button className="w-full bg-violet-600 hover:bg-violet-700"
              onClick={handleGuardar} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar cliente'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}