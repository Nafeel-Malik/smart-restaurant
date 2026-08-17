import { Link } from 'react-router-dom'

/**
 * Shared dark footer for all three portals.
 * Keep simple — brand + year; no portal cross-links.
 */
export default function Footer({ portalLabel = '' }) {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-auto border-t border-outline-variant bg-surface/80 px-3 py-4 sm:px-4 md:px-container-margin">
      <div className="flex flex-col items-center gap-3 text-center text-sm text-on-surface-variant sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:text-left">
        <p className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          <span className="font-display text-base tracking-[0.08em] text-primary">RestoPro</span>
          {portalLabel ? (
            <span className="text-xs uppercase tracking-[0.14em] opacity-70">{portalLabel}</span>
          ) : null}
        </p>
        <p className="text-xs order-3 sm:order-none w-full sm:w-auto">© {year} RestoPro · Smart Restaurant Management</p>
        <p className="text-xs flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <Link to="#" className="hover:text-primary transition-colors pointer-events-none opacity-60">
            Support
          </Link>
          <span className="mx-2 opacity-40">·</span>
          <Link to="#" className="hover:text-primary transition-colors pointer-events-none opacity-60">
            Privacy
          </Link>
        </p>
      </div>
    </footer>
  )
}
