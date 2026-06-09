import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ToolEditor from './components/ToolEditor.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToolEditor />
  </StrictMode>
)
