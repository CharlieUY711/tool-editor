import React from 'react'
import ReactDOM from 'react-dom/client'
import { ShippingLabelManager } from './components/ShippingLabelManager'
import './index.css'

/**
 * Modo standalone: el userId se puede pasar por env o query param.
 * En producción con auth real, acá iría el flujo de login.
 *
 * Para desarrollo rápido, usá VITE_DEV_USER_ID en tu .env.local
 */
const devUserId = import.meta.env.VITE_DEV_USER_ID || 'dev-user-placeholder'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ShippingLabelManager userId={devUserId} />
  </React.StrictMode>
)
