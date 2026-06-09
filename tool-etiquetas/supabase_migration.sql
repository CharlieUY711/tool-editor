-- ============================================================
-- core-etiquetas: Migración de base de datos Supabase
-- Ejecutar en el SQL Editor de tu proyecto Supabase
-- ============================================================

-- Tabla principal de etiquetas de envío
CREATE TABLE IF NOT EXISTS shipping_labels (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id      TEXT NOT NULL,
  carrier       TEXT NOT NULL CHECK (carrier IN ('correos','dhl','fedex','seur','ups','otro')),
  tracking_number TEXT NOT NULL UNIQUE,
  recipient_name  TEXT NOT NULL,
  recipient_phone TEXT,
  recipient_email TEXT,
  recipient_address JSONB NOT NULL,
  sender_address    JSONB,
  weight          NUMERIC(8,3) NOT NULL CHECK (weight > 0),
  dimensions      JSONB NOT NULL,
  label_url       TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','printed','shipped','delivered','cancelled')),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notes           TEXT,
  declared_value  NUMERIC(10,2),
  insurance       BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices útiles para búsqueda y filtrado
CREATE INDEX IF NOT EXISTS idx_shipping_labels_user_id    ON shipping_labels(user_id);
CREATE INDEX IF NOT EXISTS idx_shipping_labels_status      ON shipping_labels(status);
CREATE INDEX IF NOT EXISTS idx_shipping_labels_order_id   ON shipping_labels(order_id);
CREATE INDEX IF NOT EXISTS idx_shipping_labels_carrier    ON shipping_labels(carrier);
CREATE INDEX IF NOT EXISTS idx_shipping_labels_created_at ON shipping_labels(created_at DESC);

-- Actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON shipping_labels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE shipping_labels ENABLE ROW LEVEL SECURITY;

-- Política: cada usuario solo ve y manipula sus propias etiquetas
CREATE POLICY "Users can manage own labels"
  ON shipping_labels
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Storage bucket para PDFs de etiquetas (ejecutar también)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('shipping-labels', 'shipping-labels', false);
-- CREATE POLICY "Users can manage own label files"
--   ON storage.objects FOR ALL
--   USING (auth.uid()::text = (storage.foldername(name))[1]);
