import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import DashboardLayout from '../layouts/DashboardLayout'
import Icon from '../components/ui/Icon'
import DarkSelect from '../components/ui/DarkSelect'
import Toggle from '../components/ui/Toggle'
import { Breadcrumbs } from '../components/common'
import {
  AnimatedButton,
  AnimatedCard,
  AnimatedInput,
  MotionBanner,
  ScrollReveal,
} from '../components/motion'
import usePageTitle from '../hooks/usePageTitle'
import { createRestaurantThunk, updateRestaurantThunk, fetchRestaurants } from '../store/restaurantSlice'

export default function AddEditRestaurant() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  usePageTitle(isEdit ? 'Edit Restaurant' : 'Add Restaurant')
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const { list: restaurants, error } = useSelector((state) => state.restaurants)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    openingTime: '09:00',
    closingTime: '23:00',
    currency: 'PKR',
    status: 1,
  })

  // Load restaurants if not already loaded to find the restaurant to edit
  useEffect(() => {
    if (restaurants.length === 0) {
      dispatch(fetchRestaurants())
    }
  }, [dispatch, restaurants.length])

  // Populate form if in edit mode and restaurant is found
  useEffect(() => {
    if (isEdit && restaurants.length > 0) {
      const restaurant = restaurants.find((r) => r._id === id)
      if (restaurant) {
        setForm({
          name: restaurant.name,
          openingTime: restaurant.openingTime || '09:00',
          closingTime: restaurant.closingTime || '23:00',
          currency: restaurant.currency || 'PKR',
          status: restaurant.status,
        })
      }
    }
  }, [isEdit, id, restaurants])

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)

    const payload = {
      name: form.name,
      openingTime: form.openingTime,
      closingTime: form.closingTime,
      currency: form.currency,
      status: form.status,
    }

    let resultAction
    if (isEdit) {
      resultAction = await dispatch(updateRestaurantThunk({ id, data: payload }))
    } else {
      resultAction = await dispatch(createRestaurantThunk(payload))
    }

    setSaving(false)

    if (
      (isEdit && updateRestaurantThunk.fulfilled.match(resultAction)) ||
      (!isEdit && createRestaurantThunk.fulfilled.match(resultAction))
    ) {
      navigate('/restaurants')
    }
  }

  return (
    <DashboardLayout title={isEdit ? 'Edit Restaurant' : 'Add Restaurant'}>
      <Breadcrumbs
        items={[
          { label: 'Restaurants', to: '/restaurants' },
          { label: isEdit ? 'Edit Details' : 'Add New' },
        ]}
      />
      <h1 className="font-headline-md text-headline-md text-primary font-semibold mb-stack-lg">
        Restaurant Configuration
      </h1>

      {error && (
        <MotionBanner type="error" className="mb-stack-md">
          {Array.isArray(error) ? error.join(', ') : error}
        </MotionBanner>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-stack-lg">
        <ScrollReveal className="lg:col-span-8">
          <AnimatedCard className="p-6 space-y-stack-md">
            <AnimatedInput
              id="restaurantName"
              label="Restaurant Name"
              placeholder="e.g. Bistro Central"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-stack-md">
              <div className="space-y-unit">
                <label className="font-label-lg text-label-lg text-on-surface-variant" htmlFor="openingTime">
                  Opening Time
                </label>
                <input
                  id="openingTime"
                  type="time"
                  value={form.openingTime}
                  onChange={(e) => update('openingTime', e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  required
                />
              </div>
              <div className="space-y-unit">
                <label className="font-label-lg text-label-lg text-on-surface-variant" htmlFor="closingTime">
                  Closing Time
                </label>
                <input
                  id="closingTime"
                  type="time"
                  value={form.closingTime}
                  onChange={(e) => update('closingTime', e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  required
                />
              </div>
            </div>
              <DarkSelect
                id="currency"
                label="Currency"
                value={form.currency}
                onChange={(e) => update('currency', e.target.value)}
              >
                {['PKR', 'USD', 'EUR', 'AED'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </DarkSelect>
            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg">
              <div>
                <p className="font-label-lg text-on-surface font-semibold">
                  {form.status === 1 ? 'Active on Platform' : 'Currently Hidden'}
                </p>
                <p className="text-body-md text-on-surface-variant">Toggle visibility across the network</p>
              </div>
              <Toggle
                id="rest-active"
                checked={form.status === 1}
                onChange={(v) => update('status', v ? 1 : 0)}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <AnimatedButton variant="ghost" type="button" onClick={() => navigate('/restaurants')}>
                Cancel
              </AnimatedButton>
              <AnimatedButton type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Icon name="save" size={18} />
                    Save Changes
                  </>
                )}
              </AnimatedButton>
            </div>
          </AnimatedCard>
        </ScrollReveal>

        <ScrollReveal delay={0.08} className="lg:col-span-4 space-y-stack-lg">
          <AnimatedCard className="p-6">
            <h3 className="font-label-lg text-primary font-semibold mb-4">Restaurant Status</h3>
            <p className="text-body-md text-on-surface-variant">
              When creating or editing a restaurant, make sure to set the working operating hours correctly. Assign, reassign, or unassign branch managers from the Managers directory.
            </p>
          </AnimatedCard>
        </ScrollReveal>
      </form>
    </DashboardLayout>
  )
}
