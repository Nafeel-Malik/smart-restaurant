export default function Toggle({ checked, onChange, label, id }) {
  return (
    <label htmlFor={id} className="inline-flex items-center cursor-pointer gap-2">
      <div className="relative">
        <input
          id={id}
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
        />
        <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-outline-variant after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary" />
      </div>
      {label && <span className="font-label-md text-label-md text-on-surface-variant">{label}</span>}
    </label>
  )
}
