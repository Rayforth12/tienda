import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch(
      'https://gee.bccr.fi.cr/indicadoreseconomicos/Cuadros/frmConsultaTCVentanilla.aspx',
      { next: { revalidate: 3600 } }
    )
    const html = await res.text()

    // Extraer filas de la tabla
    const filas: { entidad: string; tipo: string; compra: string; venta: string }[] = []
    const filaRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
    const celdaRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi

    let filaMatch
    let tipoActual = ''

    while ((filaMatch = filaRegex.exec(html)) !== null) {
      const filaHtml = filaMatch[1]
      const celdas: string[] = []
      let celdaMatch
      while ((celdaMatch = celdaRegex.exec(filaHtml)) !== null) {
        const texto = celdaMatch[1].replace(/<[^>]+>/g, '').trim()
        if (texto) celdas.push(texto)
      }

      if (celdas.length >= 3) {
        if (celdas.length === 4) tipoActual = celdas[0]
        const entidad = celdas.length === 4 ? celdas[1] : celdas[0]
        const compra = celdas.length === 4 ? celdas[2] : celdas[1]
        const venta = celdas.length === 4 ? celdas[3] : celdas[2]

        if (compra.includes(',') || compra.match(/\d/)) {
          filas.push({ tipo: tipoActual, entidad, compra, venta })
        }
      }
    }

    return NextResponse.json({ filas })
  } catch {
    return NextResponse.json({ error: 'No se pudo obtener el tipo de cambio' }, { status: 500 })
  }
}