import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Icon from '../components/ui/Icon'
import AuthCard, { AuthStagger } from '../components/motion/AuthCard'
import { AnimatedButton, AnimatedInput, MotionBanner } from '../components/motion'
import usePageTitle from '../hooks/usePageTitle'
import { loginUser, logout } from '../store/authSlice'

export default function BranchManagerLogin() {
  usePageTitle('Branch Manager Login')
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
      if (user.role === 'branch_manager') {
        navigate('/branch')
      } else {
        dispatch(logout())
        setLocalError('This login is for branch managers only')
      }
    }
  }

  const errorMessage = localError || authError

  return (
    <AuthCard
      icon="storefront"
      portalLabel="Manager portal"
      eyebrow="Branch access"
      title="Branch Manager Login"
      subtitle="Enter your credentials to manage your location."
      footer={
        <div className="space-y-2">
          <p>
            Logging into the wrong portal?{' '}
            <Link
              className="font-semibold text-[var(--color-accent-secondary)] hover:underline decoration-2 underline-offset-4"
              to="/login"
            >
              Super Admin Entry
            </Link>
          </p>
          <p>
            Customer?{' '}
            <Link
              className="font-semibold text-[var(--color-accent-secondary)] hover:underline decoration-2 underline-offset-4"
              to="/customer/login"
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
          id="bm-username"
          label="Username"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <div className="relative">
          <AnimatedInput
            id="bm-password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            inputClassName="pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-[22px] z-10 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <Icon name={showPassword ? 'visibility_off' : 'visibility'} />
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
              Sign In to Branch
              <Icon name="arrow_forward" />
            </>
          )}
        </AnimatedButton>
      </AuthStagger>
    </AuthCard>
  )
}
