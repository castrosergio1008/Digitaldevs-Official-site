'use client'

import { useEffect, useState } from 'react'

const STEPS: Array<{ prefix: string; text: string; className: string }> = [
  { prefix: '$', text: 'digitaldevs build --produccion', className: 'text-muted' },
  { prefix: '✓', text: 'diseño y arquitectura listos', className: 'text-emerald-400' },
  { prefix: '✓', text: 'desarrollo full stack completado', className: 'text-emerald-400' },
  { prefix: '✓', text: 'despliegue en producción exitoso', className: 'text-emerald-400' },
  { prefix: '→', text: 'tu negocio creciendo en la web', className: 'text-accent' },
]

export default function Terminal() {
  const [line, setLine] = useState(0)
  const [char, setChar] = useState(0)

  useEffect(() => {
    if (line >= STEPS.length) return
    const current = STEPS[line].text
    if (char < current.length) {
      const t = setTimeout(() => setChar((c) => c + 1), 24)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => {
      setLine((l) => l + 1)
      setChar(0)
    }, 650)
    return () => clearTimeout(t)
  }, [line, char])

  return (
    <div className="animate-floaty w-full max-w-lg overflow-hidden rounded-2xl border border-edge bg-[#0a0f2e] shadow-2xl shadow-primary/10">
      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <span className="ml-3 font-mono text-xs text-slate-500">digitaldevs — terminal</span>
      </div>
      <div className="space-y-2 px-5 py-5 font-mono text-sm leading-relaxed">
        {STEPS.slice(0, line).map((s, i) => (
          <div key={i} className={s.className}>
            <span className="mr-2 text-slate-500">{s.prefix}</span>
            <span>{s.text}</span>
          </div>
        ))}
        {line < STEPS.length && (
          <div className={STEPS[line].className}>
            <span className="mr-2 text-slate-500">{STEPS[line].prefix}</span>
            <span>
              {STEPS[line].text.slice(0, char)}
              <span className="cursor-blink text-accent">▍</span>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}