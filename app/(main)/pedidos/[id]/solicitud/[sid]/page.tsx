'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { updateSolicitud, uploadImagen } from '@/lib/queries/solicitudes'
import { createClient } from '@/lib/supabase'
import { Solicitud } from '@/types'
import { formatearPrecio } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Upload, X } from 'lucide-react'

const estadoOpciones = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'conseguido', label: 'Conseguido' },
  { value: 'no_disponible', label: 'No disponible' },
  { value: 'entregado', label: 'Entregado' },
]

export default function EditarSolicitudPage() {
  const { id, sid } = useParams()
  const router = useRouter()
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [imagenPrincipalPreview, setImagenPrincipalPreview] = useState<string | null>(null)
  const [imagenPrincipalFile, setImagenPrincipalFile] = useState<File | null>(null)
  const [imagenAlternativaPreview, setImagenAlternativaPreview] = useState<string | null>(null)
  const [imagenAlternativaFile, setImagenAlternativaFile] = useState<File | null>(null)

  const [form, setForm] = useState({
    articulo: '',
    alternativa: '',
    lugar_entrega: '',
    precio_compra: '',
    precio_venta: '',
    estado: 'pendiente',
    cobrado: false,
    categoria: '',
    notas: '',
  })

  useEffect(() => {
    async function cargar() {
      const supabase = createClient()
      const { data } = await supabase
        .from('solicitudes')
        .select('*, cliente:clientes(*)')
        .eq('id', sid)
        .single()
      if (data) {
        setSolicitud(data)
        setForm({
          articulo: data.articulo || '',
          alternativa: data.alternativa || '',
          lugar_entrega: data.lugar_entrega || '',
          precio_compra: data.precio_compra?.toString() || '',
          precio_venta: data.precio_venta?.toString() || '',
          estado: data.estado || 'pendiente',
          cobrado: data.cobrado || false,
          categoria: data.categoria || '',
          notas: data.notas || '',
        })
        if (data.imagen_url) setImagenPrincipalPreview(data.imagen_url)
        if (data.imagen_alternativa_url) setImagenAlternativaPreview(data.imagen_alternativa_url)
      }
      setLoading(false)
    }
    cargar()
  }, [sid])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setForm({ ...form, [name]: (e.target as HTMLInputElement).checked })
    } else {
      setForm({ ...form, [name]: value })
    }
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      let imagen_url = solicitud?.imagen_url
      let imagen_alternativa_url = solicitud?.imagen_alternativa_url

      if (imagenPrincipalFile) imagen_url = await uploadImagen(imagenPrincipalFile)
      if (imagenAlternativaFile) imagen_alternativa_url = await uploadImagen(imagenAlternativaFile)
      if (!imagenPrincipalPreview) imagen_url = undefined
      if (!imagenAlternativaPreview) imagen_alternativa_url = undefined

      await updateSolicitud(sid as string, {
        articulo: form.articulo,
        alternativa: form.alternativa || undefined,
        categoria: form.categoria || undefined,
        lugar_entrega: form.lugar_entrega || undefined,
        precio_compra: form.precio_compra ? parseFloat(form.precio_compra) : undefined,
        precio_venta: form.precio_venta ? parseFloat(form.precio_venta) : undefined,
        estado: form.estado as Solicitud['estado'],
        cobrado: form.cobrado,
        notas: form.notas || undefined,
        imagen_url,
        imagen_alternativa_url,
      } as Partial<Solicitud>)

      router.push(`/pedidos/${id}`)
    } catch {
      setError('Error al guardar los cambios.')
      setSaving(false)
    }
  }

  async function handleEliminar() {
    if (!confirm('¿Eliminar esta solicitud?')) return
    const supabase = createClient()
    await supabase.from('solicitudes').delete().eq('id', sid)
    router.push(`/pedidos/${id}`)
  }

  if (loading) return <p className="text-gray-400">Cargando...</p>
  if (!solicitud) return <p className="text-red-500">Solicitud no encontrada.</p>

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/pedidos/${id}`}>
          <Button variant="ghost" size="icon"><ArrowLeft size={18} /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-violet-700">Editar Solicitud</h1>
          <p className="text-xs text-gray-500">Cliente: {solicitud.cliente?.nombre}</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Estado y cobro */}
        <Card>
          <CardHeader><CardTitle className="text-sm text-gray-700">Estado</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Estado de la solicitud</Label>
              <select
                name="estado"
                value={form.estado}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {estadoOpciones.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="cobrado"
                checked={form.cobrado}
                onChange={handleChange}
                className="w-4 h-4 accent-violet-600"
              />
              <span className="text-sm">Ya se cobró este pedido</span>
            </label>
          </CardContent>
        </Card>

        {/* Artículo */}
        <Card>
          <CardHeader><CardTitle className="text-sm text-gray-700">Artículo</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Descripción del artículo *</Label>
              <Input name="articulo" value={form.articulo} onChange={handleChange} />
            </div>

            {/* Imagen principal */}
            <div className="space-y-1">
              <p className="text-xs text-gray-500 font-medium">Foto del artículo principal</p>
              {imagenPrincipalPreview ? (
                <div className="relative w-fit">
                  <img src={imagenPrincipalPreview} alt="Principal" className="h-28 w-28 object-cover rounded-lg border" />
                  <button
                    onClick={() => { setImagenPrincipalPreview(null); setImagenPrincipalFile(null) }}
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
                    if (!file) return
                    if (!file.type.startsWith('image/')) {
                      alert('Solo se pueden subir imágenes (jpg, png, webp, etc.)')
                      e.target.value = ''
                      return
                    }
                    setImagenPrincipalFile(file)
                    setImagenPrincipalPreview(URL.createObjectURL(file))
                  }} /> 
                </label>
              )}
            </div>

            <div className="space-y-2">
              <Label>Alternativa aceptada</Label>
              <Input name="alternativa" value={form.alternativa} onChange={handleChange}
                placeholder="Si no hay ese, ¿qué otro acepta?" />
            </div>

            {/* Imagen alternativa */}
            <div className="space-y-1">
              <p className="text-xs text-gray-500 font-medium">Foto de la alternativa (opcional)</p>
              {imagenAlternativaPreview ? (
                <div className="relative w-fit">
                  <img src={imagenAlternativaPreview} alt="Alternativa" className="h-28 w-28 object-cover rounded-lg border" />
                  <button
                    onClick={() => { setImagenAlternativaPreview(null); setImagenAlternativaFile(null) }}
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
                    if (!file) return
                    if (!file.type.startsWith('image/')) {
                      alert('Solo se pueden subir imágenes (jpg, png, webp, etc.)')
                      e.target.value = ''
                      return
                    }
                    setImagenAlternativaFile(file)
                    setImagenAlternativaPreview(URL.createObjectURL(file))
                  }} />
                </label>
              )}
            </div>
            <div className="space-y-2">
              <Label>Categoría del artículo</Label>
              <select
                name="categoria"
                value={form.categoria}
                onChange={handleChange}
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
          </CardContent>
        </Card>

        {/* Entrega y precios */}
        <Card>
          <CardHeader><CardTitle className="text-sm text-gray-700">Entrega y precios</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Lugar de entrega</Label>
              <select
                name="lugar_entrega"
                value={form.lugar_entrega}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">-- Seleccioná el lugar --</option>
                <option value="Cartago">Cartago</option>
                <option value="San José">San José</option>
                <option value="Guápiles">Guápiles</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Precio de compra (₡)</Label>
                <Input name="precio_compra" type="number" value={form.precio_compra} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label>Precio de venta (₡)</Label>
                <Input name="precio_venta" type="number" value={form.precio_venta} onChange={handleChange} />
              </div>
            </div>
            {form.precio_compra && form.precio_venta && (
              <p className="text-sm text-green-600 font-medium">
                Ganancia: {formatearPrecio(parseFloat(form.precio_venta) - parseFloat(form.precio_compra))}
              </p>
            )}
            <div className="space-y-2">
              <Label>Notas especiales</Label>
              <Textarea name="notas" value={form.notas} onChange={handleChange} rows={2}
                placeholder="Indicaciones del cliente..." />
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3">
          <Button
            className="flex-1 bg-violet-600 hover:bg-violet-700"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
          <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50"
            onClick={handleEliminar}>
            Eliminar
          </Button>
        </div>
      </div>
    </div>
  )
}