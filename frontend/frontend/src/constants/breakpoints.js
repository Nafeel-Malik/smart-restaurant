/**
 * Responsive breakpoints — aligned with Tailwind v4 defaults in this project.
 * Use Tailwind prefixes in JSX; use these constants only when JS media queries are required.
 *
 * | Name    | Range        | Tailwind                          |
 * |---------|--------------|-----------------------------------|
 * | mobile  | ≤640px       | default / max-sm: (below 640px)   |
 * | tablet  | 641–1024px   | sm: … lg: (640px–1023px)          |
 * | desktop | ≥1025px      | lg: (1024px+)                     |
 */
export const BREAKPOINTS = {
  mobileMax: 640,
  tabletMin: 641,
  tabletMax: 1024,
  desktopMin: 1025,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
}

export const GRID = {
  cards: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-stack-lg',
  cardsThree: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-stack-lg',
  stats: 'grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-stack-lg',
}

/** Stat card / dashboard metric labels — wrap cleanly on 320px screens. */
export const STAT_LABEL =
  'stat-label min-w-0 break-words font-label-md text-label-md text-on-surface-variant uppercase tracking-widest leading-snug max-[399px]:text-[10px] max-[399px]:tracking-wide'

/** Stat card body wrapper (place next to icon). */
export const STAT_BODY = 'min-w-0 flex-1'

/** Page content wrappers — use inside AppShell (shell already provides padding). */
export const PAGE = {
  container: 'mx-auto w-full max-w-5xl space-y-stack-lg overflow-x-hidden',
  containerFab: 'mx-auto w-full max-w-5xl space-y-stack-lg overflow-x-hidden pb-28',
}
