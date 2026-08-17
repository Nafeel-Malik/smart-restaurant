import Icon from './Icon'

export default function Input({
  label,
  id,
  type = 'text',
  placeholder,
  icon,
  rightElement,
  className = '',
  inputClassName = '',
  ...props
}) {
  return (
    <div className={`space-y-unit ${className}`}>
      {label && (
        <label className="font-label-lg text-label-lg text-on-surface-variant" htmlFor={id}>
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
            <Icon name={icon} className="text-[20px]" />
          </div>
        )}
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          className={`w-full ${icon ? 'pl-10' : 'pl-4'} ${rightElement ? 'pr-10' : 'pr-4'} py-3 bg-white border border-outline-variant rounded-lg font-body-md text-body-md transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none ${inputClassName}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">{rightElement}</div>
        )}
      </div>
    </div>
  )
}
