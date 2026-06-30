import { NextResponse } from 'next/server'

function limpiarTexto(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function GET() {
  try {
    const res = await fetch(
      'https://gee.bccr.fi.cr/indicadoreseconomicos/Cuadros/frmConsultaTCVentanilla.aspx',
      { next: { revalidate: 3600 } }
    )
    const html = await res.text()

    const filas: { tipo: string; entidad: string; compra: string; venta: string }[] = []
    const filaRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
    const celdaRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi

    let filaMatch
    let tipoActual = ''

    while ((filaMatch = filaRegex.exec(html)) !== null) {
      const filaHtml = filaMatch[1]
      const celdas: string[] = []
      let celdaMatch
      while ((celdaMatch = celdaRegex.exec(filaHtml)) !== null) {
        celdas.push(limpiarTexto(celdaMatch[1]))
      }

      // Filtrar filas vacías o de encabezado
      const celdasLimpias = celdas.filter(c => c.length > 0)
      if (celdasLimpias.length < 3) continue

      let tipo = ''
      let entidad = ''
      let compra = ''
      let venta = ''

      if (celdasLimpias.length >= 5) {
        // Fila con tipo de entidad incluido
        tipo = celdasLimpias[0]
        entidad = celdasLimpias[1]
        compra = celdasLimpias[2]
        venta = celdasLimpias[3]
        tipoActual = tipo
      } else if (celdasLimpias.length === 4) {
        entidad = celdasLimpias[0]
        compra = celdasLimpias[1]
        venta = celdasLimpias[2]
        tipo = tipoActual
      } else {
        continue
      }

      // Validar que compra y venta sean números
      const esNumero = (s: string) => /^\d{2,3}([.,]\d+)?$/.test(s.trim())
      if (!entidad || !esNumero(compra) || !esNumero(venta)) continue

      filas.push({ tipo: tipo || tipoActual, entidad, compra, venta })
    }

    return NextResponse.json({ filas })
  } catch {
    return NextResponse.json({ error: 'No se pudo obtener el tipo de cambio' }, { status: 500 })
  }
}