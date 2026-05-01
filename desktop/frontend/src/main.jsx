import React from 'react'
import {createRoot} from 'react-dom/client'
import './style.css'
import App from './App'
import { ThemeProvider } from './context'

function isTextInputOrEditable(target) {
  if (!target || !(target instanceof Element)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (tag === 'INPUT') {
    const t = target.type
    if (
      t === 'hidden' ||
      t === 'checkbox' ||
      t === 'radio' ||
      t === 'file' ||
      t === 'color' ||
      t === 'range' ||
      t === 'button' ||
      t === 'submit' ||
      t === 'reset'
    ) {
      return false
    }
    return true
  }
  return false
}

window.addEventListener(
  'keydown',
  (e) => {
    if (
      (e.metaKey || e.ctrlKey) &&
      (e.key === 'a' || e.key === 'A')
    ) {
      if (!isTextInputOrEditable(e.target)) {
        e.preventDefault()
      }
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
