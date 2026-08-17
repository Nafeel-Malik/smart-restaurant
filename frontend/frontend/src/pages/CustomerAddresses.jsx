import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Icon from '../components/ui/Icon'
import {
  AnimatedButton,
  AnimatedCard,
  AnimatedCardGrid,
  AnimatedInput,
  AnimatedModal,
  AnimatedSelect,
  EmptyState,
  MotionBanner,
  PageHero,
  SkeletonList,
} from '../components/motion'
import usePageTitle from '../hooks/usePageTitle'
import { validatePhone } from '../utils/phone'
import {
  fetchAddresses,
  addAddress,
  updateAddressThunk,
  deleteAddressThunk,
  setDefaultAddressThunk,
  clearAddressError,
} from '../store/customerAddressSlice'

const emptyForm = {
  label: 'Home',
  fullAddress: '',
  city: '',
  area: '',
  phone: '',
  latitude: '',
  longitude: '',
  isDefault: false,
}

const LABEL_OPTIONS = ['Home', 'Work', 'Other']

export default function CustomerAddresses() {
  usePageTitle('Delivery Addresses')
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { list, loading, saving, error } = useSelector((state) => state.customerAddresses)
  const customerPhone = useSelector((state) => state.customerAuth.customer?.phone || '')

  const returnTo = location.state?.returnTo || ''
  const reason = location.state?.reason || ''
  const intent = location.state?.intent || ''
  const fromCheckout = reason === 'checkout' && Boolean(returnTo)
  const autoOpenedRef = useRef(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    dispatch(fetchAddresses())
  }, [dispatch])

  const openAdd = () => {
    setEditing(null)
    setForm({ ...emptyForm, phone: customerPhone, isDefault: list.length === 0 })
    setFieldErrors({})
    dispatch(clearAddressError())
    setModalOpen(true)
  }

  const openEdit = (address) => {
    setEditing(address)
    setForm({
      label: LABEL_OPTIONS.includes(address.label) ? address.label : 'Other',
      fullAddress: address.fullAddress || '',
      city: address.city || '',
      area: address.area || '',
      phone: address.phone || '',
      latitude: address.latitude ?? '',
      longitude: address.longitude ?? '',
      isDefault: Boolean(address.isDefault),
    })
    setFieldErrors({})
    dispatch(clearAddressError())
    setModalOpen(true)
  }

  // Auto-open add/edit when arriving mid-checkout with return context
  useEffect(() => {
    if (!fromCheckout || loading || autoOpenedRef.current) return
    if (intent === 'add') {
      autoOpenedRef.current = true
      openAdd()
      return
    }
    if (intent === 'fix-phone') {
      const incomplete = list.find((a) => !String(a.phone || '').trim())
      if (incomplete) {
        autoOpenedRef.current = true
        openEdit(incomplete)
      }
    }
    // open once when list first loads for checkout return
  }, [fromCheckout, intent, loading, list, customerPhone])

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    setFieldErrors({})
  }

  const returnToCheckout = (selectedAddressId) => {
    if (!returnTo) return
    navigate(returnTo, {
      replace: true,
      state: selectedAddressId ? { selectedAddressId } : {},
    })
  }

  const validate = () => {
    const errors = {}
    if (!form.label.trim()) errors.label = 'Label is required'
    if (!form.fullAddress.trim()) errors.fullAddress = 'Full address is required'
    if (!form.city.trim()) errors.city = 'City is required'
    const phoneError = validatePhone(form.phone)
    if (phoneError) errors.phone = phoneError
    if (form.latitude !== '' && Number.isNaN(Number(form.latitude))) errors.latitude = 'Enter a valid number'
    if (form.longitude !== '' && Number.isNaN(Number(form.longitude))) errors.longitude = 'Enter a valid number'
    return errors
  }

  const buildPayload = () => {
    const payload = {
      label: form.label.trim(),
      fullAddress: form.fullAddress.trim(),
      city: form.city.trim(),
      phone: form.phone.trim(),
      isDefault: Boolean(form.isDefault),
    }
    if (form.area.trim()) payload.area = form.area.trim()
    if (form.latitude !== '' && form.latitude != null) payload.latitude = Number(form.latitude)
    if (form.longitude !== '' && form.longitude != null) payload.longitude = Number(form.longitude)
    return payload
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const errors = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    const payload = buildPayload()
    const action = editing
      ? await dispatch(updateAddressThunk({ id: editing._id, data: payload }))
      : await dispatch(addAddress(payload))

    if (!action.type.endsWith('/fulfilled')) return

    const saved = action.payload
    closeModal()

    if (returnTo) {
      returnToCheckout(saved?._id)
    }
  }

  const handleDelete = (address) => {
    const extra = address.isDefault
      ? ' This is your default address. Another address will not be promoted automatically.'
      : ''
    if (window.confirm(`Delete "${address.label}" address?${extra}`)) {
      dispatch(deleteAddressThunk(address._id))
    }
  }

  const handleSetDefault = (address) => {
    if (address.isDefault) return
    dispatch(setDefaultAddressThunk(address._id))
  }

  const backLink = fromCheckout
    ? { to: returnTo, label: 'Back to checkout', state: {} }
    : { to: '/customer/dashboard', label: 'Dashboard', state: undefined }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-stack-lg overflow-x-hidden">
      <div className="max-w-3xl mx-auto py-10 space-y-stack-lg">
        <PageHero
          heat={false}
          eyebrow={
            <>
              <Link
                to={backLink.to}
                state={backLink.state}
                className="text-sm text-secondary font-semibold hover:underline inline-flex items-center gap-1 mb-2"
              >
                <Icon name="arrow_back" size={16} />
                {backLink.label}
              </Link>
              <p className="font-label-md text-label-md text-secondary uppercase tracking-widest">Account</p>
            </>
          }
          title="Delivery Addresses"
          subtitle={
            fromCheckout
              ? "Save an address with a phone number, then we'll take you straight back to checkout."
              : undefined
          }
          actions={
            <div className="flex items-center gap-2 flex-wrap">
              {fromCheckout && (
                <AnimatedButton variant="ghost" type="button" onClick={() => returnToCheckout()}>
                  Cancel — back to checkout
                </AnimatedButton>
              )}
              <AnimatedButton onClick={openAdd}>
                <Icon name="add" size={18} />
                Add address
              </AnimatedButton>
            </div>
          }
        />

        {error && <MotionBanner type="error">{error}</MotionBanner>}

        {loading && list.length === 0 ? (
          <SkeletonList count={3} />
        ) : list.length === 0 ? (
          <EmptyState
            icon="location_on"
            title="No addresses yet"
            hint={
              fromCheckout
                ? 'Add a delivery address to continue placing your order.'
                : 'Save a delivery address so checkout can use it later.'
            }
            action={
              <AnimatedButton onClick={openAdd}>
                <Icon name="add" size={18} />
                Add your first address
              </AnimatedButton>
            }
          />
        ) : (
          <AnimatedCardGrid className="space-y-3">
            {list.map((address) => {
              const missingPhone = !String(address.phone || '').trim()
              return (
                <AnimatedCard key={address._id} staggerChild className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-on-surface">{address.label}</h3>
                        {address.isDefault && (
                          <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold uppercase tracking-wider">
                            Default
                          </span>
                        )}
                        {missingPhone && (
                          <span className="px-2 py-0.5 rounded-full bg-error-container text-on-error-container text-[11px] font-bold uppercase tracking-wider">
                            Phone required
                          </span>
                        )}
                      </div>
                      <p className="text-body-md text-on-surface mt-1">{address.fullAddress}</p>
                      <p className="text-sm text-on-surface-variant">
                        {[address.area, address.city].filter(Boolean).join(', ')}
                      </p>
                      {address.phone ? (
                        <p className="text-sm text-on-surface-variant mt-1">{address.phone}</p>
                      ) : (
                        <p className="text-sm text-error mt-1">Add a phone number before using this address for delivery.</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {!address.isDefault && (
                      <AnimatedButton variant="ghost" onClick={() => handleSetDefault(address)}>
                        Set as default
                      </AnimatedButton>
                    )}
                    <AnimatedButton variant="secondary" onClick={() => openEdit(address)}>
                      <Icon name="edit" size={16} />
                      {missingPhone ? 'Add phone' : 'Edit'}
                    </AnimatedButton>
                    <AnimatedButton variant="danger" onClick={() => handleDelete(address)}>
                      <Icon name="delete" size={16} />
                      Delete
                    </AnimatedButton>
                  </div>
                </AnimatedCard>
              )
            })}
          </AnimatedCardGrid>
        )}
      </div>

      <AnimatedModal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit address' : 'Add address'}
        footer={
          <>
            <AnimatedButton
              variant="ghost"
              type="button"
              onClick={() => {
                closeModal()
                if (fromCheckout && intent === 'add') returnToCheckout()
              }}
              disabled={saving}
            >
              {fromCheckout && intent === 'add' ? 'Cancel — back to checkout' : 'Cancel'}
            </AnimatedButton>
            <AnimatedButton type="submit" form="address-form" disabled={saving}>
              {saving ? 'Saving…' : 'Save address'}
            </AnimatedButton>
          </>
        }
      >
        <form id="address-form" onSubmit={handleSave} className="space-y-4">
          <AnimatedSelect
            id="label"
            label="Label"
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            error={fieldErrors.label}
          >
            {LABEL_OPTIONS.map((label) => (
              <option key={label} value={label}>{label}</option>
            ))}
          </AnimatedSelect>
          <AnimatedInput
            id="fullAddress"
            label="Full address"
            value={form.fullAddress}
            onChange={(e) => setForm((f) => ({ ...f, fullAddress: e.target.value }))}
            required
            error={fieldErrors.fullAddress}
          />
          <AnimatedInput
            id="city"
            label="City"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            required
            error={fieldErrors.city}
          />
          <AnimatedInput
            id="area"
            label="Area / neighborhood (optional)"
            value={form.area}
            onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
          />
          <AnimatedInput
            id="phone"
            label="Contact phone"
            placeholder="+923001234567"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            required
            error={fieldErrors.phone}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AnimatedInput
              id="latitude"
              label="Latitude (optional)"
              type="number"
              step="any"
              value={form.latitude}
              onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
              error={fieldErrors.latitude}
            />
            <AnimatedInput
              id="longitude"
              label="Longitude (optional)"
              type="number"
              step="any"
              value={form.longitude}
              onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
              error={fieldErrors.longitude}
            />
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
              className="w-4 h-4 accent-primary"
            />
            Set as default delivery address
          </label>
        </form>
      </AnimatedModal>
    </div>
  )
}
