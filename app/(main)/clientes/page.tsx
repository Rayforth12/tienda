'use client'

import { useEffect, useState } from 'react'
import { getClientes, createCliente, updateCliente } from '@/lib/queries/clientes'
import { Cliente } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Users, Plus, Phone, MapPin, Pencil, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const tipoConfig: Record<string, { label: string; class: string }> = {
  familiar: { label: 'Familiar', class: 'bg-pink-100 text-pink-700' },
  amigo:    { label: 'Amigo/a', class: 'bg-blue-100 text-blue-700' },
  novio:    { label: 'Novio/a',   class: 'bg-rose-100 text-rose-600' },
  cliente:  { label: 'Cliente', class: 'bg-gray-100 text-gray-600' },
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editando, setEditando] = useState<Cliente | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    lugar_entrega_habitual: '',
    tipo: 'cliente',
    porcentaje_ganancia: '',
    notas: '',
  })

  async function cargar() {
    const data = await getClientes()
    setClientes(data)
    setLoading(false)
  }

useEffect(() => {
  void cargar()
  // eslint-disable-next-line react-hooks/set-state-in-effect
}, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function abrirNuevo() {
    setEditando(null)
    setForm({ nombre: '', telefono: '', lugar_entrega_habitual: '', tipo: 'cliente', porcentaje_ganancia: '', notas: '' })
    setError('')
    setOpen(true)
  }

  function abrirEditar(c: Cliente) {
    setEditando(c)
    setForm({
      nombre: c.nombre,
      telefono: c.telefono || '',
      lugar_entrega_habitual: c.lugar_entrega_habitual || '',
      tipo: c.tipo || 'cliente',
      porcentaje_ganancia: c.porcentaje_ganancia?.toString() || '',
      notas: c.notas || '',
    })
    setError('')
    setOpen(true)
  }

  async function handleGuardar() {
    if (!form.nombre) { setError('El nombre es obligatorio.'); return }
    setSaving(true)
    setError('')
    try {
      const datos = {
        nombre: form.nombre,
        telefono: form.telefono || undefined,
        lugar_entrega_habitual: form.lugar_entrega_habitual || undefined,
        tipo: form.tipo,
        porcentaje_ganancia: form.porcentaje_ganancia ? parseFloat(form.porcentaje_ganancia) : undefined,
        notas: form.notas || undefined,
      }
      if (editando) {
        await updateCliente(editando.id, datos as Partial<Cliente>)
      } else {
        await createCliente(datos)
      }
      setOpen(false)
      cargar()
    } catch {
      setError('Error al guardar el cliente.')
    }
    setSaving(false)
  }

  async function handleEliminar(c: Cliente) {
    if (!confirm(`¿Eliminar a ${c.nombre}?`)) return
    const supabase = createClient()
    await supabase.from('clientes').delete().eq('id', c.id)
    cargar()
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
        <Button className="bg-violet-600 hover:bg-violet-700 gap-2" onClick={abrirNuevo}>
          <Plus size={16} /> Nuevo cliente
        </Button>
      </div>

      <Input placeholder="Buscar cliente..." value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)} className="mb-4" />

      {filtrados.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-gray-400">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p>{busqueda ? 'No se encontraron clientes.' : 'No hay clientes todavía.'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtrados.map((c) => {
            const tipo = tipoConfig[c.tipo || 'cliente']
            return (
              <Card key={c.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="font-semibold text-gray-800">{c.nombre}</h2>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tipo.class}`}>
                          {tipo.label}
                        </span>
                        {c.porcentaje_ganancia && (
                          <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">
                            +{c.porcentaje_ganancia}%
                          </span>
                        )}
                      </div>
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
                    </div>
                    <div className="flex items-center gap-2">
                      {c.telefono && (
                        <a href={`https://wa.me/${c.telefono.replace(/\D/g, '')}`}
                          target="_blank" rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
                          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-green-500">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.525 5.845L.057 23.928a.5.5 0 0 0 .619.61l6.162-1.459A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.808 9.808 0 0 1-5.031-1.386l-.361-.214-3.737.884.939-3.648-.235-.374A9.808 9.808 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
                          </svg>
                        </a>
                      )}
                      <button onClick={() => abrirEditar(c)}
                        className="p-2 rounded-lg bg-violet-50 hover:bg-violet-100 transition-colors">
                        <Pencil size={14} className="text-violet-600" />
                      </button>
                      <button onClick={() => handleEliminar(c)}
                        className="p-2 rounded-lg bg-red-50 hover:bg-red-100 transition-colors">
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar cliente' : 'Nuevo cliente'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-2">
              <Label>Nombre completo *</Label>
              <Input name="nombre" placeholder="Nombre del cliente"
                value={form.nombre} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Teléfono / WhatsApp</Label>
              <Input name="telefono" placeholder="50688880000"
                value={form.telefono} onChange={handleChange} />
              <p className="text-xs text-gray-400">Sin espacios ni guiones.</p>
            </div>
            <div className="space-y-2">
              <Label>Lugar de entrega habitual</Label>
              <select name="lugar_entrega_habitual"
                value={form.lugar_entrega_habitual}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                <option value="">-- Seleccioná --</option>
                <option value="Cartago">Cartago</option>
                <option value="San José">San José</option>
                <option value="Guápiles">Guápiles</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de cliente</Label>
              <select name="tipo" value={form.tipo} onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                <option value="cliente">Cliente</option>
                <option value="amigo">Amigo/a</option>
                <option value="familiar">Familiar</option>
                <option value="novio">Novio/a</option>
              </select>
            </div>
            {form.tipo !== 'cliente' && (
              <div className="space-y-2">
                <Label>Porcentaje de ganancia personalizado (%)</Label>
                <Input name="porcentaje_ganancia" type="number" min="0" max="100"
                  placeholder="Ej: 10 para familiares, 30 para amigos"
                  value={form.porcentaje_ganancia} onChange={handleChange} />
                <p className="text-xs text-gray-400">
                  Si se deja vacío se usa el porcentaje general de configuración.
                </p>
              </div>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button className="w-full bg-violet-600 hover:bg-violet-700"
              onClick={handleGuardar} disabled={saving}>
              {saving ? 'Guardando...' : editando ? 'Guardar cambios' : 'Guardar cliente'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}