/**
 * ShippingLabelManager
 *
 * Componente principal. Puede usarse de dos formas:
 *
 * 1. STANDALONE (app propia):
 *    <ShippingLabelManager userId="uuid-del-usuario" />
 *
 * 2. INTEGRADO en otra app React:
 *    import { ShippingLabelManager } from 'core-etiquetas'
 *    <ShippingLabelManager userId={currentUser.id} />
 */

import { useState } from 'react'
import { Plus, Package, Truck, CheckCircle, Clock, Printer, RefreshCw } from 'lucide-react'
import { Toaster, toast } from 'sonner'
import { useShippingLabels } from '@/hooks/useShippingLabels'
import { ShippingLabelForm } from './ShippingLabelForm'
import { ShippingLabelList } from './ShippingLabelList'
import { ShippingLabelPreview } from './ShippingLabelPreview'
import type { ShippingLabel, ShippingLabelFormData } from '@/types/shipping.types'

interface ShippingLabelManagerProps {
  /** UUID del usuario autenticado (requerido) */
  userId: string
  /** Clase CSS adicional para el wrapper */
  className?: string
  /** Callback cuando se crea una etiqueta (para integración) */
  onLabelCreated?: (label: ShippingLabel) => void
}

export function ShippingLabelManager({ userId, className = '', onLabelCreated }: ShippingLabelManagerProps) {
  const {
    labels,
    loading,
    error,
    stats,
    createLabel,
    updateStatus,
    removeLabel,
    refresh,
  } = useShippingLabels({ userId })

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState<ShippingLabel | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateLabel = async (formData: ShippingLabelFormData) => {
    try {
      setIsCreating(true)
      const newLabel = await createLabel(formData)
      toast.success('Etiqueta creada correctamente')
      setIsFormOpen(false)
      onLabelCreated?.(newLabel)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear la etiqueta'
      toast.error(msg)
      throw err
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteLabel = async (id: string) => {
    if (!confirm('¿Eliminar esta etiqueta? Esta acción no se puede deshacer.')) return
    try {
      await removeLabel(id)
      toast.success('Etiqueta eliminada')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  const handleDownload = (label: ShippingLabel) => {
    if (label.labelUrl) {
      window.open(label.labelUrl, '_blank')
    } else {
      toast.error('El PDF aún no está disponible')
    }
  }

  const handleStatusChange = async (id: string, status: ShippingLabel['status']) => {
    try {
      await updateStatus(id, status)
      toast.success('Estado actualizado')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar')
    }
  }

  const statCards = [
    { label: 'Total', value: stats.total, color: 'text-brand', bg: 'bg-brand/10', Icon: Package },
    { label: 'Pendientes', value: stats.pending, color: 'text-amber-600', bg: 'bg-amber-100', Icon: Clock },
    { label: 'Enviadas', value: stats.shipped, color: 'text-violet-600', bg: 'bg-violet-100', Icon: Truck },
    { label: 'Entregadas', value: stats.delivered, color: 'text-emerald-600', bg: 'bg-emerald-100', Icon: CheckCircle },
  ]

  return (
    <div className={`min-h-screen bg-[#f8f9fb] font-sans ${className}`}>
      <Toaster position="top-right" richColors />

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center shadow-lg shadow-brand/25">
                  <Printer className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Etiquetas de Envío</h1>
              </div>
              <p className="text-sm text-gray-500 ml-13 pl-0.5">Creá y gestioná etiquetas para tus pedidos</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={refresh}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
                title="Actualizar"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsFormOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand-dark transition-colors shadow-lg shadow-brand/25"
              >
                <Plus className="w-4 h-4" />
                Nueva Etiqueta
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map(({ label, value, color, bg, Icon }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
                  <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                </div>
                <p className={`text-3xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
            {error}
          </div>
        )}

        {/* Lista */}
        <ShippingLabelList
          labels={labels}
          loading={loading}
          onView={label => { setSelectedLabel(label); setIsPreviewOpen(true) }}
          onDelete={handleDeleteLabel}
          onDownload={handleDownload}
          onStatusChange={handleStatusChange}
        />
      </div>

      {/* Modal Formulario */}
      <ShippingLabelForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateLabel}
        loading={isCreating}
      />

      {/* Modal Preview */}
      {selectedLabel && (
        <ShippingLabelPreview
          label={selectedLabel}
          isOpen={isPreviewOpen}
          onClose={() => { setIsPreviewOpen(false); setSelectedLabel(null) }}
          onDownload={() => handleDownload(selectedLabel)}
          onPrint={() => selectedLabel.labelUrl && window.open(selectedLabel.labelUrl, '_blank')}
        />
      )}
    </div>
  )
}
