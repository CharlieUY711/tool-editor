/**
 * core-etiquetas — Public API
 *
 * Importá desde acá cuando uses el módulo integrado en otra app:
 *
 *   import { ShippingLabelManager, useShippingLabels } from 'core-etiquetas'
 */

// Componentes
export { ShippingLabelManager } from '@/components/ShippingLabelManager'
export { ShippingLabelForm } from '@/components/ShippingLabelForm'
export { ShippingLabelList } from '@/components/ShippingLabelList'
export { ShippingLabelPreview } from '@/components/ShippingLabelPreview'

// Hooks
export { useShippingLabels } from '@/hooks/useShippingLabels'

// Servicios (por si necesitás llamarlos directamente)
export {
  createShippingLabel,
  getShippingLabels,
  getShippingLabelById,
  updateShippingLabelStatus,
  updateShippingLabel,
  deleteShippingLabel,
  searchShippingLabels,
  getShippingStats,
} from '@/services/shippingLabelService'

// Tipos
export type {
  ShippingLabel,
  ShippingLabelFormData,
  ShippingLabelStatus,
  ShippingStats,
  Carrier,
  Address,
  ShippingDimensions,
} from '@/types/shipping.types'
