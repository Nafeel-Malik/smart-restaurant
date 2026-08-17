import DarkSelect from './DarkSelect'

export default function Select({ label, id, icon, children, className = '', ...props }) {
  return (
    <DarkSelect label={label} id={id} icon={icon} className={className} {...props}>
      {children}
    </DarkSelect>
  )
}
