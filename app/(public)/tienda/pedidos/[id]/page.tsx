'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Pedido, Cliente } from '@/types'
import { formatearFecha } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { ArrowLeft, Upload, X, Send, Trash2, Pencil } from 'lucide-react'
import { uploadImagen } from '@/lib/queries/solicitudes'
import Link from 'next/link'

interface SolicitudPublica {
  id: string
  articulo: string
  alternativa?: string
  categoria?: string
  imagen_url?: string
  imagen_alternativa_url?: string
  lugar_entrega?: string
  notas?: string
  estado: string
  created_at: string
}

const estadoLabel: Record<string, { text: string; class: string }> = {
  pendiente:     { text: '⏳ Pendiente',     class: 'bg-yellow-100 text-yellow-700' },
  conseguido:    { text: '✅ Conseguido',    class: 'bg-green-100 text-green-700' },
  no_disponible: { text: '❌ No disponible', class: 'bg-red-100 text-red-600' },
  entregado:     { text: '📦 Entregado',     class: 'bg-gray-100 text-gray-600' },
}

export default function PedidoPublicoPage() {
  const { id } = useParams()
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [loading, setLoading] = useState(true)
  const [vista, setVista] = useState<'menu' | 'nueva' | 'mis-solicitudes'>('menu')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)
  const [misSolicitudes, setMisSolicitudes] = useState<SolicitudPublica[]>([])
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [imagenViewer, setImagenViewer] = useState<string | null>(null)

  const [imagenPrincipal, setImagenPrincipal] = useState<{ file: File | null; preview: string | null }>({ file: null, preview: null })
  const [imagenAlternativa, setImagenAlternativa] = useState<{ file: File | null; preview: string | null }>({ file: null, preview: null })

  const [formCliente, setFormCliente] = useState({ nombre: '', telefono: '' })
  const [clienteGuardado, setClienteGuardado] = useState<Cliente | null>(null)
  const [paso, setPaso] = useState<'identificacion' | 'solicitud'>('identificacion')

  const [form, setForm] = useState({
    articulo: '',
    alternativa: '',
    categoria: '',
    lugar_entrega: '',
    notas: '',
  })

  useEffect(() => {
    const clienteLocal = localStorage.getItem('tienda_cliente')
    if (clienteLocal) {
      setClienteGuardado(JSON.parse(clienteLocal))
      setPaso('solicitud')
    }
  }, [])

  useEffect(() => {
    async function cargar() {
      const supabase = createClient()
      const { data } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', id)
        .single()
      setPedido(data)
      setLoading(false)
    }
    cargar()
  }, [id])

  async function cargarMisSolicitudes() {
    if (!clienteGuardado) return
    const supabase = createClient()
    const { data } = await supabase
      .from('solicitudes')
      .select('*')
      .eq('pedido_id', id)
      .eq('cliente_id', clienteGuardado.id)
      .order('created_at', { ascending: false })
    setMisSolicitudes(data || [])
  }

  async function handleIdentificacion() {
    if (!formCliente.nombre) { setError('Escribí tu nombre.'); return }
    setError('')
    setSaving(true)
    try {
      const supabase = createClient()
      let cliente: Cliente | null = null
      if (formCliente.telefono) {
        const { data } = await supabase
          .from('clientes')
          .select('*')
          .ilike('nombre', formCliente.nombre.trim())
          .eq('telefono', formCliente.telefono.trim())
          .single()
        cliente = data
      }
      if (!cliente) {
        const { data } = await supabase
          .from('clientes')
          .insert({ nombre: formCliente.nombre.trim(), telefono: formCliente.telefono || null })
          .select()
          .single()
        cliente = data
      }
      if (cliente) {
        localStorage.setItem('tienda_cliente', JSON.stringify(cliente))
        setClienteGuardado(cliente)
        setPaso('solicitud')
      }
    } catch {
      setError('Ocurrió un error. Intentá de nuevo.')
    }
    setSaving(false)
  }

  function resetForm() {
    setForm({ articulo: '', alternativa: '', categoria: '', lugar_entrega: '', notas: '' })
    setImagenPrincipal({ file: null, preview: null })
    setImagenAlternativa({ file: null, preview: null })
    setEditandoId(null)
    setError('')
  }

  async function handleGuardarSolicitud() {
    if (!form.articulo) { setError('Describí el artículo.'); return }
    if (!form.lugar_entrega) { setError('Seleccioná el lugar de entrega.'); return }
    if (!clienteGuardado) return
    setSaving(true)
    setError('')
    try {
      const supabase = createClient()
      let imagen_url: string | undefined
      let imagen_alternativa_url: string | undefined

      if (imagenPrincipal.file) imagen_url = await uploadImagen(imagenPrincipal.file)
      if (imagenAlternativa.file) imagen_alternativa_url = await uploadImagen(imagenAlternativa.file)

      if (editandoId) {
        await supabase.from('solicitudes').update({
          articulo: form.articulo,
          alternativa: form.alternativa || null,
          categoria: form.categoria || null,
          lugar_entrega: form.lugar_entrega || null,
          notas: form.notas || null,
          ...(imagen_url && { imagen_url }),
          ...(imagen_alternativa_url && { imagen_alternativa_url }),
        }).eq('id', editandoId)
      } else {
        await supabase.from('solicitudes').insert({
          pedido_id: id,
          cliente_id: clienteGuardado.id,
          articulo: form.articulo,
          alternativa: form.alternativa || null,
          categoria: form.categoria || null,
          imagen_url: imagen_url || null,
          imagen_alternativa_url: imagen_alternativa_url || null,
          lugar_entrega: form.lugar_entrega || null,
          notas: form.notas || null,
        })
      }

      setExito(true)
      resetForm()
      setTimeout(() => {
        setExito(false)
        setVista('mis-solicitudes')
        cargarMisSolicitudes()
      }, 1500)
    } catch {
      setError('Error al guardar. Intentá de nuevo.')
    }
    setSaving(false)
  }

  async function handleEliminar(solicitudId: string) {
    if (!confirm('¿Eliminar esta solicitud?')) return
    const supabase = createClient()
    await supabase.from('solicitudes').delete().eq('id', solicitudId)
    cargarMisSolicitudes()
  }

  function handleEditar(s: SolicitudPublica) {
    setForm({
      articulo: s.articulo,
      alternativa: s.alternativa || '',
      categoria: s.categoria || '',
      lugar_entrega: s.lugar_entrega || '',
      notas: s.notas || '',
    })
    setImagenPrincipal({ file: null, preview: s.imagen_url || null })
    setImagenAlternativa({ file: null, preview: s.imagen_alternativa_url || null })
    setEditandoId(s.id)
    setVista('nueva')
  }

  if (loading) return <p className="text-gray-400 text-center py-10">Cargando...</p>
  if (!pedido) return <p className="text-red-500 text-center py-10">Pedido no encontrado.</p>

  // Pantalla de identificación
  if (paso === 'identificacion') {
    return (
      <div className="max-w-sm mx-auto">
        <Link href="/tienda/pedidos" className="flex items-center gap-1 text-sm text-violet-600 mb-4 hover:underline">
          <ArrowLeft size={14} /> Volver
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Identificate para continuar</CardTitle>
            <p className="text-xs text-gray-500">
              Usamos tu nombre para que puedas ver y editar tus solicitudes.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Tu nombre completo *</Label>
              <Input placeholder="Nombre y apellidos"
                value={formCliente.nombre}
                onChange={e => setFormCliente({ ...formCliente, nombre: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp (opcional)</Label>
              <Input placeholder="+506 8888-0000"
                value={formCliente.telefono}
                onChange={e => setFormCliente({ ...formCliente, telefono: e.target.value })} />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button className="w-full bg-violet-600 hover:bg-violet-700"
              onClick={handleIdentificacion} disabled={saving}>
              {saving ? 'Verificando...' : 'Continuar'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Menú principal
  if (vista === 'menu') {
    return (
      <div>
        <Link href="/tienda/pedidos" className="flex items-center gap-1 text-sm text-violet-600 mb-4 hover:underline">
          <ArrowLeft size={14} /> Volver a pedidos
        </Link>
        <Card className="mb-4">
          <CardContent className="pt-4 pb-3">
            <h2 className="font-bold text-lg text-gray-800">{pedido.nombre}</h2>
            <p className="text-xs text-gray-500 mt-1">
              Cierre: {formatearFecha(pedido.fecha_limite)}
              {pedido.fecha_entrega && ` · Entrega: ${formatearFecha(pedido.fecha_entrega)}`}
            </p>
            <p className="text-xs text-violet-600 mt-1">Hola, {clienteGuardado?.nombre} 👋</p>
          </CardContent>
        </Card>
        <div className="space-y-3">
          <button
            onClick={() => { resetForm(); setVista('nueva') }}
            className="w-full bg-violet-600 text-white rounded-xl p-4 text-left hover:bg-violet-700 transition-colors"
          >
            <p className="font-semibold text-lg">+ Nueva solicitud</p>
            <p className="text-violet-200 text-sm">Pedí un artículo específico para este viaje</p>
          </button>
          <button
            onClick={() => { setVista('mis-solicitudes'); cargarMisSolicitudes() }}
            className="w-full bg-white border-2 border-violet-200 text-violet-700 rounded-xl p-4 text-left hover:bg-violet-50 transition-colors"
          >
            <p className="font-semibold text-lg">Ver mis solicitudes</p>
            <p className="text-gray-400 text-sm">Revisá o editá lo que ya pediste</p>
          </button>
        </div>
      </div>
    )
  }

  // Mis solicitudes
  if (vista === 'mis-solicitudes') {
    return (
      <div>
        <button onClick={() => setVista('menu')}
          className="flex items-center gap-1 text-sm text-violet-600 mb-4 hover:underline">
          <ArrowLeft size={14} /> Volver
        </button>
        <h2 className="font-bold text-lg text-gray-800 mb-4">Mis solicitudes</h2>

        {/* Visor de imagen grande */}
        <Dialog open={!!imagenViewer} onOpenChange={() => setImagenViewer(null)}>
          <DialogContent className="max-w-sm p-2">
            {imagenViewer && (
              <img src={imagenViewer} alt="Imagen ampliada"
                className="w-full rounded-lg object-contain max-h-[80vh]" />
            )}
          </DialogContent>
        </Dialog>

        {misSolicitudes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-10 text-gray-400">
              <p>No tenés solicitudes en este pedido todavía.</p>
              <button onClick={() => { resetForm(); setVista('nueva') }}
                className="text-violet-600 text-sm hover:underline mt-2">
                Crear una solicitud
              </button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {misSolicitudes.map(s => {
              const est = estadoLabel[s.estado] || { text: s.estado, class: 'bg-gray-100 text-gray-600' }
              return (
                <Card key={s.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{s.articulo}</p>
                        {s.alternativa && (
                          <p className="text-xs text-gray-500">Alt: {s.alternativa}</p>
                        )}
                        {s.lugar_entrega && (
                          <p className="text-xs text-gray-500">📍 {s.lugar_entrega}</p>
                        )}
                        <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${est.class}`}>
                          {est.text}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {s.estado === 'pendiente' && (
                          <>
                            <button onClick={() => handleEditar(s)}
                              className="p-1.5 rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => handleEliminar(s.id)}
                              className="p-1.5 rounded-lg bg-red-50 text-red-400 hover:bg-red-100">
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Imágenes con click para ampliar */}
                    <div className="flex gap-2 mt-2">
                      {s.imagen_url && (
                        <div className="space-y-0.5">
                          <p className="text-xs text-gray-400">Artículo</p>
                          <img
                            src={s.imagen_url}
                            alt="Artículo"
                            className="h-16 w-16 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setImagenViewer(s.imagen_url!)}
                          />
                        </div>
                      )}
                      {s.imagen_alternativa_url && (
                        <div className="space-y-0.5">
                          <p className="text-xs text-gray-400">Alternativa</p>
                          <img
                            src={s.imagen_alternativa_url}
                            alt="Alternativa"
                            className="h-16 w-16 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setImagenViewer(s.imagen_alternativa_url!)}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            <button
              onClick={() => { resetForm(); setVista('nueva') }}
              className="w-full border-2 border-dashed border-violet-200 text-violet-600 rounded-xl py-3 text-sm font-medium hover:bg-violet-50"
            >
              + Agregar otra solicitud
            </button>
          </div>
        )}
      </div>
    )
  }

  // Formulario nueva solicitud / editar
  return (
    <div>
      <button onClick={() => { resetForm(); setVista('menu') }}
        className="flex items-center gap-1 text-sm text-violet-600 mb-4 hover:underline">
        <ArrowLeft size={14} /> Volver
      </button>

      <h2 className="font-bold text-lg text-gray-800 mb-4">
        {editandoId ? 'Editar solicitud' : 'Nueva solicitud'}
      </h2>

      {exito && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm text-center mb-4">
          ✅ Solicitud guardada exitosamente
        </div>
      )}

      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-sm text-gray-700">¿Qué querés pedir?</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Categoría del artículo</Label>
              <select
                value={form.categoria || ''}
                onChange={e => setForm({ ...form, categoria: e.target.value })}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">-- Sin categoría --</option>
                <option value="maquillaje">Maquillaje</option>
                <option value="cuidado_personal">Cuidado personal</option>
                <option value="perfumes">Perfumes</option>
                <option value="licores">Licores</option>
                <option value="tenis">Tenis</option>
                <option value="ropa">Ropa</option>
                <option value="accesorios">Accesorios</option>
                <option value="electronica">Electrónica</option>
                <option value="juguetes">Juguetes</option>
                <option value="hogar">Hogar</option>
                <option value="medicamentos">Medicamentos</option>
                <option value="suplementos">Suplementos</option>
                <option value="dulces_snacks">Dulces y snacks</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Descripción del artículo *</Label>
              <Input placeholder="Ej: Crema L'Oreal Elvive 400ml"
                value={form.articulo}
                onChange={e => setForm({ ...form, articulo: e.target.value })} />
            </div>

            <div className="space-y-1">
              <p className="text-xs text-gray-500 font-medium">Foto de referencia</p>
              {imagenPrincipal.preview ? (
                <div className="relative w-fit">
                  <img src={imagenPrincipal.preview} alt="Preview"
                    className="h-28 w-28 object-cover rounded-lg border cursor-pointer"
                    onClick={() => setImagenViewer(imagenPrincipal.preview)} />
                  <button onClick={() => setImagenPrincipal({ file: null, preview: null })}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5">
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 cursor-pointer hover:border-violet-400 w-fit">
                  <Upload size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-500">Subir foto</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    if (!file.type.startsWith('image/')) { alert('Solo imágenes'); return }
                    setImagenPrincipal({ file, preview: URL.createObjectURL(file) })
                  }} />
                </label>
              )}
            </div>

            <div className="space-y-2">
              <Label>Alternativa aceptada</Label>
              <Input placeholder="Si no hay ese, ¿qué otro aceptás?"
                value={form.alternativa}
                onChange={e => setForm({ ...form, alternativa: e.target.value })} />
            </div>

            <div className="space-y-1">
              <p className="text-xs text-gray-500 font-medium">Foto de la alternativa (opcional)</p>
              {imagenAlternativa.preview ? (
                <div className="relative w-fit">
                  <img src={imagenAlternativa.preview} alt="Alt preview"
                    className="h-28 w-28 object-cover rounded-lg border cursor-pointer"
                    onClick={() => setImagenViewer(imagenAlternativa.preview)} />
                  <button onClick={() => setImagenAlternativa({ file: null, preview: null })}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5">
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 cursor-pointer hover:border-violet-400 w-fit">
                  <Upload size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-500">Subir foto</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    if (!file.type.startsWith('image/')) { alert('Solo imágenes'); return }
                    setImagenAlternativa({ file, preview: URL.createObjectURL(file) })
                  }} />
                </label>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm text-gray-700">Entrega</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Lugar de entrega *</Label>
              <select
                value={form.lugar_entrega}
                onChange={e => setForm({ ...form, lugar_entrega: e.target.value })}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">-- Seleccioná el lugar --</option>
                <option value="Cartago">Cartago</option>
                <option value="San José">San José</option>
                <option value="Guápiles">Guápiles</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Notas adicionales</Label>
              <Textarea placeholder="Cualquier detalle importante..."
                value={form.notas}
                onChange={e => setForm({ ...form, notas: e.target.value })} rows={2} />
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button className="w-full bg-violet-600 hover:bg-violet-700 gap-2"
          onClick={handleGuardarSolicitud} disabled={saving}>
          <Send size={16} />
          {saving ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Enviar solicitud'}
        </Button>
      </div>

      {/* Visor de imagen grande */}
      <Dialog open={!!imagenViewer} onOpenChange={() => setImagenViewer(null)}>
        <DialogContent className="max-w-sm p-2">
          {imagenViewer && (
            <img src={imagenViewer} alt="Imagen ampliada"
              className="w-full rounded-lg object-contain max-h-[80vh]" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}