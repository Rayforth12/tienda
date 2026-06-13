'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSolicitud, uploadImagen } from '@/lib/queries/solicitudes'
import { getClientes, createCliente } from '@/lib/queries/clientes'
import { Cliente } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Upload, X } from 'lucide-react'

interface ImagenInput {
  file: File | null
  preview: string | null
}

function ImagenUploader({
  label,
  imagen,
  onChange,
  onClear,
}: {
  label: string
  imagen: ImagenInput
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClear: () => void
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      {imagen.preview ? (
        <div className="relative w-fit">
          <img src={imagen.preview} alt="Preview" className="h-28 w-28 object-cover rounded-lg border" />
          <button
            onClick={onClear}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <label className="flex items-center gap-2 border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 cursor-pointer hover:border-violet-400 transition-colors w-fit">
          <Upload size={16} className="text-gray-400" />
          <span className="text-sm text-gray-500">Subir foto</span>
          <input type="file" accept="image/*" className="hidden" onChange={onChange} />
        </label>
      )}
    </div>
  )
}

export default function NuevaSolicitudPage() {
  const { id } = useParams()
  const router = useRouter()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [nuevoCliente, setNuevoCliente] = useState(false)

  const [imagenPrincipal, setImagenPrincipal] = useState<ImagenInput>({ file: null, preview: null })
  const [imagenAlternativa, setImagenAlternativa] = useState<ImagenInput>({ file: null, preview: null })

  const [form, setForm] = useState({
    cliente_id: '',
    nombre_nuevo_cliente: '',
    telefono_nuevo_cliente: '',
    articulo: '',
    alternativa: '',
    categoria: '',
    lugar_entrega: '',
    precio_compra: '',
    precio_venta: '',
    notas: '',
  })

  useEffect(() => { getClientes().then(setClientes) }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleImagen(tipo: 'principal' | 'alternativa') {
  return (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Solo se pueden subir imágenes (jpg, png, webp, etc.)')
      e.target.value = ''
      return
    }
    const preview = URL.createObjectURL(file)
    if (tipo === 'principal') setImagenPrincipal({ file, preview })
    else setImagenAlternativa({ file, preview })
  }
}

  function clearImagen(tipo: 'principal' | 'alternativa') {
    if (tipo === 'principal') setImagenPrincipal({ file: null, preview: null })
    else setImagenAlternativa({ file: null, preview: null })
  }

  async function handleSubmit() {
    if (!form.articulo) { setError('El artículo es obligatorio.'); return }
    if (!nuevoCliente && !form.cliente_id) { setError('Seleccioná un cliente o creá uno nuevo.'); return }
    if (nuevoCliente && !form.nombre_nuevo_cliente) { setError('Escribí el nombre del cliente.'); return }

    setLoading(true)
    setError('')

    try {
      let clienteId = form.cliente_id
      if (nuevoCliente) {
        const nuevo = await createCliente({
          nombre: form.nombre_nuevo_cliente,
          telefono: form.telefono_nuevo_cliente || undefined,
        })
        clienteId = nuevo.id
      }

      let imagen_url: string | undefined
      let imagen_alternativa_url: string | undefined

      if (imagenPrincipal.file) imagen_url = await uploadImagen(imagenPrincipal.file)
      if (imagenAlternativa.file) imagen_alternativa_url = await uploadImagen(imagenAlternativa.file)

      await createSolicitud({
        pedido_id: id as string,
        cliente_id: clienteId,
        articulo: form.articulo,
        alternativa: form.alternativa || undefined,
        imagen_url,
        imagen_alternativa_url,
        lugar_entrega: form.lugar_entrega || undefined,
        precio_compra: form.precio_compra ? parseFloat(form.precio_compra) : undefined,
        precio_venta: form.precio_venta ? parseFloat(form.precio_venta) : undefined,
        categoria: form.categoria || undefined,
        notas: form.notas || undefined,
      })

      router.push(`/pedidos/${id}`)
    } catch {
      setError('Ocurrió un error al guardar la solicitud.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/pedidos/${id}`}>
          <Button variant="ghost" size="icon"><ArrowLeft size={18} /></Button>
        </Link>
        <h1 className="text-2xl font-bold text-violet-700">Nueva Solicitud</h1>
      </div>

      <div className="space-y-4">
        {/* Cliente */}
        <Card>
          <CardHeader><CardTitle className="text-sm text-gray-700">Cliente</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {!nuevoCliente ? (
              <>
                <div className="space-y-2">
                  <Label>Seleccionar cliente</Label>
                  <select
                    name="cliente_id"
                    value={form.cliente_id}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="">-- Elegí un cliente --</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <button onClick={() => setNuevoCliente(true)} className="text-xs text-violet-600 hover:underline">
                  + Agregar cliente nuevo
                </button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Nombre del cliente *</Label>
                  <Input name="nombre_nuevo_cliente" placeholder="Nombre completo"
                    value={form.nombre_nuevo_cliente} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono / WhatsApp</Label>
                  <Input name="telefono_nuevo_cliente" placeholder="+506 8888-0000"
                    value={form.telefono_nuevo_cliente} onChange={handleChange} />
                </div>
                <button onClick={() => setNuevoCliente(false)} className="text-xs text-violet-600 hover:underline">
                  ← Elegir cliente existente
                </button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Artículo */}
        <Card>
          <CardHeader><CardTitle className="text-sm text-gray-700">Artículo solicitado</CardTitle></CardHeader>
          <CardContent className="space-y-3">
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

            <ImagenUploader
              label="Foto del artículo principal"
              imagen={imagenPrincipal}
              onChange={handleImagen('principal')}
              onClear={() => clearImagen('principal')}
            />

            <div className="space-y-2">
              <Label>Alternativa aceptada</Label>
              <Input name="alternativa" placeholder="Si no hay ese, ¿qué otro acepta?"
                value={form.alternativa} onChange={handleChange} />
            </div>

            <ImagenUploader
              label="Foto de la alternativa (opcional)"
              imagen={imagenAlternativa}
              onChange={handleImagen('alternativa')}
              onClear={() => clearImagen('alternativa')}
            />
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
                <Input name="precio_compra" type="number" placeholder="0"
                  value={form.precio_compra} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label>Precio de venta (₡)</Label>
                <Input name="precio_venta" type="number" placeholder="0"
                  value={form.precio_venta} onChange={handleChange} />
              </div>
            </div>
            {form.precio_compra && form.precio_venta && (
              <p className="text-sm text-green-600 font-medium">
                Ganancia: ₡{(parseFloat(form.precio_venta) - parseFloat(form.precio_compra)).toLocaleString('es-CR')}
              </p>
            )}
            <div className="space-y-2">
              <Label>Notas especiales</Label>
              <Textarea name="notas" placeholder="Indicaciones del cliente..."
                value={form.notas} onChange={handleChange} rows={2} />
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button
          className="w-full bg-violet-600 hover:bg-violet-700"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Guardando...' : 'Guardar solicitud'}
        </Button>
      </div>
    </div>
  )
}