import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Icon from '../components/ui/Icon'
import AuthCard, { AuthStagger } from '../components/motion/AuthCard'
import { AnimatedButton, AnimatedInput, MotionBanner } from '../components/motion'
import usePageTitle from '../hooks/usePageTitle'
import { validatePhone } from '../utils/phone'
import { registerCustomer } from '../store/customerAuthSlice'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function CustomerRegister() {
  usePageTitle('Customer Register')
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [localError, setLocalError] = useState(null)

  const { loading, error: authError } = useSelector((state) => state.customerAuth)

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const validate = () => {
    const errors = {}
    if (!form.fullName.trim()) errors.fullName = 'Full name is required'
    if (!form.email.trim()) errors.email = 'Email is required'
    else if (!EMAIL_RE.test(form.email.trim())) errors.email = 'Enter a valid email address'
    const phoneError = validatePhone(form.phone)
    if (phoneError) errors.phone = phoneError
    if (!form.password) errors.password = 'Password is required'
    else if (form.password.length < 8) errors.password = 'Password must be at least 8 characters'
    if (!form.confirmPassword) errors.confirmPassword = 'Confirm your password'
    else if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match'
    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError(null)
    const errors = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      setLocalError('Please fix the highlighted fields')
      return
    }

    const resultAction = await dispatch(registerCustomer({
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password,
      confirmPassword: form.confirmPassword,
    }))

    if (registerCustomer.fulfilled.match(resultAction)) {
      navigate('/customer/verify-otp', {
        state: {
          email: resultAction.payload.email || form.email.trim(),
          cooldown: 60,
        },
      })
      return
    }

    const payload = resultAction.payload
    if (payload && typeof payload === 'object' && payload.code === 'ACCOUNT_CREATED_EMAIL_FAILED') {
      navigate('/customer/verify-otp', {
        state: {
          email: payload.email || form.email.trim(),
          cooldown: 0,
          emailFailed: true,
        },
      })
    }
  }

  const errorMessage = localError || authError

  return (
    <AuthCard
      icon="person_add"
      eyebrow="Get started"
      title="Create account"
      subtitle="Join RestoPro to order, reserve, and review."
      footer={
        <div className="space-y-2">
          <p>
            Already have an account?{' '}
            <Link
              className="font-semibold text-[var(--color-accent-secondary)] hover:underline decoration-2 underline-offset-4"
              to="/customer/login"
            >
              Sign in
            </Link>
          </p>
          <p className="text-xs opacity-80">
            Staff?{' '}
            <Link className="text-[var(--color-accent-secondary)] hover:underline" to="/login">
              Super Admin
            </Link>
            {' · '}
            <Link className="text-[var(--color-accent-secondary)] hover:underline" to="/branch-login">
              Branch Manager
            </Link>
          </p>
        </div>
      }
    >
      <AuthStagger as="form" className="space-y-4" onSubmit={handleSubmit}>
        {errorMessage ? (
          <MotionBanner type="error" shake>
            {errorMessage}
          </MotionBanner>
        ) : (
          <span className="hidden" />
        )}

        <AnimatedInput
          id="fullName"
          label="Full name"
          placeholder="John Doe"
          value={form.fullName}
          onChange={(e) => update('fullName', e.target.value)}
          error={fieldErrors.fullName}
          required
        />
        <AnimatedInput
          id="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          error={fieldErrors.email}
          required
        />
        <AnimatedInput
          id="phone"
          label="Phone"
          placeholder="+923001234567"
          value={form.phone}
          onChange={(e) => update('phone', e.target.value)}
          error={fieldErrors.phone}
          required
        />
        <div className="relative">
          <AnimatedInput
            id="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="At least 8 characters"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            error={fieldErrors.password}
            required
            inputClassName="pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-[22px] z-10 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <Icon name={showPassword ? 'visibility_off' : 'visibility'} />
          </button>
        </div>
        <AnimatedInput
          id="confirmPassword"
          label="Confirm password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Repeat password"
          value={form.confirmPassword}
          onChange={(e) => update('confirmPassword', e.target.value)}
          error={fieldErrors.confirmPassword}
          required
        />

        <AnimatedButton className="w-full py-4" type="submit" disabled={loading}>
          {loading ? (
            <>
              <Icon name="progress_activity" className="animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              Create account
              <Icon name="arrow_forward" />
            </>
          )}
        </AnimatedButton>
      </AuthStagger>
    </AuthCard>
  )
}
