import React from 'react'
import {createRoot} from 'react-dom/client'
import './style.css'
import App from './App'
import { ThemeProvider } from './context'

window.addEventListener(
  'keydown',
  (e) => {
    if (e.metaKey && (e.key === 'a' || e.key === 'A')) {
      e.preventDefault()
    }
  },
  true
)

const container = document.getElementById('root')

const root = createRoot(container)

root.render(
    <React.StrictMode>
        <ThemeProvider>
            <App/>
        </ThemeProvider>
    </React.StrictMode>
)
