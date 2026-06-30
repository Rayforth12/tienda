import { NextResponse } from 'next/server'

function limpiarTexto(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

const esNumero = (s: string) => /^\d{2,3}([.,]\d+)?$/.test(s.trim())

export async function GET() {
  try {
    const res = await fetch(
      'https://gee.bccr.fi.cr/indicadoreseconomicos/Cuadros/frmConsultaTCVentanilla.aspx',
      { next: { revalidate: 3600 } }
    )
    const html = await res.text()

    const filas: { entidad: string; compra: string; venta: string }[] = []
    const filaRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
    const celdaRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi

    let filaMatch
    while ((filaMatch = filaRegex.exec(html)) !== null) {
      const filaHtml = filaMatch[1]
      const celdas: string[] = []
      let celdaMatch
      while ((celdaMatch = celdaRegex.exec(filaHtml)) !== null) {
        celdas.push(limpiarTexto(celdaMatch[1]))
      }
      const celdasLimpias = celdas.filter(c => c.length > 0)
      if (celdasLimpias.length < 3) continue

      // Buscar la primera celda que NO sea número (esa es la entidad)
      const idxEntidad = celdasLimpias.findIndex(c => !esNumero(c))
      if (idxEntidad === -1) continue

      const entidad = celdasLimpias[idxEntidad]
      const numeros = celdasLimpias.slice(idxEntidad + 1).filter(esNumero)
      if (numeros.length < 2) continue

      const compra = numeros[0]
      const venta = numeros[1]

      // Evitar duplicados de encabezados de categoría (ej: "Bancos públicos")
      if (entidad.length < 4) continue

      filas.push({ entidad, compra, venta })
    }

    return NextResponse.json({ filas })
  } catch {
    return NextResponse.json({ error: 'No se pudo obtener el tipo de cambio' }, { status: 500 })
  }
}