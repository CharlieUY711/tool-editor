import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.\n' +
    'Copiá .env.example a .env y completá con tus credenciales de Supabase.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos de las tablas de Supabase (raw, snake_case)
export interface ShippingLabelRow {
  id: string
  order_id: string
  carrier: string
  tracking_number: string
  recipient_name: string
  recipient_phone: string | null
  recipient_email: string | null
  recipient_address: Record<string, string>
  sender_address: Record<string, string> | null
  weight: number
  dimensions: { length: number; width: number; height: number }
  label_url: string | null
  status: string
  user_id: string
  notes: string | null
  declared_value: number | null
  insurance: boolean
  created_at: string
  updated_at: string
}
