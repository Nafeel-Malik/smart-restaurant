import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Icon from '../components/ui/Icon'
import {
  AnimatedButton,
  AnimatedCard,
  AnimatedInput,
  AnimatedSelect,
  MotionBanner,
  PageHero,
  ScrollReveal,
} from '../components/motion'
import usePageTitle from '../hooks/usePageTitle'
import { validatePhone } from '../utils/phone'
import { resolveMediaUrl } from '../services/customerAuthApi'
import {
  fetchCustomerProfile,
  updateCustomerProfile,
  changeCustomerPassword,
  uploadCustomerPicture,
  clearProfileFeedback,
} from '../store/customerAuthSlice'

const GENDER_OPTIONS = [
  { value: '', label: 'Select gender' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

const MAX_PICTURE_BYTES = 2 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

const formatGender = (value) => {
  const match = GENDER_OPTIONS.find((o) => o.value === value)
  return match?.label || '—'
}

export default function CustomerProfile() {
  usePageTitle('My Profile')
  const dispatch = useDispatch()
  const {
    customer,
    updating,
    updateError,
    updateSuccess,
    passwordUpdating,
    passwordError,
    passwordSuccess,
    pictureUploading,
    pictureError,
    pictureSuccess,
  } = useSelector((state) => state.customerAuth)

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  })
  const [passwordFieldErrors, setPasswordFieldErrors] = useState({})
  const [showPasswords, setShowPasswords] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [localPictureError, setLocalPictureError] = useState(null)

  useEffect(() => {
    dispatch(fetchCustomerProfile())
    return () => {
      dispatch(clearProfileFeedback())
    }
  }, [dispatch])

  useEffect(() => {
    if (!customer || editing) return
    setForm({
      fullName: customer.fullName || '',
      phone: customer.phone || '',
      dateOfBirth: customer.dateOfBirth ? String(customer.dateOfBirth).slice(0, 10) : '',
      gender: customer.gender || '',
    })
  }, [customer, editing])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const pictureSrc = useMemo(() => {
    if (previewUrl) return previewUrl
    return resolveMediaUrl(customer?.profilePicture)
  }, [previewUrl, customer?.profilePicture])

  const updateField = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const startEdit = () => {
    dispatch(clearProfileFeedback())
    setEditing(true)
  }

  const cancelEdit = () => {
    setEditing(false)
    setFieldErrors({})
    dispatch(clearProfileFeedback())
    if (customer) {
      setForm({
        fullName: customer.fullName || '',
        phone: customer.phone || '',
        dateOfBirth: customer.dateOfBirth ? String(customer.dateOfBirth).slice(0, 10) : '',
        gender: customer.gender || '',
      })
    }
  }

  const validateProfile = () => {
    const errors = {}
    if (!form.fullName.trim()) errors.fullName = 'Full name is required'
    const phoneError = validatePhone(form.phone)
    if (phoneError) errors.phone = phoneError
    return errors
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    const errors = validateProfile()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    const result = await dispatch(updateCustomerProfile({
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      dateOfBirth: form.dateOfBirth || undefined,
      gender: form.gender || undefined,
    }))
    if (updateCustomerProfile.fulfilled.match(result)) {
      setEditing(false)
    }
  }

  const handlePictureChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      setLocalPictureError('Only JPEG, PNG, and WebP images are allowed')
      return
    }
    if (file.size > MAX_PICTURE_BYTES) {
      setLocalPictureError('Image must be 2MB or smaller')
      return
    }
    setLocalPictureError(null)

    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(file))
    await dispatch(uploadCustomerPicture(file))
  }

  const validatePassword = () => {
    const errors = {}
    if (!passwordForm.currentPassword) errors.currentPassword = 'Current password is required'
    if (!passwordForm.newPassword) errors.newPassword = 'New password is required'
    else if (passwordForm.newPassword.length < 8) errors.newPassword = 'Password must be at least 8 characters'
    if (!passwordForm.confirmNewPassword) errors.confirmNewPassword = 'Confirm your new password'
    else if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      errors.confirmNewPassword = 'Passwords do not match'
    }
    return errors
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    const errors = validatePassword()
    setPasswordFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    const result = await dispatch(changeCustomerPassword(passwordForm))
    if (changeCustomerPassword.fulfilled.match(result)) {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' })
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-stack-lg overflow-x-hidden">
      <div className="max-w-3xl mx-auto py-10 space-y-stack-lg">
        <PageHero
          heat={false}
          eyebrow={
            <>
              <Link to="/customer/dashboard" className="text-sm text-secondary font-semibold hover:underline inline-flex items-center gap-1 mb-2">
                <Icon name="arrow_back" size={16} />
                Dashboard
              </Link>
              <p className="font-label-md text-label-md text-secondary uppercase tracking-widest">Account</p>
            </>
          }
          title="My Profile"
          actions={
            <Link to="/customer/addresses">
              <AnimatedButton variant="secondary">
                <Icon name="location_on" size={18} />
                Addresses
              </AnimatedButton>
            </Link>
          }
        />

        <ScrollReveal>
          <AnimatedCard className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="flex flex-col items-center gap-3">
                <div className="w-28 h-28 rounded-full overflow-hidden bg-primary-container text-on-primary-container flex items-center justify-center border border-outline-variant">
                  {pictureSrc ? (
                    <img src={pictureSrc} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <Icon name="person" size={48} />
                  )}
                </div>
                <label className="cursor-pointer">
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePictureChange} />
                  <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-outline-variant text-sm font-semibold hover:bg-surface-container">
                    <Icon name="photo_camera" size={16} />
                    {pictureUploading ? 'Uploading…' : 'Upload photo'}
                  </span>
                </label>
                <p className="text-[11px] text-outline text-center">JPEG, PNG or WebP · max 2MB</p>
                {(localPictureError || pictureError) && (
                  <MotionBanner type="error" className="w-full">{localPictureError || pictureError}</MotionBanner>
                )}
                {pictureSuccess && <MotionBanner type="success" className="w-full">{pictureSuccess}</MotionBanner>}
              </div>

              <div className="flex-1 w-full">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-headline-sm text-on-surface font-semibold">Profile details</h2>
                  {!editing && (
                    <AnimatedButton variant="ghost" onClick={startEdit}>
                      <Icon name="edit" size={16} />
                      Edit
                    </AnimatedButton>
                  )}
                </div>

                {updateError && <MotionBanner type="error" className="mb-4">{updateError}</MotionBanner>}
                {updateSuccess && !editing && <MotionBanner type="success" className="mb-4">{updateSuccess}</MotionBanner>}

                {!editing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <Info label="Full name" value={customer?.fullName} />
                    <Info label="Email" value={customer?.email} />
                    <Info label="Phone" value={customer?.phone} />
                    <Info label="Date of birth" value={customer?.dateOfBirth ? String(customer.dateOfBirth).slice(0, 10) : '—'} />
                    <Info label="Gender" value={formatGender(customer?.gender)} />
                  </div>
                ) : (
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <AnimatedInput
                      id="fullName"
                      label="Full name"
                      value={form.fullName}
                      onChange={(e) => updateField('fullName', e.target.value)}
                      error={fieldErrors.fullName}
                    />
                    <AnimatedInput id="email" label="Email" value={customer?.email || ''} readOnly />
                    <AnimatedInput
                      id="phone"
                      label="Phone"
                      value={form.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      error={fieldErrors.phone}
                    />
                    <AnimatedInput
                      id="dateOfBirth"
                      label="Date of birth"
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(e) => updateField('dateOfBirth', e.target.value)}
                    />
                    <AnimatedSelect
                      id="gender"
                      label="Gender"
                      value={form.gender}
                      onChange={(e) => updateField('gender', e.target.value)}
                    >
                      {GENDER_OPTIONS.map((option) => (
                        <option key={option.value || 'empty'} value={option.value}>{option.label}</option>
                      ))}
                    </AnimatedSelect>
                    <div className="flex justify-end gap-3 pt-2 flex-wrap">
                      <AnimatedButton variant="ghost" type="button" onClick={cancelEdit} disabled={updating}>Cancel</AnimatedButton>
                      <AnimatedButton type="submit" disabled={updating}>{updating ? 'Saving…' : 'Save changes'}</AnimatedButton>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </AnimatedCard>
        </ScrollReveal>

        <ScrollReveal delay={0.05}>
          <AnimatedCard className="p-6 sm:p-8">
            <h2 className="font-headline-sm text-on-surface font-semibold mb-4">Change password</h2>
            {passwordError && <MotionBanner type="error" className="mb-4">{passwordError}</MotionBanner>}
            {passwordSuccess && <MotionBanner type="success" className="mb-4">{passwordSuccess}</MotionBanner>}
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <AnimatedInput
                id="currentPassword"
                label="Current password"
                type={showPasswords ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))}
                error={passwordFieldErrors.currentPassword}
              />
              <AnimatedInput
                id="newPassword"
                label="New password"
                type={showPasswords ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
                error={passwordFieldErrors.newPassword}
              />
              <AnimatedInput
                id="confirmNewPassword"
                label="Confirm new password"
                type={showPasswords ? 'text' : 'password'}
                value={passwordForm.confirmNewPassword}
                onChange={(e) => setPasswordForm((f) => ({ ...f, confirmNewPassword: e.target.value }))}
                error={passwordFieldErrors.confirmNewPassword}
              />
              <button
                type="button"
                onClick={() => setShowPasswords((v) => !v)}
                className="text-sm text-secondary font-semibold hover:underline inline-flex items-center gap-1"
              >
                <Icon name={showPasswords ? 'visibility_off' : 'visibility'} size={16} />
                {showPasswords ? 'Hide passwords' : 'Show passwords'}
              </button>
              <AnimatedButton type="submit" disabled={passwordUpdating}>
                {passwordUpdating ? 'Updating…' : 'Update password'}
              </AnimatedButton>
            </form>
          </AnimatedCard>
        </ScrollReveal>
      </div>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div className="p-4 rounded-lg bg-surface-container-low">
      <p className="text-outline uppercase tracking-wider text-[11px] font-bold">{label}</p>
      <p className="font-semibold mt-1">{value || '—'}</p>
    </div>
  )
}
