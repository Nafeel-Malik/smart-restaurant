import { useEffect, useRef, useState } from 'react'
import { useMotionPrefs } from '../../motion/useMotionPrefs'

/**
 * Cursor-reactive ember heat ripple.
 * On touch / coarse pointers / reduced-motion: static ambient glow (no mouse-follow).
 */
export default function HeatRipple({
  className = '',
  intensity = 0.35,
  children,
  /** When true, fills as a full-bleed ambient layer (auth screens). */
  fill = false,
}) {
  const { reduced } = useMotionPrefs()
  const rootRef = useRef(null)
  const target = useRef({ x: 0.5, y: 0.4 })
  const current = useRef({ x: 0.5, y: 0.4 })
  const raf = useRef(0)
  const [followCursor, setFollowCursor] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const mqHover = window.matchMedia('(hover: hover) and (pointer: fine)')
    const update = () => setFollowCursor(mqHover.matches && !reduced)
    update()
    mqHover.addEventListener?.('change', update)
    return () => mqHover.removeEventListener?.('change', update)
  }, [reduced])

  useEffect(() => {
    const el = rootRef.current
    if (!el) return undefined

    const setVars = (x, y) => {
      el.style.setProperty('--heat-x', `${(x * 100).toFixed(2)}%`)
      el.style.setProperty('--heat-y', `${(y * 100).toFixed(2)}%`)
    }

    setVars(0.5, 0.4)

    if (!followCursor) {
      return undefined
    }

    const tick = () => {
      const t = target.current
      const c = current.current
      c.x += (t.x - c.x) * 0.08
      c.y += (t.y - c.y) * 0.08
      setVars(c.x, c.y)
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)

    const onMove = (e) => {
      const rect = el.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      target.current = {
        x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
        y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
      }
    }

    const onLeave = () => {
      target.current = { x: 0.5, y: 0.4 }
    }

    // Full-bleed layers are often pointer-events:none — listen on window so the form stays clickable
    const moveTarget = fill ? window : el
    moveTarget.addEventListener('pointermove', onMove)
    if (!fill) el.addEventListener('pointerleave', onLeave)

    return () => {
      cancelAnimationFrame(raf.current)
      moveTarget.removeEventListener('pointermove', onMove)
      if (!fill) el.removeEventListener('pointerleave', onLeave)
    }
  }, [followCursor, fill])

  const glowOpacity = reduced ? 0.4 : followCursor ? 1 : 0.85

  // fill=true must leave document flow. Prefer inline position so Tailwind
  // never lets a conflicting `relative` utility win over `fixed`.
  const rootClass = fill
    ? `pointer-events-none inset-0 -z-10 min-h-screen w-full overflow-hidden ${className}`
    : `relative overflow-hidden ${className}`

  return (
    <div
      ref={rootRef}
      className={rootClass}
      data-heat-mode={followCursor ? 'follow' : 'ambient'}
      style={{
        ...(fill ? { position: 'fixed', top: 0, right: 0, bottom: 0, left: 0 } : null),
        '--heat-x': '50%',
        '--heat-y': '40%',
        '--heat-intensity': intensity,
      }}
    >
      {/* Primary ember blob — follows cursor when available */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 ${!followCursor && !reduced ? 'auth-heat-ambient' : ''}`}
        style={{
          background: `radial-gradient(
            ${fill ? '680px' : '520px'} circle at var(--heat-x) var(--heat-y),
            rgba(255, 77, 0, calc(var(--heat-intensity) * 0.55)),
            rgba(255, 182, 39, calc(var(--heat-intensity) * 0.18)) 35%,
            transparent 70%
          )`,
          filter: 'blur(10px)',
          opacity: glowOpacity,
        }}
      />
      {/* Secondary static gold wash for depth on touch / ambient mode */}
      {!followCursor && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(
              420px circle at 80% 15%,
              rgba(255, 182, 39, ${reduced ? 0.08 : 0.14}),
              transparent 55%
            ),
            radial-gradient(
              380px circle at 15% 85%,
              rgba(255, 77, 0, ${reduced ? 0.1 : 0.18}),
              transparent 50%
            )`,
          }}
        />
      )}
      <div className="relative z-[1] h-full">{children}</div>
    </div>
  )
}
