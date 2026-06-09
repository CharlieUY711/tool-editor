/**
 * Hook para gestión de etiquetas de envío (Supabase)
 * Puede usarse standalone o inyectando un userId externo
 */

import { useState, useEffect, useCallback } from 'react'
import {
  createShippingLabel,
  getShippingLabels,
  getShippingLabelById,
  updateShippingLabelStatus,
  updateShippingLabel,
  deleteShippingLabel,
  searchShippingLabels,
  getShippingStats,
  getShippingLabelsByOrderId,
} from '@/services/shippingLabelService'
import type {
  ShippingLabel,
  ShippingLabelFormData,
  ShippingLabelStatus,
  ShippingStats,
} from '@/types/shipping.types'

interface UseShippingLabelsOptions {
  /** userId para modo integrado (inyectado desde la app padre) */
  userId?: string
}

interface UseShippingLabelsReturn {
  labels: ShippingLabel[]
  loading: boolean
  error: string | null
  stats: ShippingStats
  createLabel: (formData: ShippingLabelFormData) => Promise<ShippingLabel>
  updateStatus: (id: string, status: ShippingLabelStatus) => Promise<void>
  updateLabel: (id: string, data: Partial<ShippingLabel>) => Promise<void>
  removeLabel: (id: string) => Promise<void>
  search: (term: string) => Promise<ShippingLabel[]>
  refresh: () => Promise<void>
  getLabelById: (id: string) => Promise<ShippingLabel | null>
  getLabelsByOrderId: (orderId: string) => Promise<ShippingLabel[]>
}

const DEFAULT_STATS: ShippingStats = {
  total: 0,
  pending: 0,
  printed: 0,
  shipped: 0,
  delivered: 0,
  cancelled: 0,
}

export function useShippingLabels(
  options: UseShippingLabelsOptions = {}
): UseShippingLabelsReturn {
  const resolvedUserId = options.userId

  const [labels, setLabels] = useState<ShippingLabel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<ShippingStats>(DEFAULT_STATS)

  const loadLabels = useCallback(async () => {
    if (!resolvedUserId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const [fetchedLabels, fetchedStats] = await Promise.all([
        getShippingLabels(resolvedUserId),
        getShippingStats(resolvedUserId),
      ])
      setLabels(fetchedLabels)
      setStats(fetchedStats)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar etiquetas'
      console.error(message)
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [resolvedUserId])

  useEffect(() => {
    loadLabels()
  }, [loadLabels])

  const createLabel = useCallback(
    async (formData: ShippingLabelFormData): Promise<ShippingLabel> => {
      if (!resolvedUserId) throw new Error('Usuario no autenticado')
      setError(null)
      const newLabel = await createShippingLabel(formData, resolvedUserId)
      await loadLabels()
      return newLabel
    },
    [resolvedUserId, loadLabels]
  )

  const updateStatus = useCallback(
    async (id: string, status: ShippingLabelStatus): Promise<void> => {
      setError(null)
      await updateShippingLabelStatus(id, status)
      setLabels(prev =>
        prev.map(l => (l.id === id ? { ...l, status, updatedAt: new Date() } : l))
      )
      await loadLabels()
    },
    [loadLabels]
  )

  const updateLabelFn = useCallback(
    async (id: string, data: Partial<ShippingLabel>): Promise<void> => {
      setError(null)
      await updateShippingLabel(id, data)
      setLabels(prev =>
        prev.map(l => (l.id === id ? { ...l, ...data, updatedAt: new Date() } : l))
      )
    },
    []
  )

  const removeLabel = useCallback(
    async (id: string): Promise<void> => {
      setError(null)
      await deleteShippingLabel(id)
      setLabels(prev => prev.filter(l => l.id !== id))
      await loadLabels()
    },
    [loadLabels]
  )

  const search = useCallback(
    async (term: string): Promise<ShippingLabel[]> => {
      if (!resolvedUserId) return []
      setError(null)
      return searchShippingLabels(term, resolvedUserId)
    },
    [resolvedUserId]
  )

  const getLabelById = useCallback(
    async (id: string): Promise<ShippingLabel | null> => getShippingLabelById(id),
    []
  )

  const getLabelsByOrderId = useCallback(
    async (orderId: string): Promise<ShippingLabel[]> => {
      if (!resolvedUserId) return []
      return getShippingLabelsByOrderId(orderId, resolvedUserId)
    },
    [resolvedUserId]
  )

  return {
    labels,
    loading,
    error,
    stats,
    createLabel,
    updateStatus,
    updateLabel: updateLabelFn,
    removeLabel,
    search,
    refresh: loadLabels,
    getLabelById,
    getLabelsByOrderId,
  }
}
