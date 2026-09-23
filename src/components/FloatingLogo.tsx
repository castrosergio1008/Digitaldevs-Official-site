'use client'

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import Image from 'next/image'

const BOUNDS_PAD = 8
const SETTLE_MS = 300
const MAX_TILT = 7

type Bounds = { dxMin: number; dxMax: number; dyMin: number; dyMax: number }

type Drag = {
  pointerId: number
  startX: number
  startY: number
  originX: number
  originY: number
  lastX: number
  lastT: number
  vx: number
}

export default function FloatingLogo() {
  const posRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<Drag | null>(null)
  const boundsRef = useRef<Bounds | null>(null)
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [tilt, setTilt] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [settling, setSettling] = useState(false)

  useEffect(() => () => {
    if (settleTimer.current) clearTimeout(settleTimer.current)
  }, [])

  const clearSettle = () => {
    if (settleTimer.current) {
      clearTimeout(settleTimer.current)
      settleTimer.current = null
    }
    setSettling(false)
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const el = posRef.current
    if (!el) return
    clearSettle()

    const rect = el.getBoundingClientRect()
    const sectionRect = el.closest('section')?.getBoundingClientRect()
    boundsRef.current = sectionRect
      ? {
          dxMin: sectionRect.left + BOUNDS_PAD - rect.left,
          dxMax: sectionRect.right - BOUNDS_PAD - rect.right,
          dyMin: sectionRect.top + BOUNDS_PAD - rect.top,
          dyMax: sectionRect.bottom - BOUNDS_PAD - rect.bottom,
        }
      : null

    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: offset.x,
      originY: offset.y,
      lastX: e.clientX,
      lastT: performance.now(),
      vx: 0,
    }
    el.setPointerCapture(e.pointerId)
    setDragging(true)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || e.pointerId !== drag.pointerId) return

    let dx = e.clientX - drag.startX
    let dy = e.clientY - drag.startY
    const b = boundsRef.current
    if (b) {
      dx = Math.min(Math.max(dx, b.dxMin), b.dxMax)
      dy = Math.min(Math.max(dy, b.dyMin), b.dyMax)
    }
    setOffset({ x: drag.originX + dx, y: drag.originY + dy })

    const now = performance.now()
    const dt = now - drag.lastT
    if (dt >= 8) {
      const sample = Math.max(-2, Math.min(2, (e.clientX - drag.lastX) / dt))
      drag.vx = drag.vx * 0.65 + sample * 0.35
      drag.lastX = e.clientX
      drag.lastT = now
      setTilt(Math.max(-MAX_TILT, Math.min(MAX_TILT, drag.vx * 7)))
    }
  }

  const onPointerEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || e.pointerId !== drag.pointerId) return
    dragRef.current = null
    if (posRef.current?.hasPointerCapture(e.pointerId)) {
      posRef.current.releasePointerCapture(e.pointerId)
    }
    setDragging(false)
    setTilt(0)
    setSettling(true)
    settleTimer.current = setTimeout(() => setSettling(false), SETTLE_MS)
  }

  const onLostPointerCapture = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current && e.pointerId === dragRef.current.pointerId) {
      onPointerEnd(e)
    }
  }

  const visualState = dragging
    ? 'scale-95 border-primary/60 shadow-xl shadow-black/40'
    : settling
      ? 'animate-logo-settle border-primary/40 shadow-lg shadow-primary/15'
      : 'hover:scale-110 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20'

  return (
    <div
      ref={posRef}
      className={`absolute -left-2 bottom-10 hidden select-none touch-none sm:block ${dragging ? 'cursor-grabbing is-drag-active' : 'cursor-grab'}`}
      style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0)` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onLostPointerCapture={onLostPointerCapture}
    >
      <div className={`animate-floaty${dragging ? ' is-dragging' : ''}`}>
        <div
          role="img"
          aria-label="Isotipo de DigitalDevs, arrastrable"
          title="Arrástrame"
          className={`logo-visual relative overflow-hidden rounded-2xl border border-edge bg-soft opacity-90 ${visualState}`}
          style={{ rotate: `${tilt}deg` }}
        >
          <Image
            src="/isotipo.png"
            alt=""
            width={72}
            height={72}
            draggable={false}
            className="block object-cover"
          />
        </div>
      </div>
    </div>
  )
}