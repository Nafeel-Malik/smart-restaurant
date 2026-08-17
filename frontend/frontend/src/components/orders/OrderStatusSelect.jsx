import DarkSelect from '../ui/DarkSelect'
import {
  ORDER_STATUSES,
  formatOrderStatus,
  orderStatusSelectTones,
} from '../../constants/orderStatus'

/** Shared order-status control for Superadmin + Manager orders tables. */
export default function OrderStatusSelect({ value, onChange, disabled, className = '' }) {
  const tone = orderStatusSelectTones[value] || orderStatusSelectTones.pending

  return (
    <DarkSelect
      compact
      value={value}
      onChange={onChange}
      disabled={disabled}
      toneClassName={tone}
      className={className}
      selectClassName="min-w-[10.5rem]"
    >
      {ORDER_STATUSES.map((status) => (
        <option key={status} value={status}>
          {formatOrderStatus(status)}
        </option>
      ))}
    </DarkSelect>
  )
}
