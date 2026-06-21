import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()
  await supabase.from('configuracion').select('id').eq('id', 1).single()
  return NextResponse.json({ ok: true, timestamp: new Date().toISOString() })
}