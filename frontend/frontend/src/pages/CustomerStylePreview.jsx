import { useState } from 'react'
import {
  AnimatedButton,
  AnimatedCard,
  AnimatedCardGrid,
  AnimatedInput,
  AnimatedModal,
  HeatRipple,
  ScrollReveal,
} from '../components/motion'
import usePageTitle from '../hooks/usePageTitle'

/**
 * Temporary motion design-system playground.
 * Delete after customer rollout is complete.
 */
export default function CustomerStylePreview() {
  usePageTitle('Motion Style Preview')
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [showError, setShowError] = useState(false)

  const triggerError = () => {
    setShowError(true)
    setTimeout(() => setShowError(false), 1600)
  }

  return (
    <div className="motion-ds min-h-screen">
      <HeatRipple className="border-b border-[var(--color-border)]" intensity={0.42}>
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[var(--color-accent-secondary)]">
            Motion DS · Temporary preview
          </p>
          <h1 className="font-display text-5xl sm:text-7xl text-[var(--color-text)] leading-none">
            Ember & Charcoal
          </h1>
          <p className="mt-4 max-w-xl text-[var(--color-text-muted)]">
            Move your cursor across this hero — the heat ripple lags behind. Below: every core
            primitive in isolation before rollout.
          </p>
        </div>
      </HeatRipple>

      <div className="mx-auto max-w-5xl space-y-16 px-6 py-12">
        <section className="space-y-4">
          <h2 className="font-display text-3xl text-[var(--color-text)]">Buttons</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            Hover for scale + glow. Tap for a quick press. Secondary sweeps gold left→right.
          </p>
          <div className="flex flex-wrap gap-3">
            <AnimatedButton onClick={() => setModalOpen(true)}>Primary · Open modal</AnimatedButton>
            <AnimatedButton variant="secondary">Secondary</AnimatedButton>
            <AnimatedButton variant="ghost">Ghost</AnimatedButton>
            <AnimatedButton variant="danger">Danger</AnimatedButton>
            <AnimatedButton disabled>Disabled</AnimatedButton>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-3xl text-[var(--color-text)]">Cards · staggered</h2>
          <AnimatedCardGrid className="grid gap-4 sm:grid-cols-3">
            {['Spice Route', 'Night Kitchen', 'Coal Oven'].map((title) => (
              <AnimatedCard key={title} staggerChild className="p-5">
                <p className="text-xs uppercase tracking-widest text-[var(--color-accent-primary)]">
                  Restaurant
                </p>
                <h3 className="font-display mt-2 text-2xl">{title}</h3>
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                  Hover to feel the heat-lift. Cards cascade in ~65ms steps.
                </p>
              </AnimatedCard>
            ))}
          </AnimatedCardGrid>
        </section>

        <ScrollReveal direction="fade-left" className="space-y-4">
          <h2 className="font-display text-3xl text-[var(--color-text)]">Inputs</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <AnimatedInput
              label="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <AnimatedInput
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={showError ? 'Phone number is required' : ''}
            />
          </div>
          <AnimatedButton variant="secondary" onClick={triggerError}>
            Trigger error shake
          </AnimatedButton>
        </ScrollReveal>

        <ScrollReveal direction="scale-in" className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="font-display text-3xl text-[var(--color-text)]">ScrollReveal</h2>
          <p className="text-[var(--color-text-muted)]">
            This block uses <code className="text-[var(--color-accent-secondary)]">scale-in</code>.
            Scroll away and back — it won&apos;t re-fire (once: true).
          </p>
        </ScrollReveal>

        <section className="pb-20 text-sm text-[var(--color-text-muted)]">
          <p>
            Tokens live under <code className="text-[var(--color-accent-primary)]">.motion-ds</code>{' '}
            so the existing teal admin theme stays untouched until rollout.
          </p>
          <p className="mt-2">
            Route: <code>/customer/_style-preview</code> — remove after customer pages adopt these
            primitives.
          </p>
        </section>
      </div>

      <AnimatedModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Reservation locked"
        footer={
          <>
            <AnimatedButton variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </AnimatedButton>
            <AnimatedButton onClick={() => setModalOpen(false)}>Confirm</AnimatedButton>
          </>
        }
      >
        <p className="text-[var(--color-text-muted)]">
          Backdrop fades. Panel springs from 0.95 → 1 with a soft overshoot. Close to watch the exit
          reverse (AnimatePresence).
        </p>
      </AnimatedModal>
    </div>
  )
}
