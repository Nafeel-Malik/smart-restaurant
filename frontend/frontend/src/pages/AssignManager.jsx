import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import DashboardLayout from '../layouts/DashboardLayout'
import DarkSelect from '../components/ui/DarkSelect'
import Icon from '../components/ui/Icon'
import { Breadcrumbs } from '../components/common'
import {
  AnimatedButton,
  AnimatedCard,
  AnimatedInput,
  MotionBanner,
  ScrollReveal,
} from '../components/motion'
import { createManagerThunk } from '../store/managerSlice'
import { fetchRestaurants } from '../store/restaurantSlice'
import usePageTitle from '../hooks/usePageTitle'

export default function AssignManager() {
  usePageTitle('Assign Manager')
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const { list: restaurants } = useSelector((state) => state.restaurants)
  const { error } = useSelector((state) => state.managers)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [form, setForm] = useState({ username: '', password: '', restaurant: '' })

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  useEffect(() => {
    dispatch(fetchRestaurants())
  }, [dispatch])

  const unmanagedList = restaurants.filter((r) => !r.assignedManager)
  const totalR = restaurants.length
  const unmanagedR = unmanagedList.length
  const managedR = totalR - unmanagedR
  const managedPercentage = totalR > 0 ? Math.round((managedR / totalR) * 100) : 0
  const sortedRestaurants = [...restaurants].sort((a, b) => {
    const aManaged = a.assignedManager ? 1 : 0
    const bManaged = b.assignedManager ? 1 : 0
    if (aManaged !== bManaged) return aManaged - bManaged
    return String(a.name || '').localeCompare(String(b.name || ''))
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    const targetRestaurant = restaurants.find((r) => r._id === form.restaurant)
    if (form.restaurant && targetRestaurant?.assignedManager) {
      const occupyingName = targetRestaurant.assignedManager.username || 'another manager'
      const confirmed = window.confirm(
        `"${targetRestaurant.name}" is currently assigned to "${occupyingName}". Reassign it to "${form.username}"?`
      )
      if (!confirmed) {
        setSaving(false)
        return
      }
    }

    const payload = {
      username: form.username,
      password: form.password,
    }
    if (form.restaurant) {
      payload.restaurantId = form.restaurant
    }

    const resultAction = await dispatch(createManagerThunk(payload))

    if (createManagerThunk.fulfilled.match(resultAction)) {
      navigate('/managers')
    } else {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout title="Assign Manager" searchPlaceholder="Search resources...">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Managers', to: '/managers' },
          { label: 'Add New Manager' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg">
        <ScrollReveal className="lg:col-span-7">
          <form onSubmit={handleSubmit}>
            <AnimatedCard className="p-6 space-y-stack-md">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center">
                  <Icon name="person_add" />
                </div>
                <h2 className="font-headline-sm text-primary font-semibold">Manager Credentials</h2>
              </div>

              {error && (
                <MotionBanner type="error">
                  {Array.isArray(error) ? error.join(', ') : error}
                </MotionBanner>
              )}

              <AnimatedInput
                id="username"
                label="Username"
                placeholder="Enter username"
                value={form.username}
                onChange={(e) => update('username', e.target.value)}
                required
              />
              <div className="relative">
                <AnimatedInput
                  id="password"
                  label="Temporary Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  required
                  inputClassName="pr-11"
                />
                <button
                  type="button"
                  className="absolute right-3 top-[22px] z-10 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={20} />
                </button>
              </div>

              <DarkSelect
                id="restaurant"
                label="Assign Restaurant (Optional)"
                icon="store"
                value={form.restaurant}
                onChange={(e) => update('restaurant', e.target.value)}
              >
                <option value="">Select a restaurant (optional)...</option>
                {sortedRestaurants.map((r) => {
                  const occupyingName = r.assignedManager?.username
                  return (
                    <option key={r._id} value={r._id}>
                      {occupyingName ? `${r.name} — currently ${occupyingName}` : r.name}
                    </option>
                  )
                })}
              </DarkSelect>
              <p className="text-xs text-outline -mt-2">
                Unmanaged restaurants are listed first. Choosing a managed restaurant will reassign it.
              </p>

              <div className="flex justify-end gap-3 pt-4">
                <AnimatedButton variant="ghost" className="rounded-full" type="button" onClick={() => navigate('/managers')}>
                  Cancel
                </AnimatedButton>
                <AnimatedButton type="submit" className="rounded-full" disabled={saving}>
                  <Icon name="check_circle" size={18} />
                  {saving ? 'Saving...' : 'Confirm'}
                </AnimatedButton>
              </div>
            </AnimatedCard>
          </form>
        </ScrollReveal>

        <ScrollReveal delay={0.08} className="lg:col-span-5 space-y-stack-lg">
          <AnimatedCard className="p-6 !bg-surface-container-low">
            <h3 className="font-label-lg text-primary font-semibold mb-4">Availability Overview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div><p className="text-headline-sm font-bold text-primary">{totalR}</p><p className="text-xs text-outline">Total</p></div>
              <div><p className="text-headline-sm font-bold text-error">{unmanagedR}</p><p className="text-xs text-outline">Unmanaged</p></div>
              <div><p className="text-headline-sm font-bold text-secondary">{managedPercentage}%</p><p className="text-xs text-outline">Managed</p></div>
            </div>
          </AnimatedCard>
        </ScrollReveal>
      </div>
    </DashboardLayout>
  )
}
