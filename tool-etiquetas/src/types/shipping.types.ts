/**
 * Tipos para el módulo de Gestor de Etiquetas de Envíos
 * Compatible con Supabase (snake_case en DB, camelCase en app)
 */

export type Carrier = 'correos' | 'dhl' | 'fedex' | 'seur' | 'ups' | 'otro'

export type ShippingLabelStatus =
  | 'pending'
  | 'printed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export interface Address {
  street: string
  number: string
  floor?: string
  door?: string
  postalCode: string
  city: string
  province: string
  country: string
}

export interface ShippingDimensions {
  length: number // cm
  width: number  // cm
  height: number // cm
}

export interface ShippingLabel {
  id: string
  orderId: string
  carrier: Carrier
  trackingNumber: string
  recipientName: string
  recipientPhone?: string
  recipientEmail?: string
  recipientAddress: Address
  senderAddress?: Address
  weight: number // kg
  dimensions: ShippingDimensions
  labelUrl?: string
  createdAt: Date
  updatedAt: Date
  status: ShippingLabelStatus
  userId: string
  notes?: string
  declaredValue?: number
  insurance?: boolean
}

export interface ShippingLabelFormData {
  orderId: string
  carrier: Carrier
  recipientName: string
  recipientPhone?: string
  recipientEmail?: string
  recipientAddress: Address
  weight: number
  dimensions: ShippingDimensions
  notes?: string
  declaredValue?: number
  insurance?: boolean
}

export interface ShippingStats {
  total: number
  pending: number
  printed: number
  shipped: number
  delivered: number
  cancelled: number
}

export interface CarrierConfig {
  id: Carrier
  name: string
  color: string
}

export const CARRIERS: CarrierConfig[] = [
  { id: 'correos', name: 'Correos', color: '#FFCD00' },
  { id: 'dhl', name: 'DHL', color: '#FFCC00' },
  { id: 'fedex', name: 'FedEx', color: '#4D148C' },
  { id: 'seur', name: 'SEUR', color: '#FF6B00' },
  { id: 'ups', name: 'UPS', color: '#351C15' },
  { id: 'otro', name: 'Otro', color: '#6B7280' },
]
