import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Icon from '../components/ui/Icon'
import AuthCard, { AuthStagger } from '../components/motion/AuthCard'
import { AnimatedButton, AnimatedInput, MotionBanner } from '../components/motion'
import usePageTitle from '../hooks/usePageTitle'
import { loginCustomer } from '../store/customerAuthSlice'

export default function CustomerLogin() {
  usePageTitle('Customer Login')
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState(null)

  const { loading, error: authError } = useSelector((state) => state.customerAuth)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError(null)

    if (!identifier.trim() || !password) {
      setLocalError('Email/phone and password are required')
      return
    }

    const credentials = identifier.includes('@')
      ? { email: identifier.trim(), password }
      : { phone: identifier.trim(), password }

    const resultAction = await dispatch(loginCustomer(credentials))
    if (loginCustomer.fulfilled.match(resultAction)) {
      navigate('/customer/dashboard')
      return
    }
    const payload = resultAction.payload
    if (payload && typeof payload === 'object' && payload.code === 'EMAIL_NOT_VERIFIED') {
      navigate('/customer/verify-otp', {
        state: {
          email: payload.email || (identifier.includes('@') ? identifier.trim() : ''),
          cooldown: 0,
        },
      })
    }
  }

  const errorMessage = localError || authError

  return (
    <AuthCard
      icon="person"
      eyebrow="Welcome back"
      title="Customer Login"
      subtitle="Sign in with your email or phone number."
      footer={
        <div className="space-y-2">
          <p>
            New here?{' '}
            <Link
              className="font-semibold text-[var(--color-accent-secondary)] hover:underline decoration-2 underline-offset-4"
              to="/customer/register"
            >
              Create an account
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
          id="customer-identifier"
          label="Email or phone"
          placeholder="you@example.com or +923001234567"
          autoComplete="username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
        />

        <div className="relative">
          <AnimatedInput
            id="customer-password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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

        <AnimatedButton className="w-full py-4" type="submit" disabled={loading}>
          {loading ? (
            <>
              <Icon name="progress_activity" className="animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign In
              <Icon name="arrow_forward" />
            </>
          )}
        </AnimatedButton>
      </AuthStagger>
    </AuthCard>
  )
}
