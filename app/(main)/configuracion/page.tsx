'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, Check } from 'lucide-react'

export default function ConfiguracionPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [form, setForm] = useState({
    nombre_negocio: '',
    moneda: 'CRC',
    margen_minimo: '20',
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
          moneda: data.moneda || 'CRC',
          margen_minimo: data.margen_minimo?.toString() || '20',
        })
      }
      setLoading(false)
    }
    cargar()
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleGuardar() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('configuracion').update({
      nombre_negocio: form.nombre_negocio,
      moneda: form.moneda,
      margen_minimo: parseFloat(form.margen_minimo),
      updated_at: new Date().toISOString(),
    }).eq('id', 1)
    setSaving(false)
    setGuardado(true)
    setTimeout(() => setGuardado(false), 3000)
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
              <Input
                name="nombre_negocio"
                placeholder="Ej: Tienda Frontera"
                value={form.nombre_negocio}
                onChange={handleChange}
              />
              <p className="text-xs text-gray-400">Este nombre aparece en el encabezado del sistema.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-700">Preferencias de precios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Moneda principal</Label>
              <select
                name="moneda"
                value={form.moneda}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="CRC">Colones costarricenses (₡)</option>
                <option value="USD">Dólares ($)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Margen mínimo de ganancia (%)</Label>
              <Input
                name="margen_minimo"
                type="number"
                min="0"
                max="100"
                value={form.margen_minimo}
                onChange={handleChange}
              />
              <p className="text-xs text-gray-400">
                Referencia para saber si una venta está por debajo de lo esperado.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-700">Cuenta</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500 mb-3">
              Para cambiar el correo o la contraseña de acceso, contactá al administrador del sistema.
            </p>
          </CardContent>
        </Card>

        <Button
          className="w-full bg-violet-600 hover:bg-violet-700 gap-2"
          onClick={handleGuardar}
          disabled={saving}
        >
          {guardado ? (
            <><Check size={16} /> Guardado</>
          ) : saving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  )
}