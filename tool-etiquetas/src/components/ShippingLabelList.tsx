/**
 * Lista de etiquetas de envío
 */

import { useState } from 'react'
import { Package, Search, Filter, Download, Eye, Trash2 } from 'lucide-react'
import type { ShippingLabel, ShippingLabelStatus } from '@/types/shipping.types'

interface ShippingLabelListProps {
  labels: ShippingLabel[]
  loading: boolean
  onView: (label: ShippingLabel) => void
  onDelete: (id: string) => void
  onDownload?: (label: ShippingLabel) => void
  onStatusChange?: (id: string, status: ShippingLabelStatus) => void
}

const STATUS_COLORS: Record<ShippingLabelStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  printed: 'bg-blue-50 text-blue-700 border border-blue-200',
  shipped: 'bg-violet-50 text-violet-700 border border-violet-200',
  delivered: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  cancelled: 'bg-red-50 text-red-600 border border-red-200',
}

const STATUS_LABELS: Record<ShippingLabelStatus, string> = {
  pending: 'Pendiente',
  printed: 'Impresa',
  shipped: 'Enviada',
  delivered: 'Entregada',
  cancelled: 'Cancelada',
}

export function ShippingLabelList({
  labels,
  loading,
  onView,
  onDelete,
  onDownload,
}: ShippingLabelListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<ShippingLabelStatus | 'all'>('all')
  const [carrierFilter, setCarrierFilter] = useState<string>('all')

  const filteredLabels = labels.filter(label => {
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      !term ||
      label.trackingNumber.toLowerCase().includes(term) ||
      label.orderId.toLowerCase().includes(term) ||
      label.recipientName.toLowerCase().includes(term) ||
      label.recipientAddress.city.toLowerCase().includes(term)

    const matchesStatus = statusFilter === 'all' || label.status === statusFilter
    const matchesCarrier = carrierFilter === 'all' || label.carrier === carrierFilter

    return matchesSearch && matchesStatus && matchesCarrier
  })

  const carriers = Array.from(new Set(labels.map(l => l.carrier)))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-brand/10 flex items-center justify-center animate-pulse">
            <Package className="w-6 h-6 text-brand" />
          </div>
          <p className="text-sm text-gray-400 font-medium">Cargando etiquetas...</p>
        </div>
      </div>
    )
  }

  if (labels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <Package className="w-8 h-8 text-gray-300" />
        </div>
        <h3 className="text-base font-semibold text-gray-700 mb-1">No hay etiquetas todavía</h3>
        <p className="text-sm text-gray-400">Creá tu primera etiqueta para empezar</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar tracking, pedido, destinatario..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none transition-all"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as ShippingLabelStatus | 'all')}
            className="pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl appearance-none bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
          >
            <option value="all">Todos los estados</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        {carriers.length > 1 && (
          <select
            value={carrierFilter}
            onChange={e => setCarrierFilter(e.target.value)}
            className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl appearance-none bg-white focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none"
          >
            <option value="all">Todos los transportistas</option>
            {carriers.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['Tracking', 'Pedido', 'Destinatario', 'Transportista', 'Estado', 'Fecha', ''].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredLabels.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-400">
                    Sin resultados para los filtros actuales
                  </td>
                </tr>
              ) : (
                filteredLabels.map(label => (
                  <tr key={label.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-5 py-4">
                      <span className="text-xs font-mono font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-md">
                        {label.trackingNumber}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-700">{label.orderId}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm font-medium text-gray-800">{label.recipientName}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {label.recipientAddress.city}, {label.recipientAddress.province}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-600 capitalize">{label.carrier}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg ${STATUS_COLORS[label.status]}`}>
                        {STATUS_LABELS[label.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-400">
                      {new Date(label.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onView(label)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-brand/10 text-gray-400 hover:text-brand transition-colors" title="Ver">
                          <Eye className="w-4 h-4" />
                        </button>
                        {onDownload && (
                          <button onClick={() => onDownload(label)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-brand/10 text-gray-400 hover:text-brand transition-colors" title="Descargar">
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => onDelete(label.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Eliminar">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">
        {filteredLabels.length} de {labels.length} etiquetas
      </p>
    </div>
  )
}
