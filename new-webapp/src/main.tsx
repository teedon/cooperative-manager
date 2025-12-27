import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './utils/apiTest'

console.log('🚀 Cooperative Manager Web App')
console.log('API URL:', import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api')
console.log('Run window.testAPI() in console to test API connection')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
