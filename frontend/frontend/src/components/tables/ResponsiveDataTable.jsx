/**
 * Responsive data table — full table on desktop (lg+), stacked label:value cards below lg.
 *
 * @param {Array<{ key: string, label: string, render: (row) => ReactNode, hideOnTablet?: boolean, mobile?: boolean }>} columns
 *   mobile: false excludes from mobile card stack (verbose columns desktop-only)
 */
export default function ResponsiveDataTable({
  columns = [],
  rows = [],
  rowKey = '_id',
  footer = null,
  className = '',
}) {
  const resolveKey = (row, index) => {
    if (typeof rowKey === 'function') return rowKey(row, index)
    return row?.[rowKey] ?? index
  }

  const mobileColumns = columns.filter((col) => col.mobile !== false)

  return (
    <div
      className={`rounded-xl border border-outline-variant bg-surface overflow-hidden shadow-sm ${className}`}
    >
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full min-w-[640px] text-left border-collapse">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container-high text-[11px] font-label-md uppercase tracking-wider text-on-surface-variant">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-gutter py-3 ${col.align === 'right' ? 'text-right' : ''} ${
                    col.hideOnTablet ? 'hidden xl:table-cell' : ''
                  } ${col.headerClassName || ''}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant [&_tr]:transition-colors [&_tr:hover]:bg-primary/10">
            {rows.map((row, index) => (
              <tr key={resolveKey(row, index)}>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-gutter py-3 align-top ${col.align === 'right' ? 'text-right' : ''} ${
                      col.hideOnTablet ? 'hidden xl:table-cell' : ''
                    } ${col.cellClassName || ''}`}
                  >
                    {col.render(row, index)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-outline-variant lg:hidden">
        {rows.map((row, index) => (
          <article
            key={resolveKey(row, index)}
            className="space-y-3 p-4 transition-colors hover:bg-surface-container/60"
          >
            {mobileColumns.map((col) => (
              <div key={col.key} className="flex items-start justify-between gap-3">
                <span className="shrink-0 pt-0.5 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  {col.label}
                </span>
                <div
                  className={`min-w-0 flex-1 text-sm ${col.align === 'right' ? 'text-right' : 'text-right sm:text-left'}`}
                >
                  {col.render(row, index)}
                </div>
              </div>
            ))}
          </article>
        ))}
      </div>

      {footer ? (
        <div className="border-t border-outline-variant px-gutter py-3 text-label-md text-on-surface-variant">
          {footer}
        </div>
      ) : null}
    </div>
  )
}
