import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../ui/Icon'
import AnimatedButton from '../motion/AnimatedButton'
import { SearchBar } from '../common'

/**
 * Topbar for AppShell — responsive search, actions, and title reflow.
 */
export default function Navbar({
  title,
  subtitle,
  searchPlaceholder = 'Search...',
  onMenuClick,
  showSearch = true,
  showAdd = false,
  addLabel = 'Add New',
  onAdd,
  actions,
  onSearch,
  homePath = '/',
}) {
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const navigate = useNavigate()

  const handleQueryChange = (e) => {
    setQuery(e.target.value)
    onSearch?.(e.target.value)
  }

  return (
    <header className="sticky top-0 z-30 border-b border-outline-variant bg-surface/95 backdrop-blur">
      <div className="flex h-14 min-h-[56px] items-center justify-between gap-2 px-3 sm:h-16 sm:gap-3 sm:px-4 md:px-container-margin">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="shrink-0 rounded-full p-2.5 min-h-[44px] min-w-[44px] text-on-surface-variant hover:bg-surface-container sm:hidden"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Icon name="menu" />
          </button>
          <button
            type="button"
            onClick={() => navigate(homePath)}
            className="min-w-0 flex-1 text-left transition-opacity hover:opacity-90"
            title="Go to dashboard"
          >
            <h2 className="truncate font-display text-lg tracking-[0.06em] text-primary sm:text-xl lg:text-2xl">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-0.5 hidden truncate font-label-md text-label-md text-on-surface-variant md:block">
                {subtitle}
              </p>
            ) : null}
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2 md:gap-3">
          {showSearch ? (
            <>
              <SearchBar
                placeholder={searchPlaceholder}
                value={query}
                onChange={handleQueryChange}
                className="hidden md:flex"
              />
              <button
                type="button"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2.5 text-on-surface-variant hover:bg-surface-container md:hidden"
                aria-label={searchOpen ? 'Close search' : 'Open search'}
                aria-expanded={searchOpen}
                onClick={() => setSearchOpen((v) => !v)}
              >
                <Icon name={searchOpen ? 'close' : 'search'} />
              </button>
            </>
          ) : null}

          <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2 md:border-l md:border-outline-variant md:pl-gutter">
            <button
              type="button"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2.5 text-on-surface-variant transition-colors hover:bg-surface-container"
              aria-label="Notifications"
            >
              <Icon name="notifications" />
            </button>
            <button
              type="button"
              className="hidden min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2.5 text-on-surface-variant transition-colors hover:bg-surface-container sm:inline-flex"
              aria-label="Help"
            >
              <Icon name="help" />
            </button>
            {actions}
            {showAdd ? (
              <AnimatedButton
                onClick={onAdd}
                aria-label={addLabel}
                className="shrink-0 !min-h-[44px] !min-w-[44px] !justify-center !gap-0 !rounded-full !px-0 sm:!min-w-0 sm:!gap-2 sm:!rounded-lg sm:!px-4 sm:!py-2"
              >
                <Icon name="add" size={20} className="shrink-0" />
                <span className="hidden lg:inline">{addLabel}</span>
              </AnimatedButton>
            ) : null}
          </div>
        </div>
      </div>

      {showSearch && searchOpen ? (
        <div className="border-t border-outline-variant px-3 py-2 md:hidden">
          <div className="flex items-center rounded-full border border-outline-variant bg-surface-container-low px-3 py-2">
            <Icon name="search" className="mr-2 shrink-0 text-outline" size={18} />
            <input
              type="search"
              autoFocus
              value={query}
              onChange={handleQueryChange}
              placeholder={searchPlaceholder}
              className="min-h-[36px] w-full bg-transparent text-body-md outline-none placeholder:text-outline-variant"
            />
          </div>
        </div>
      ) : null}
    </header>
  )
}
