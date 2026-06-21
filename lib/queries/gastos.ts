import { createClient } from '@/lib/supabase'

export interface GastoPedido {
  id: string
  pedido_id: string
  descripcion: string
  monto: number
  tipo: string
  created_at: string
}

export async function getGastosByPedido(pedidoId: string): Promise<GastoPedido[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('gastos_pedido')
    .select('*')
    .eq('pedido_id', pedidoId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function createGasto(gasto: {
  pedido_id: string
  descripcion: string
  monto: number
  tipo: string
}) {
  const supabase = createClient()
  const { error } = await supabase.from('gastos_pedido').insert(gasto)
  if (error) throw error
}

export async function deleteGasto(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('gastos_pedido').delete().eq('id', id)
  if (error) throw error
}