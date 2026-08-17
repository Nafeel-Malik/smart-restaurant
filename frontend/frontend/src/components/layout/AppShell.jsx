import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, MotionConfig } from 'framer-motion'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import Footer from './Footer'
import PageWrapper from '../motion/PageWrapper'
import RouteErrorBoundary from '../common/RouteErrorBoundary'

/**
 * ONE shared app shell for Customer, Manager, and Superadmin.
 * Configure via props — do not fork copies per portal.
 */
export default function AppShell({
  navItems = [],
  portalLabel = 'Portal',
  homePath = '/',
  user = { name: '', role: '', avatar: null },
  onLogout,
  title,
  subtitle,
  searchPlaceholder = 'Search...',
  onSearch,
  showSearch = true,
  showAdd = false,
  addLabel = 'Add New',
  onAdd,
  actions,
  children,
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const resolvedTitle =
    title ||
    navItems.find((item) =>
      item.path === homePath
        ? location.pathname === item.path || location.pathname === `${item.path}/`
        : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`),
    )?.label ||
    portalLabel

  return (
    <MotionConfig reducedMotion="user">
      <div className="motion-ds bg-background text-on-background min-h-screen">
        <Sidebar
          navItems={navItems}
          portalLabel={portalLabel}
          homePath={homePath}
          user={user}
          onLogout={onLogout}
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />

        <div className="min-h-screen flex flex-col sm:ml-[72px] lg:ml-[260px] max-w-[100vw] overflow-x-hidden">
          <Navbar
            title={resolvedTitle}
            subtitle={subtitle}
            searchPlaceholder={searchPlaceholder}
            onMenuClick={() => setMobileOpen(true)}
            showSearch={showSearch}
            showAdd={showAdd}
            addLabel={addLabel}
            onAdd={onAdd}
            onSearch={onSearch}
            homePath={homePath}
            actions={actions}
          />

          <main className="flex-1 overflow-x-hidden p-3 sm:p-4 md:p-container-margin">
            <RouteErrorBoundary>
              <AnimatePresence mode="wait">
                <PageWrapper key={location.pathname}>{children}</PageWrapper>
              </AnimatePresence>
            </RouteErrorBoundary>
          </main>

          <Footer portalLabel={portalLabel} />
        </div>
      </div>
    </MotionConfig>
  )
}
