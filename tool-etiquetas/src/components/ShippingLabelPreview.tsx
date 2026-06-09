/**
 * Vista previa de etiqueta de envío
 */

import { X, Download, Printer, Package, MapPin, Phone, Mail, Hash, Scale } from 'lucide-react'
import type { ShippingLabel } from '@/types/shipping.types'

interface ShippingLabelPreviewProps {
  label: ShippingLabel
  isOpen: boolean
  onClose: () => void
  onDownload?: () => void
  onPrint?: () => void
}

const STATUS_CONFIG: Record<ShippingLabel['status'], { label: string; cls: string }> = {
  pending:   { label: 'Pendiente',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  printed:   { label: 'Impresa',    cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  shipped:   { label: 'Enviada',    cls: 'bg-violet-50 text-violet-700 border-violet-200' },
  delivered: { label: 'Entregada',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Cancelada',  cls: 'bg-red-50 text-red-600 border-red-200' },
}

export function ShippingLabelPreview({ label, isOpen, onClose, onDownload, onPrint }: ShippingLabelPreviewProps) {
  if (!isOpen) return null

  const addr = label.recipientAddress
  const addressLines = [
    `${addr.street} ${addr.number}${addr.floor ? `, ${addr.floor}` : ''}${addr.door ? ` ${addr.door}` : ''}`,
    `${addr.postalCode} ${addr.city}`,
    addr.province,
    addr.country,
  ].filter(Boolean)

  const status = STATUS_CONFIG[label.status]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand/10 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Detalle de Etiqueta</h2>
              <p className="text-xs font-mono text-gray-400 mt-0.5">{label.trackingNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Estado + Transportista */}
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg border ${status.cls}`}>
              {status.label}
            </span>
            <span className="text-sm font-semibold text-gray-700 capitalize bg-gray-100 px-3 py-1.5 rounded-lg">
              {label.carrier}
            </span>
          </div>

          {/* Pedido */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Hash className="w-3 h-3" /> Pedido</p>
              <p className="text-sm font-semibold text-gray-800">{label.orderId}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Tracking</p>
              <p className="text-xs font-mono font-medium text-gray-700 break-all">{label.trackingNumber}</p>
            </div>
          </div>

          {/* Destinatario */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Destinatario</h3>
            <div className="border border-gray-100 rounded-xl p-4 space-y-3">
              <p className="text-base font-semibold text-gray-800">{label.recipientName}</p>
              {label.recipientPhone && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Phone className="w-3.5 h-3.5" /> {label.recipientPhone}
                </div>
              )}
              {label.recipientEmail && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Mail className="w-3.5 h-3.5" /> {label.recipientEmail}
                </div>
              )}
              <div className="flex items-start gap-2 pt-2 border-t border-gray-50">
                <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-600 space-y-0.5">
                  {addressLines.map((line, i) => <p key={i}>{line}</p>)}
                </div>
              </div>
            </div>
          </div>

          {/* Dimensiones */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Paquete</h3>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Peso', value: `${label.weight} kg`, icon: <Scale className="w-3.5 h-3.5" /> },
                { label: 'Largo', value: `${label.dimensions.length} cm` },
                { label: 'Ancho', value: `${label.dimensions.width} cm` },
                { label: 'Alto', value: `${label.dimensions.height} cm` },
              ].map(({ label: lbl, value, icon }) => (
                <div key={lbl} className="bg-gray-50 rounded-xl p-3 text-center">
                  {icon && <div className="flex justify-center text-gray-400 mb-1">{icon}</div>}
                  <p className="text-xs text-gray-400 mb-1">{lbl}</p>
                  <p className="text-sm font-semibold text-gray-800">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Info adicional */}
          {(label.declaredValue || label.insurance || label.notes) && (
            <div className="p-4 bg-gray-50 rounded-xl space-y-2.5">
              {label.declaredValue && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Valor declarado</span>
                  <span className="text-sm font-medium text-gray-700">{label.declaredValue.toFixed(2)} €</span>
                </div>
              )}
              {label.insurance && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Seguro</span>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">✓ Incluido</span>
                </div>
              )}
              {label.notes && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Notas</p>
                  <p className="text-sm text-gray-600">{label.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
            <div>
              <p className="mb-1">Creada</p>
              <p className="text-gray-600 font-medium">{new Date(label.createdAt).toLocaleString('es-ES')}</p>
            </div>
            <div>
              <p className="mb-1">Actualizada</p>
              <p className="text-gray-600 font-medium">{new Date(label.updatedAt).toLocaleString('es-ES')}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <div>
            {label.labelUrl && (
              <a href={label.labelUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand hover:underline">
                Ver PDF completo →
              </a>
            )}
          </div>
          <div className="flex gap-2">
            {onPrint && (
              <button onClick={onPrint} className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5">
                <Printer className="w-3.5 h-3.5" /> Imprimir
              </button>
            )}
            {onDownload && (
              <button onClick={onDownload} className="px-4 py-2 text-sm font-semibold text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" /> Descargar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
