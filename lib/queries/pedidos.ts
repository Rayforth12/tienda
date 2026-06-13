import { createClient } from '@/lib/supabase'
import { Pedido } from '@/types'

export async function getPedidos(): Promise<Pedido[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pedidos')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getPedidoById(id: string): Promise<Pedido | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pedidos')
    .select('*, solicitudes(*, cliente:clientes(*))')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createPedido(pedido: {
  nombre: string
  fecha_limite: string
  fecha_entrega?: string
  notas?: string
}) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('pedidos')
    .insert(pedido)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updatePedido(id: string, updates: Partial<Pedido>) {
  const supabase = createClient()
  const { error } = await supabase
    .from('pedidos')
    .update(updates)
    .eq('id', id)
  if (error) throw error
}

export async function cerrarPedidosVencidos() {
  const supabase = createClient()
  const hoy = new Date().toISOString().split('T')[0]
  const { error } = await supabase
    .from('pedidos')
    .update({ estado: 'cerrado' })
    .eq('estado', 'abierto')
    .lt('fecha_limite', hoy)
  if (error) throw error
}