export interface Cliente {
  id: string
  nombre: string
  telefono?: string
  lugar_entrega_habitual?: string
  notas?: string
  created_at: string
}

export interface Pedido {
  id: string
  nombre: string
  fecha_limite: string
  fecha_entrega?: string
  estado: 'abierto' | 'cerrado' | 'entregado'
  gastos_viaje?: number
  notas?: string
  created_at: string
  solicitudes?: Solicitud[]
}

export interface Solicitud {
  id: string
  pedido_id: string
  cliente_id: string
  articulo: string
  alternativa?: string
  imagen_url?: string
  imagen_alternativa_url?: string
  lugar_entrega?: string
  precio_compra?: number
  precio_venta?: number
  ganancia?: number
  estado: 'pendiente' | 'conseguido' | 'no_disponible' | 'entregado'
  cobrado: boolean
  notas?: string
  created_at: string
  cliente?: Cliente
  
}

export interface ArticuloInventario {
  id: string
  nombre: string
  imagen_url?: string
  categoria?: string
  precio_compra: number
  precio_venta: number
  cantidad: number
  estado: 'disponible' | 'reservado' | 'vendido'
  pedido_origen_id?: string
  comprador_nombre?: string
  notas?: string
  created_at: string
}

export interface Configuracion {
  id: number
  nombre_negocio: string
  moneda: string
  margen_minimo: number
}