import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatearPrecio(monto: number, moneda = 'CRC'): string {
  if (moneda === 'USD') {
    return `$${monto.toFixed(2)}`
  }
  return `₡${monto.toLocaleString('es-CR')}`
}

export function formatearFecha(fecha: string): string {
  return new Date(fecha + 'T00:00:00').toLocaleDateString('es-CR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function pedidoEstaVencido(fecha_limite: string): boolean {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const limite = new Date(fecha_limite + 'T00:00:00')
  return limite < hoy
}

export function calcularMargen(compra: number, venta: number): number {
  if (compra === 0) return 0
  return Math.round(((venta - compra) / compra) * 100)
}