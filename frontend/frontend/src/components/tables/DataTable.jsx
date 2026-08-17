/**
 * Dark-theme data table for Superadmin / Manager.
 * Subtle row hover only — no stagger on dense rows.
 */
export default function DataTable({ columns = [], children, className = '' }) {
  return (
    <div
      className={`overflow-x-auto rounded-xl border border-outline-variant bg-surface ${className}`}
    >
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-surface-container-high text-on-surface-variant font-label-md uppercase tracking-wider text-[11px] border-b border-outline-variant">
            {columns.map((col) => (
              <th
                key={col.key || col.label}
                className={`px-gutter py-3 ${col.align === 'right' ? 'text-right' : ''} ${col.className || ''}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant [&_tr]:transition-colors [&_tr]:duration-200 [&_tr:hover]:bg-primary/10">
          {children}
        </tbody>
      </table>
    </div>
  )
}
