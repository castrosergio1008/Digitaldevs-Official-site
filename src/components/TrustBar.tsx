import { Code2, GraduationCap, Rocket, Globe2 } from 'lucide-react'
import Reveal from './Reveal'

const STATS = [
  { icon: Code2, value: '3+ años', label: 'desarrollando software web' },
  { icon: GraduationCap, value: 'Tecnólogo', label: 'SENA + cursos UdeA, Andes y UTP' },
  { icon: Rocket, value: 'Ciclo completo', label: 'del diseño al despliegue y soporte' },
  { icon: Globe2, value: '100% remoto', label: 'sirviendo negocios en toda LATAM' },
]

export default function TrustBar() {
  return (
    <section className="relative border-y border-edge bg-soft/60">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-4">
        {STATS.map((s, i) => (
          <Reveal key={s.label} delay={i * 70}>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold text-fg">{s.value}</div>
                <div className="text-xs leading-snug text-muted">{s.label}</div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}