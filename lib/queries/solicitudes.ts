import { createClient } from '@/lib/supabase'
import { Solicitud } from '@/types'

export async function getSolicitudesByPedido(pedidoId: string): Promise<Solicitud[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('solicitudes')
    .select('*, cliente:clientes(*)')
    .eq('pedido_id', pedidoId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function createSolicitud(solicitud: {
  pedido_id: string
  cliente_id: string
  articulo: string
  alternativa?: string
  imagen_url?: string
  imagen_alternativa_url?: string
  lugar_entrega?: string
  precio_compra?: number
  precio_venta?: number
  notas?: string
}) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('solicitudes')
    .insert(solicitud)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateSolicitud(id: string, updates: Partial<Solicitud>) {
  const supabase = createClient()
  const { error } = await supabase
    .from('solicitudes')
    .update(updates)
    .eq('id', id)
  if (error) throw error
}

export async function uploadImagen(file: File): Promise<string> {
  const supabase = createClient()
  const nombre = `${Date.now()}-${file.name}`
  const { error } = await supabase.storage
    .from('imagenes')
    .upload(nombre, file)
  if (error) throw error
  const { data } = supabase.storage.from('imagenes').getPublicUrl(nombre)
  return data.publicUrl
}

export async function uploadMultiplesImagenes(files: File[]): Promise<string[]> {
  const urls: string[] = []
  for (const file of files) {
    const url = await uploadImagen(file)
    urls.push(url)
  }
  return urls
}