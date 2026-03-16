/**
 * @filename main.tsx
 * @date 2026-03-15
 * @author Salman Nouman Abulqasim
 * @fileoverview Main entry point for the frontend application
 * @version 1.0.0
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'

import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
