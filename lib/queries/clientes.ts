import { createClient } from '@/lib/supabase'
import { Cliente } from '@/types'

export async function getClientes(): Promise<Cliente[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('nombre', { ascending: true })
  if (error) throw error
  return data || []
}

export async function createCliente(cliente: {
  nombre: string
  telefono?: string
  lugar_entrega_habitual?: string
  notas?: string
}) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clientes')
    .insert(cliente)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCliente(id: string, updates: Partial<Cliente>) {
  const supabase = createClient()
  const { error } = await supabase
    .from('clientes')
    .update(updates)
    .eq('id', id)
  if (error) throw error
}

export async function buscarCliente(texto: string): Promise<Cliente[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .ilike('nombre', `%${texto}%`)
    .limit(5)
  if (error) throw error
  return data || []
}