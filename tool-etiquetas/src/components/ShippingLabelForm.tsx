/**
 * Formulario para crear etiquetas de envío
 */

import { useState, FormEvent } from 'react'
import { X, Package, Loader2, ChevronDown } from 'lucide-react'
import type { ShippingLabelFormData, Carrier, Address } from '@/types/shipping.types'
import { CARRIERS } from '@/types/shipping.types'

interface ShippingLabelFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ShippingLabelFormData) => Promise<void>
  initialData?: Partial<ShippingLabelFormData>
  loading?: boolean
}

const EMPTY_ADDRESS: Address = {
  street: '',
  number: '',
  floor: '',
  door: '',
  postalCode: '',
  city: '',
  province: '',
  country: 'España',
}

export function ShippingLabelForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  loading = false,
}: ShippingLabelFormProps) {
  const [formData, setFormData] = useState<ShippingLabelFormData>({
    orderId: initialData?.orderId || '',
    carrier: initialData?.carrier || 'correos',
    recipientName: initialData?.recipientName || '',
    recipientPhone: initialData?.recipientPhone || '',
    recipientEmail: initialData?.recipientEmail || '',
    recipientAddress: initialData?.recipientAddress || { ...EMPTY_ADDRESS },
    weight: initialData?.weight || 1,
    dimensions: initialData?.dimensions || { length: 30, width: 20, height: 15 },
    notes: initialData?.notes || '',
    declaredValue: initialData?.declaredValue,
    insurance: initialData?.insurance || false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!isOpen) return null

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!formData.orderId.trim()) e.orderId = 'Requerido'
    if (!formData.recipientName.trim()) e.recipientName = 'Requerido'
    if (!formData.recipientAddress.street.trim()) e['addr.street'] = 'Requerido'
    if (!formData.recipientAddress.number.trim()) e['addr.number'] = 'Requerido'
    if (!formData.recipientAddress.postalCode.trim()) e['addr.postalCode'] = 'Requerido'
    if (!formData.recipientAddress.city.trim()) e['addr.city'] = 'Requerido'
    if (!formData.recipientAddress.province.trim()) e['addr.province'] = 'Requerido'
    if (formData.weight <= 0) e.weight = 'Debe ser > 0'
    if (formData.dimensions.length <= 0 || formData.dimensions.width <= 0 || formData.dimensions.height <= 0)
      e.dimensions = 'Todas las dimensiones deben ser > 0'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    try {
      await onSubmit(formData)
      onClose()
    } catch (err) {
      console.error('Error al crear etiqueta:', err)
    }
  }

  const updateAddr = (field: keyof Address, value: string) =>
    setFormData(prev => ({ ...prev, recipientAddress: { ...prev.recipientAddress, [field]: value } }))

  const input = (
    field: string,
    value: string | number,
    onChange: (v: string) => void,
    opts: { type?: string; placeholder?: string; step?: string; min?: string } = {}
  ) => (
    <input
      type={opts.type || 'text'}
      step={opts.step}
      min={opts.min}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={opts.placeholder}
      className={`w-full px-3 py-2.5 text-sm border rounded-lg outline-none transition-all
        focus:ring-2 focus:ring-brand/30 focus:border-brand
        ${errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
    />
  )

  const label = (text: string, required = false) => (
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
      {text} {required && <span className="text-brand">*</span>}
    </label>
  )

  const err = (field: string) =>
    errors[field] ? <p className="text-xs text-red-500 mt-1">{errors[field]}</p> : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand/10 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Nueva Etiqueta</h2>
              <p className="text-xs text-gray-400 mt-0.5">Completá los datos del envío</p>
            </div>
          </div>
          <button onClick={onClose} disabled={loading} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-6">

            {/* Pedido + Transportista */}
            <section>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Pedido</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  {label('Número de pedido', true)}
                  {input('orderId', formData.orderId, v => setFormData(p => ({ ...p, orderId: v })), { placeholder: 'ORD-12345' })}
                  {err('orderId')}
                </div>
                <div>
                  {label('Transportista', true)}
                  <div className="relative">
                    <select
                      value={formData.carrier}
                      onChange={e => setFormData(p => ({ ...p, carrier: e.target.value as Carrier }))}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg appearance-none bg-white hover:border-gray-300 focus:ring-2 focus:ring-brand/30 focus:border-brand outline-none transition-all"
                    >
                      {CARRIERS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </section>

            {/* Destinatario */}
            <section>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Destinatario</h3>
              <div className="space-y-3">
                <div>
                  {label('Nombre completo', true)}
                  {input('recipientName', formData.recipientName, v => setFormData(p => ({ ...p, recipientName: v })), { placeholder: 'Juan García' })}
                  {err('recipientName')}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    {label('Teléfono')}
                    {input('recipientPhone', formData.recipientPhone || '', v => setFormData(p => ({ ...p, recipientPhone: v })), { placeholder: '+34 600 000 000' })}
                  </div>
                  <div>
                    {label('Email')}
                    {input('recipientEmail', formData.recipientEmail || '', v => setFormData(p => ({ ...p, recipientEmail: v })), { type: 'email', placeholder: 'juan@email.com' })}
                  </div>
                </div>
              </div>
            </section>

            {/* Dirección */}
            <section>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Dirección de entrega</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    {label('Calle', true)}
                    {input('addr.street', formData.recipientAddress.street, v => updateAddr('street', v), { placeholder: 'Calle Mayor' })}
                    {err('addr.street')}
                  </div>
                  <div>
                    {label('Número', true)}
                    {input('addr.number', formData.recipientAddress.number, v => updateAddr('number', v), { placeholder: '42' })}
                    {err('addr.number')}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    {label('Piso')}
                    {input('addr.floor', formData.recipientAddress.floor || '', v => updateAddr('floor', v), { placeholder: '3' })}
                  </div>
                  <div>
                    {label('Puerta')}
                    {input('addr.door', formData.recipientAddress.door || '', v => updateAddr('door', v), { placeholder: 'A' })}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    {label('CP', true)}
                    {input('addr.postalCode', formData.recipientAddress.postalCode, v => updateAddr('postalCode', v), { placeholder: '28001' })}
                    {err('addr.postalCode')}
                  </div>
                  <div>
                    {label('Ciudad', true)}
                    {input('addr.city', formData.recipientAddress.city, v => updateAddr('city', v), { placeholder: 'Madrid' })}
                    {err('addr.city')}
                  </div>
                  <div>
                    {label('Provincia', true)}
                    {input('addr.province', formData.recipientAddress.province, v => updateAddr('province', v), { placeholder: 'Madrid' })}
                    {err('addr.province')}
                  </div>
                </div>
                <div>
                  {label('País')}
                  {input('addr.country', formData.recipientAddress.country, v => updateAddr('country', v), { placeholder: 'España' })}
                </div>
              </div>
            </section>

            {/* Dimensiones */}
            <section>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Dimensiones y peso</h3>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { k: 'weight', lbl: 'Peso (kg)', val: formData.weight, onChange: (v: string) => setFormData(p => ({ ...p, weight: parseFloat(v) || 0 })) },
                  { k: 'length', lbl: 'Largo (cm)', val: formData.dimensions.length, onChange: (v: string) => setFormData(p => ({ ...p, dimensions: { ...p.dimensions, length: parseInt(v) || 0 } })) },
                  { k: 'width', lbl: 'Ancho (cm)', val: formData.dimensions.width, onChange: (v: string) => setFormData(p => ({ ...p, dimensions: { ...p.dimensions, width: parseInt(v) || 0 } })) },
                  { k: 'height', lbl: 'Alto (cm)', val: formData.dimensions.height, onChange: (v: string) => setFormData(p => ({ ...p, dimensions: { ...p.dimensions, height: parseInt(v) || 0 } })) },
                ].map(({ k, lbl, val, onChange }) => (
                  <div key={k}>
                    {label(lbl, true)}
                    {input(k === 'weight' ? 'weight' : 'dimensions', val, onChange, { type: 'number', step: k === 'weight' ? '0.1' : '1', min: '0.1' })}
                  </div>
                ))}
              </div>
              {err('weight')}
              {err('dimensions')}
            </section>

            {/* Opciones adicionales */}
            <section>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Opciones adicionales</h3>
              <div className="space-y-3">
                <div>
                  {label('Valor declarado (€)')}
                  {input('declaredValue', formData.declaredValue || '', v => setFormData(p => ({ ...p, declaredValue: parseFloat(v) || undefined })), { type: 'number', step: '0.01', min: '0', placeholder: '0.00' })}
                </div>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.insurance}
                      onChange={e => setFormData(p => ({ ...p, insurance: e.target.checked }))}
                      className="sr-only"
                    />
                    <div className={`w-10 h-5 rounded-full transition-colors ${formData.insurance ? 'bg-brand' : 'bg-gray-200'}`} />
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${formData.insurance ? 'translate-x-5' : ''}`} />
                  </div>
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">Seguro de envío incluido</span>
                </label>
                <div>
                  {label('Notas')}
                  <textarea
                    value={formData.notes || ''}
                    onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                    rows={2}
                    placeholder="Instrucciones especiales para la entrega..."
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none hover:border-gray-300 focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all resize-none"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 flex justify-end gap-3 px-6 py-4 bg-white border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando...</> : 'Crear Etiqueta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
