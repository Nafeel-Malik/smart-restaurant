import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Icon from '../components/ui/Icon'
import AuthCard, { AuthStagger } from '../components/motion/AuthCard'
import { AnimatedButton, AnimatedInput, MotionBanner } from '../components/motion'
import usePageTitle from '../hooks/usePageTitle'
import { loginUser, logout } from '../store/authSlice'

export default function SuperAdminLogin() {
  usePageTitle('Super Admin Login')
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState(null)

  const { loading, error: authError } = useSelector((state) => state.auth)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError(null)

    const resultAction = await dispatch(loginUser({ username, password }))
    if (loginUser.fulfilled.match(resultAction)) {
      const user = resultAction.payload.user
      if (user.role === 'super_admin') {
        navigate('/dashboard')
      } else {
        dispatch(logout())
        setLocalError('This login is for admins only')
      }
    }
  }

  const errorMessage = localError || authError

  return (
    <AuthCard
      icon="restaurant_menu"
      portalLabel="Admin portal"
      eyebrow="Enterprise access"
      title="Super Admin Login"
      subtitle="Sign in to manage restaurants, managers, and platform settings."
      footer={
        <div className="space-y-2">
          <p>
            Branch manager?{' '}
            <Link
              to="/branch-login"
              className="font-semibold text-[var(--color-accent-secondary)] hover:underline decoration-2 underline-offset-4"
            >
              Switch portal
            </Link>
          </p>
          <p>
            Customer?{' '}
            <Link
              to="/customer/login"
              className="font-semibold text-[var(--color-accent-secondary)] hover:underline decoration-2 underline-offset-4"
            >
              Open customer portal
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
          id="username"
          label="Username"
          placeholder="Enter admin username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <div className="relative">
          <AnimatedInput
            id="password"
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
            className="absolute right-3 top-[22px] z-10 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={20} />
          </button>
        </div>

        <AnimatedButton className="w-full py-4" type="submit" disabled={loading}>
          {loading ? (
            <>
              <Icon name="progress_activity" className="animate-spin" />
              Authenticating...
            </>
          ) : (
            <>
              Sign In to Dashboard
              <Icon name="arrow_forward" />
            </>
          )}
        </AnimatedButton>
      </AuthStagger>
    </AuthCard>
  )
}
