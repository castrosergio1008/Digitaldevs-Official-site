'use client'

/**
 * Digital, the Digital-devs chatbot mascot.
 *
 * A friendly robot face rendered as inline SVG so it inherits the brand
 * palette (primary/accent) and stays crisp at any size. All motion is
 * CSS-driven (globals.css) and respects prefers-reduced-motion.
 */
export default function DigitalMascot({ size = 48 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="digital-mascot"
    >
      {/* Antenna */}
      <line x1="32" y1="4" x2="32" y2="12" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="32" cy="4" r="3" fill="var(--accent)" className="digital-mascot-antenna-tip" />

      {/* Head */}
      <rect x="10" y="12" width="44" height="38" rx="12" fill="url(#digital-gradient)" />
      {/* Face screen */}
      <rect x="14" y="16" width="36" height="28" rx="8" fill="var(--surface)" />

      {/* Eyes */}
      <g className="digital-mascot-eyes">
        <circle cx="24" cy="28" r="4" fill="var(--accent)" />
        <circle cx="40" cy="28" r="4" fill="var(--accent)" />
        <circle cx="25.5" cy="26.5" r="1.3" fill="white" opacity="0.85" />
        <circle cx="41.5" cy="26.5" r="1.3" fill="white" opacity="0.85" />
      </g>

      {/* Smile */}
      <path
        d="M26 35 Q32 40 38 35"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Blush */}
      <circle cx="19" cy="34" r="2.5" fill="var(--coral)" opacity="0.35" />
      <circle cx="45" cy="34" r="2.5" fill="var(--coral)" opacity="0.35" />

      {/* Ear pieces */}
      <rect x="6" y="24" width="4" height="10" rx="2" fill="var(--primary)" />
      <rect x="54" y="24" width="4" height="10" rx="2" fill="var(--primary)" />

      <defs>
        <linearGradient id="digital-gradient" x1="10" y1="12" x2="54" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--accent)" />
        </linearGradient>
      </defs>
    </svg>
  )
}
