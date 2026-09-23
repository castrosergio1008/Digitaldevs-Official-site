'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(true)

  useEffect(() => {
    const theme = document.documentElement.getAttribute('data-theme')
    setDark(theme !== 'light')
  }, [])

  const toggle = () => {
    const html = document.documentElement
    const next = dark ? 'light' : 'dark'
    html.setAttribute('data-theme', next)
    try {
      localStorage.setItem('theme', next)
    } catch {
      /* sin almacenamiento disponible */
    }
    setDark(!dark)
  }

  return (
    <button
      onClick={toggle}
      aria-pressed={!dark}
      aria-label={dark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-edge bg-soft text-muted transition-colors hover:border-primary/50 hover:text-fg"
    >
      {dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  )
}