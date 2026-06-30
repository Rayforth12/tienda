'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, Check } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'


function TipoCambioTabla() {
  const [datos, setDatos] = useState<{ tipo: string; entidad: string; compra: string; venta: string }[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/tipo-cambio')
      .then(r => r.json())
      .then(d => {
        if (d.filas) setDatos(d.filas)
        else setError(true)
        setCargando(false)
      })
      .catch(() => { setError(true); setCargando(false) })
  }, [])

  if (cargando) return <p className="text-sm text-gray-400 text-center py-6">Cargando tipo de cambio...</p>
  if (error || datos.length === 0) return (
    <div className="text-center py-6 space-y-3">
      <p className="text-sm text-gray-500">No se pudo cargar la tabla automáticamente.</p>
      <a
        href="https://gee.bccr.fi.cr/indicadoreseconomicos/Cuadros/frmConsultaTCVentanilla.aspx"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block bg-violet-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-violet-700"
      >
        Ver en sitio del BCCR →
      </a>
    </div>
  )

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500">
        💡 Usá el valor de <b>Venta</b> del banco de tu preferencia.
      </p>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-violet-600 text-white">
            <th className="px-2 py-2 text-left whitespace-nowrap">Tipo</th>
            <th className="px-2 py-2 text-left">Entidad</th>
            <th className="px-2 py-2 text-right whitespace-nowrap">Compra</th>
            <th className="px-2 py-2 text-right font-bold whitespace-nowrap">Venta</th>
          </tr>
        </thead>
        <tbody>
          {datos.map((fila, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-2 py-1.5 text-gray-500 whitespace-nowrap">{fila.tipo}</td>
              <td className="px-2 py-1.5 text-gray-700">{fila.entidad}</td>
              <td className="px-2 py-1.5 text-right text-gray-600 whitespace-nowrap">{fila.compra}</td>
              <td className="px-2 py-1.5 text-right font-semibold text-violet-700 whitespace-nowrap">{fila.venta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ConfiguracionPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [error, setError] = useState('')
  const [modalTipoCambio, setModalTipoCambio] = useState(false)
  const [form, setForm] = useState({
    nombre_negocio: '',
    margen_minimo: '20',
    tipo_cambio: '520',
  })

  useEffect(() => {
    async function cargar() {
      const supabase = createClient()
      const { data } = await supabase
        .from('configuracion')
        .select('*')
        .eq('id', 1)
        .single()
      if (data) {
        setForm({
          nombre_negocio: data.nombre_negocio || '',
          margen_minimo: data.margen_minimo?.toString() || '20',
          tipo_cambio: data.tipo_cambio?.toString() || '520',
        })
      }
      setLoading(false)
    }
    cargar()
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleGuardar() {
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase
      .from('configuracion')
      .upsert({
        id: 1,
        nombre_negocio: form.nombre_negocio,
        margen_minimo: parseFloat(form.margen_minimo),
        tipo_cambio: parseFloat(form.tipo_cambio),
        updated_at: new Date().toISOString(),
      })
    if (error) {
      setError('Error al guardar: ' + error.message)
    } else {
      setGuardado(true)
      setTimeout(() => setGuardado(false), 3000)
    }
    setSaving(false)
  }

  if (loading) return <p className="text-gray-400">Cargando configuración...</p>

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Settings size={24} className="text-violet-600" />
        <div>
          <h1 className="text-2xl font-bold text-violet-700">Configuración</h1>
          <p className="text-sm text-gray-500">Ajustes generales del negocio</p>
        </div>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-700">Información del negocio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre del negocio</Label>
              <Input name="nombre_negocio" placeholder="Ej: Tienda Frontera"
                value={form.nombre_negocio} onChange={handleChange} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-700">Precios y ganancias</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de cambio (₡ por $1)</Label>
              <button
                onClick={() => setModalTipoCambio(true)}
                className="text-xs text-violet-600 hover:underline flex items-center gap-1"
              >
                📊 Ver tipo de cambio hoy
              </button>
              <Input name="tipo_cambio" type="number" min="1"
                value={form.tipo_cambio} onChange={handleChange} />
              <p className="text-xs text-gray-400">
                Actualizalo cada vez que vayas a la frontera según el tipo de cambio del día.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Margen mínimo de ganancia (%)</Label>
              <Input name="margen_minimo" type="number" min="0" max="100"
                value={form.margen_minimo} onChange={handleChange} />
              <p className="text-xs text-gray-400">
                Con este porcentaje se calcula el precio de venta sugerido automáticamente.
              </p>
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button className="w-full bg-violet-600 hover:bg-violet-700 gap-2"
          onClick={handleGuardar} disabled={saving}>
          {guardado ? <><Check size={16} /> Guardado</> : saving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>

       {/* Modal tipo de cambio */}
      <Dialog open={modalTipoCambio} onOpenChange={setModalTipoCambio}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tipo de cambio hoy — BCCR</DialogTitle>
          </DialogHeader>
          <TipoCambioTabla />
        </DialogContent>
      </Dialog>

    </div>
  )
}