import { Link, NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Icon from '../ui/Icon'
import { useMotionPrefs } from '../../motion/useMotionPrefs'

function NavItems({ navItems, homePath, onClose, compact = false }) {
  return (
    <nav className="flex-1 space-y-1" aria-label="Portal navigation">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === homePath}
          onClick={onClose}
          title={compact ? item.label : undefined}
          className={({ isActive }) =>
            `flex items-center transition-all duration-200 ${
              compact
                ? `justify-center px-2 py-3 rounded-xl mx-2 ${isActive ? 'bg-primary/15 text-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`
                : `px-gutter py-3 ${isActive ? 'text-primary font-bold border-l-4 border-primary bg-primary/10' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface border-l-4 border-transparent'}`
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon name={item.icon} filled={isActive} className={compact ? '' : 'mr-3'} />
              {compact ? (
                <span className="sr-only">{item.label}</span>
              ) : (
                <span className="font-body-md text-body-md">{item.label}</span>
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

/**
 * Prop-driven sidebar — full (lg+), icon rail (sm–lg), drawer (<sm / toggle).
 */
export default function Sidebar({
  navItems = [],
  portalLabel = 'Portal',
  homePath = '/',
  user = { name: '', role: '', avatar: null },
  onLogout,
  mobileOpen = false,
  onClose,
}) {
  const { reduced } = useMotionPrefs()

  const userBlock = (compact = false) => (
    <div className={`${compact ? 'px-2' : 'px-gutter'} pt-stack-md mt-auto space-y-3`}>
      {!compact && (
        <div className="flex items-center gap-3 rounded-lg border border-outline-variant bg-surface-container-low p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-primary/40 bg-surface-container-highest text-sm font-semibold text-primary">
            {user.avatar ? (
              <img className="h-full w-full object-cover" src={user.avatar} alt={user.name} />
            ) : user.name ? (
              <span aria-hidden>{String(user.name).trim().charAt(0).toUpperCase()}</span>
            ) : (
              <Icon name="account_circle" className="text-primary" />
            )}
          </div>
          <div className="min-w-0 flex flex-col">
            <span className="truncate font-label-lg text-label-lg text-on-surface">{user.name || 'User'}</span>
            <span className="truncate font-label-md text-label-md text-on-surface-variant">{user.role || ''}</span>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={onLogout}
        title={compact ? 'Logout' : undefined}
        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 min-h-[44px] text-on-surface-variant transition-colors hover:bg-error-container hover:text-error ${
          compact ? 'justify-center' : ''
        }`}
      >
        <Icon name="logout" size={18} />
        {compact ? <span className="sr-only">Logout</span> : <span className="font-label-lg">Logout</span>}
      </button>
    </div>
  )

  const fullAside = (
    <aside className="fixed left-0 top-0 z-50 flex h-full w-[260px] flex-col overflow-y-auto border-r border-outline-variant bg-surface py-gutter">
      <div className="mb-stack-lg flex items-start justify-between gap-2 px-gutter">
        <Link to={homePath} onClick={onClose} className="group min-w-0" aria-label={`RestoPro ${portalLabel} home`}>
          <h1 className="font-display text-2xl tracking-[0.1em] text-primary transition-colors group-hover:text-[var(--color-accent-secondary)]">
            RestoPro
          </h1>
          <p className="mt-0.5 text-xs uppercase tracking-[0.16em] text-on-surface-variant">{portalLabel}</p>
        </Link>
        {onClose ? (
          <button type="button" className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center p-2 text-on-surface-variant sm:hidden" onClick={onClose} aria-label="Close menu">
            <Icon name="close" />
          </button>
        ) : null}
      </div>
      <NavItems navItems={navItems} homePath={homePath} onClose={onClose} />
      {userBlock(false)}
    </aside>
  )

  const railAside = (
    <aside className="fixed left-0 top-0 z-40 flex h-full w-[72px] flex-col border-r border-outline-variant bg-surface py-gutter">
      <Link
        to={homePath}
        className="mb-stack-lg flex justify-center px-2"
        aria-label={`RestoPro ${portalLabel} home`}
        title={portalLabel}
      >
        <span className="font-display text-lg tracking-[0.08em] text-primary">R</span>
      </Link>
      <NavItems navItems={navItems} homePath={homePath} onClose={onClose} compact />
      {userBlock(true)}
    </aside>
  )

  return (
    <>
      <div className="hidden lg:block">{fullAside}</div>
      <div className="hidden sm:block lg:hidden">{railAside}</div>
      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={reduced ? { duration: 0.01 } : { duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/55 sm:hidden"
              onClick={onClose}
              aria-hidden
            />
            <motion.div
              initial={{ x: reduced ? 0 : -280 }}
              animate={{ x: 0 }}
              exit={{ x: reduced ? 0 : -280 }}
              transition={
                reduced ? { duration: 0.01 } : { type: 'spring', damping: 28, stiffness: 320 }
              }
              className="fixed inset-y-0 left-0 z-50 sm:hidden"
            >
              {fullAside}
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  )
}
