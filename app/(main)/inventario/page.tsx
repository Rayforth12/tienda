'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { ArticuloInventario } from '@/types'
import { formatearPrecio } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Package, Plus, Upload, X } from 'lucide-react'
import { uploadImagen } from '@/lib/queries/solicitudes'

const categorias = [
  'maquillaje',
  'cuidado_personal',
  'perfumes',
  'licores',
  'tenis',
  'ropa',
  'accesorios',
  'electronica',
  'juguetes',
  'hogar',
  'medicamentos',
  'suplementos',
  'dulces_snacks',
  'otro',
]

const estadoConfig: Record<string, { label: string; class: string }> = {
  disponible: { label: 'Disponible', class: 'bg-green-100 text-green-700' },
  reservado:  { label: 'Reservado',  class: 'bg-yellow-100 text-yellow-700' },
  vendido:    { label: 'Vendido',    class: 'bg-gray-100 text-gray-500' },
}

export default function InventarioPage() {
  const [articulos, setArticulos] = useState<ArticuloInventario[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editando, setEditando] = useState<ArticuloInventario | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [imagenPreview, setImagenPreview] = useState<string | null>(null)
  const [imagenFile, setImagenFile] = useState<File | null>(null)
  const [form, setForm] = useState({
    nombre: '',
    categoria: 'otro',
    precio_compra: '',
    precio_venta: '',
    cantidad: '1',
    estado: 'disponible',
    notas: '',
  })

  async function cargar() {
    const supabase = createClient()
    const { data } = await supabase
      .from('inventario')
      .select('*')
      .order('created_at', { ascending: false })
    setArticulos(data || [])
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function abrirNuevo() {
    setEditando(null)
    setForm({ nombre: '', categoria: 'otro', precio_compra: '', precio_venta: '', cantidad: '1', estado: 'disponible', notas: '' })
    setImagenPreview(null)
    setImagenFile(null)
    setError('')
    setOpen(true)
  }

  function abrirEditar(a: ArticuloInventario) {
    setEditando(a)
    setForm({
      nombre: a.nombre,
      categoria: a.categoria || 'otro',
      precio_compra: a.precio_compra.toString(),
      precio_venta: a.precio_venta.toString(),
      cantidad: a.cantidad.toString(),
      estado: a.estado,
      notas: a.notas || '',
    })
    setImagenPreview(a.imagen_url || null)
    setImagenFile(null)
    setError('')
    setOpen(true)
  }

  async function handleGuardar() {
    if (!form.nombre || !form.precio_compra || !form.precio_venta) {
      setError('Nombre y precios son obligatorios.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const supabase = createClient()
      let imagen_url = editando?.imagen_url

      if (imagenFile) imagen_url = await uploadImagen(imagenFile)
      if (!imagenPreview) imagen_url = undefined

      const datos = {
        nombre: form.nombre,
        categoria: form.categoria,
        precio_compra: parseFloat(form.precio_compra),
        precio_venta: parseFloat(form.precio_venta),
        cantidad: parseInt(form.cantidad),
        estado: form.estado,
        notas: form.notas || null,
        imagen_url: imagen_url || null,
      }

      if (editando) {
        await supabase.from('inventario').update(datos).eq('id', editando.id)
      } else {
        await supabase.from('inventario').insert(datos)
      }

      setOpen(false)
      cargar()
    } catch {
      setError('Error al guardar el artículo.')
    }
    setSaving(false)
  }

  async function handleEliminar() {
    if (!editando || !confirm('¿Eliminar este artículo?')) return
    const supabase = createClient()
    await supabase.from('inventario').delete().eq('id', editando.id)
    setOpen(false)
    cargar()
  }

  const filtrados = articulos.filter(a =>
    filtroEstado === 'todos' ? true : a.estado === filtroEstado
  )

  const disponibles = articulos.filter(a => a.estado === 'disponible').length

  if (loading) return <p className="text-gray-400">Cargando inventario...</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-violet-700">Inventario</h1>
          <p className="text-sm text-gray-500">{disponibles} artículos disponibles</p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700 gap-2" onClick={abrirNuevo}>
          <Plus size={16} /> Nuevo artículo
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['todos', 'disponible', 'reservado', 'vendido'].map(e => (
          <button
            key={e}
            onClick={() => setFiltroEstado(e)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filtroEstado === e
                ? 'bg-violet-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {e === 'todos' ? 'Todos' : estadoConfig[e].label}
          </button>
        ))}
      </div>

      {filtrados.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-gray-400">
            <Package size={40} className="mx-auto mb-3 opacity-30" />
            <p>No hay artículos en esta categoría.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtrados.map((a) => {
            const est = estadoConfig[a.estado]
            const ganancia = a.precio_venta - a.precio_compra
            return (
              <Card key={a.id} className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => abrirEditar(a)}>
                <CardContent className="py-4">
                  <div className="flex gap-3">
                    {a.imagen_url ? (
                      <img src={a.imagen_url} alt={a.nombre}
                        className="h-16 w-16 object-cover rounded-lg border shrink-0" />
                    ) : (
                      <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                        <Package size={20} className="text-gray-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h2 className="font-semibold text-gray-800 text-sm leading-tight">{a.nombre}</h2>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${est.class}`}>
                          {est.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">Cantidad: {a.cantidad}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-700">{formatearPrecio(a.precio_venta)}</p>
                        <p className="text-xs text-green-600">+{formatearPrecio(ganancia)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal agregar/editar */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar artículo' : 'Nuevo artículo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-2">
              <Label>Nombre del artículo *</Label>
              <Input name="nombre" placeholder="Ej: Perfume Zara 80ml"
                value={form.nombre} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label>Categoría</Label>
              <select name="categoria" value={form.categoria} onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                {categorias.map(c => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.replace('_', ' ').slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Foto */}
            <div className="space-y-1">
              <Label>Foto del artículo</Label>
              {imagenPreview ? (
                <div className="relative w-fit">
                  <img src={imagenPreview} alt="Preview"
                    className="h-28 w-28 object-cover rounded-lg border" />
                  <button
                    onClick={() => { setImagenPreview(null); setImagenFile(null) }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 cursor-pointer hover:border-violet-400 w-fit">
                  <Upload size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-500">Subir foto</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) { setImagenFile(file); setImagenPreview(URL.createObjectURL(file)) }
                  }} />
                </label>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Precio de compra (₡) *</Label>
                <Input name="precio_compra" type="number" placeholder="0"
                  value={form.precio_compra} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label>Precio de venta (₡) *</Label>
                <Input name="precio_venta" type="number" placeholder="0"
                  value={form.precio_venta} onChange={handleChange} />
              </div>
            </div>

            {form.precio_compra && form.precio_venta && (
              <p className="text-sm text-green-600 font-medium">
                Ganancia: {formatearPrecio(parseFloat(form.precio_venta) - parseFloat(form.precio_compra))}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Cantidad</Label>
                <Input name="cantidad" type="number" min="1"
                  value={form.cantidad} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <select name="estado" value={form.estado} onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                  <option value="disponible">Disponible</option>
                  <option value="reservado">Reservado</option>
                  <option value="vendido">Vendido</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea name="notas" placeholder="Observaciones del artículo..."
                value={form.notas} onChange={handleChange} rows={2} />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3">
              <Button className="flex-1 bg-violet-600 hover:bg-violet-700"
                onClick={handleGuardar} disabled={saving}>
                {saving ? 'Guardando...' : editando ? 'Guardar cambios' : 'Agregar artículo'}
              </Button>
              {editando && (
                <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50"
                  onClick={handleEliminar}>
                  Eliminar
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}