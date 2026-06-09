# 📦 core-etiquetas

Módulo standalone e integrable para gestión de etiquetas de envío.
Stack: **React + Vite + Electron + Supabase + TailwindCSS**.

---

## 🚀 Inicio rápido

### 1. Clonar e instalar

```bash
git clone https://github.com/CharlieUY711/core-tool-etiqueta.git
cd core-etiquetas
npm install
```

### 2. Configurar entorno

```bash
cp .env.example .env
```

Editá `.env` con tus credenciales de Supabase:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_DEV_USER_ID=tu-uuid-de-usuario  # solo para desarrollo
```

### 3. Crear tabla en Supabase

Ejecutá el archivo `supabase_migration.sql` en el **SQL Editor** de tu proyecto Supabase.
También creá el bucket de Storage llamado `shipping-labels` (puede ser privado).

### 4. Correr en desarrollo

```bash
# Solo web (browser)
npm run dev

# Electron (app de escritorio)
npm run dev:electron
```

---

## 📁 Estructura

```
core-etiquetas/
├── electron/
│   ├── main.js          # Proceso principal de Electron
│   └── preload.js       # Bridge seguro renderer ↔ main
├── src/
│   ├── components/
│   │   ├── ShippingLabelManager.tsx   # Componente raíz
│   │   ├── ShippingLabelForm.tsx      # Modal de creación
│   │   ├── ShippingLabelList.tsx      # Tabla con filtros
│   │   └── ShippingLabelPreview.tsx   # Modal de detalle
│   ├── hooks/
│   │   └── useShippingLabels.ts       # Hook principal
│   ├── services/
│   │   └── shippingLabelService.ts    # CRUD + generación PDF
│   ├── lib/
│   │   └── supabase.ts                # Cliente Supabase
│   ├── types/
│   │   └── shipping.types.ts          # Tipos TypeScript
│   ├── index.ts                       # API pública del módulo
│   └── main.tsx                       # Entry point standalone
├── supabase_migration.sql             # SQL para crear la tabla
├── .env.example
└── package.json
```

---

## 🔗 Uso integrado en otra app

El módulo exporta todo lo necesario desde `src/index.ts`.
Cuando lo uses como submódulo o paquete:

```tsx
// Uso mínimo — solo necesitás el userId del usuario autenticado
import { ShippingLabelManager } from 'core-etiquetas'

function MiApp() {
  const { user } = useAuth() // tu propio hook de auth
  return <ShippingLabelManager userId={user.id} />
}
```

```tsx
// Uso avanzado — componentes individuales
import { ShippingLabelForm, useShippingLabels } from 'core-etiquetas'

function MiVista() {
  const { labels, createLabel, stats } = useShippingLabels({ userId: user.id })
  // ... tu propia UI
}
```

```tsx
// Callback cuando se crea una etiqueta
<ShippingLabelManager
  userId={user.id}
  onLabelCreated={(label) => console.log('Nueva:', label)}
/>
```

---

## 🗄️ Supabase

### Tabla: `shipping_labels`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK autogenerado |
| `order_id` | TEXT | Número de pedido |
| `carrier` | TEXT | correos / dhl / fedex / seur / ups / otro |
| `tracking_number` | TEXT | Único, generado automáticamente |
| `recipient_name` | TEXT | Nombre del destinatario |
| `recipient_address` | JSONB | Objeto dirección |
| `weight` | NUMERIC | Peso en kg |
| `dimensions` | JSONB | { length, width, height } en cm |
| `status` | TEXT | pending / printed / shipped / delivered / cancelled |
| `user_id` | UUID | FK → auth.users |
| `label_url` | TEXT | URL del PDF en Storage |

RLS activo: cada usuario solo accede a sus propios registros.

### Storage bucket: `shipping-labels`

Los PDFs se guardan en `{userId}/{labelId}.pdf`.

---

## 🏗️ Build

```bash
# Solo web
npm run build

# App de escritorio (.exe / .dmg / .AppImage)
npm run build:electron
```

El instalador queda en `/release`.

---

## 📤 Git

```bash
# Primera vez
git init
git remote add origin https://github.com/CharlieUY711/core-tool-etiqueta.git
git add .
git commit -m "feat: módulo inicial core-etiquetas"
git push -u origin main
```

---

## 🔧 Variables de entorno

| Variable | Descripción | Requerida |
|---|---|---|
| `VITE_SUPABASE_URL` | URL de tu proyecto Supabase | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Anon key pública | ✅ |
| `VITE_DEV_USER_ID` | UUID para desarrollo sin auth | Solo dev |
