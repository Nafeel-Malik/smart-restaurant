import { createContext, useContext, useMemo, useState } from 'react'

const SidebarContext = createContext(null)

export function SidebarProvider({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const value = useMemo(
    () => ({
      mobileOpen,
      openSidebar: () => setMobileOpen(true),
      closeSidebar: () => setMobileOpen(false),
      toggleSidebar: () => setMobileOpen((v) => !v),
    }),
    [mobileOpen],
  )
  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}

export function useSidebar() {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider')
  return ctx
}
