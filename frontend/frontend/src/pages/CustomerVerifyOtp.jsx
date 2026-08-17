import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import Icon from '../components/ui/Icon'
import AuthCard, { AuthStagger } from '../components/motion/AuthCard'
import { AnimatedButton, MotionBanner } from '../components/motion'
import OtpCooldownRing from '../components/motion/OtpCooldownRing'
import { useMotionPrefs } from '../motion/useMotionPrefs'
import usePageTitle from '../hooks/usePageTitle'
import { clearCustomerError, resendOtp, verifyOtp } from '../store/customerAuthSlice'

const OTP_LENGTH = 6
const COOLDOWN_TOTAL = 60

export default function CustomerVerifyOtp() {
  usePageTitle('Verify Email')
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { reduced, tween } = useMotionPrefs()

  const emailFromState = location.state?.email || ''
  const emailFromQuery = searchParams.get('email') || ''
  const email = (emailFromState || emailFromQuery).trim().toLowerCase()
  const initialCooldown = Number(location.state?.cooldown ?? 60)
  const emailFailed = Boolean(location.state?.emailFailed)

  const [digits, setDigits] = useState(() => Array(OTP_LENGTH).fill(''))
  const [focusedIndex, setFocusedIndex] = useState(0)
  const [shakeKey, setShakeKey] = useState(0)
  const [popIndex, setPopIndex] = useState(-1)
  const [secondsLeft, setSecondsLeft] = useState(initialCooldown > 0 ? initialCooldown : 0)
  const [localError, setLocalError] = useState(null)
  const inputRefs = useRef([])

  const otp = digits.join('')

  const { otpLoading, otpError, resendLoading, resendError, resendMessage, resendRetryAfter } = useSelector(
    (state) => state.customerAuth
  )

  const verifyError = localError || otpError

  useEffect(() => {
    dispatch(clearCustomerError())
  }, [dispatch])

  useEffect(() => {
    if (resendRetryAfter) setSecondsLeft(Number(resendRetryAfter))
  }, [resendRetryAfter])

  useEffect(() => {
    if (secondsLeft <= 0) return undefined
    const timer = setInterval(() => {
      setSecondsLeft((value) => (value > 0 ? value - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [secondsLeft])

  useEffect(() => {
    if (verifyError) setShakeKey((k) => k + 1)
  }, [verifyError])

  const canResend = secondsLeft <= 0 && !resendLoading

  const focusBox = (index) => {
    const clamped = Math.max(0, Math.min(OTP_LENGTH - 1, index))
    inputRefs.current[clamped]?.focus()
  }

  const updateDigit = (index, value) => {
    const char = value.replace(/\D/g, '').slice(-1)
    setDigits((prev) => {
      const next = [...prev]
      next[index] = char
      return next
    })
    if (char) {
      setPopIndex(index)
      if (index < OTP_LENGTH - 1) focusBox(index + 1)
    }
  }

  const handleDigitKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        setDigits((prev) => {
          const next = [...prev]
          next[index] = ''
          return next
        })
      } else if (index > 0) {
        focusBox(index - 1)
        setDigits((prev) => {
          const next = [...prev]
          next[index - 1] = ''
          return next
        })
      }
      e.preventDefault()
      return
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      focusBox(index - 1)
    }
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      e.preventDefault()
      focusBox(index + 1)
    }
  }

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return
    e.preventDefault()
    const next = Array(OTP_LENGTH).fill('')
    pasted.split('').forEach((char, i) => {
      next[i] = char
    })
    setDigits(next)
    setPopIndex(Math.min(pasted.length - 1, OTP_LENGTH - 1))
    focusBox(Math.min(pasted.length, OTP_LENGTH - 1))
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setLocalError(null)
    if (!email) {
      setLocalError('Email is required. Please register or log in again.')
      return
    }
    if (!/^\d{6}$/.test(otp.trim())) {
      setLocalError('Enter the 6-digit code from your email')
      return
    }

    const result = await dispatch(verifyOtp({ email, otp: otp.trim() }))
    if (verifyOtp.fulfilled.match(result)) {
      navigate('/customer/dashboard')
    }
  }

  const handleResend = async () => {
    if (!canResend || !email) return
    setLocalError(null)
    const result = await dispatch(resendOtp({ email }))
    if (resendOtp.fulfilled.match(result)) {
      setSecondsLeft(COOLDOWN_TOTAL)
    } else if (result.payload?.retryAfterSeconds) {
      setSecondsLeft(Number(result.payload.retryAfterSeconds))
    }
  }

  const cooldownLabel = useMemo(() => {
    if (secondsLeft <= 0) return 'Didn’t get the code?'
    return `Resend available in ${secondsLeft}s`
  }, [secondsLeft])

  return (
    <AuthCard
      icon="mark_email_read"
      eyebrow="One more step"
      title="Enter OTP"
      subtitle={
        <>
          We sent a 6-digit code to{' '}
          <span className="font-semibold text-[var(--color-text)]">{email || 'your email'}</span>. It
          expires in 10 minutes.
        </>
      }
      footer={
        <p>
          Wrong email?{' '}
          <Link
            className="font-semibold text-[var(--color-accent-secondary)] hover:underline"
            to="/customer/register"
          >
            Register again
          </Link>
        </p>
      }
    >
      <AuthStagger className="space-y-4">
        {emailFailed ? (
          <MotionBanner type="error" shake>
            Account created, but the verification email could not be sent. Tap Resend OTP after email
            is configured, or try again now.
          </MotionBanner>
        ) : null}

        {(localError || otpError || resendError) ? (
          <MotionBanner type="error" shake>
            {localError || otpError || resendError}
          </MotionBanner>
        ) : null}

        {resendMessage && !resendError ? (
          <MotionBanner type="success">{resendMessage}</MotionBanner>
        ) : null}

        {!email ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            Missing email.{' '}
            <Link to="/customer/register" className="font-semibold text-[var(--color-accent-secondary)] hover:underline">
              Register again
            </Link>
            {' or '}
            <Link to="/customer/login" className="font-semibold text-[var(--color-accent-secondary)] hover:underline">
              log in
            </Link>
            .
          </p>
        ) : null}

        <form className="space-y-4" onSubmit={handleVerify}>
          <div>
            <label className="mb-2 block text-sm text-[var(--color-text-muted)]" htmlFor="otp-0">
              Verification code
            </label>
            <motion.div
              key={verifyError ? `shake-${shakeKey}` : 'otp-row'}
              className={`flex justify-between gap-2 sm:gap-3 ${verifyError && !reduced ? 'motion-input-shake' : ''}`}
              role="group"
              aria-label="6-digit verification code"
            >
              {digits.map((digit, index) => {
                const isFocused = focusedIndex === index
                const isPopping = popIndex === index && !reduced
                const glow =
                  isFocused && !reduced
                    ? '0 0 0 3px rgba(255,77,0,0.28)'
                    : '0 0 0 0 transparent'
                const borderColor = isFocused
                  ? 'var(--color-accent-primary)'
                  : 'var(--color-border)'

                return (
                  <motion.input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el
                    }}
                    id={index === 0 ? 'otp-0' : undefined}
                    type="text"
                    inputMode="numeric"
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    maxLength={1}
                    value={digit}
                    aria-label={`Digit ${index + 1}`}
                    disabled={!email}
                    onChange={(e) => updateDigit(index, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(index, e)}
                    onPaste={handlePaste}
                    onFocus={() => setFocusedIndex(index)}
                    onBlur={() => setFocusedIndex((prev) => (prev === index ? -1 : prev))}
                    animate={{
                      scale: isPopping ? [1.14, 1] : 1,
                      borderColor,
                      boxShadow: glow,
                    }}
                    transition={tween(0.22)}
                    onAnimationComplete={() => {
                      if (popIndex === index) setPopIndex(-1)
                    }}
                    className="h-12 w-11 rounded-xl border border-solid bg-[var(--color-surface-elevated)] text-center font-display text-xl text-[var(--color-text)] outline-none disabled:opacity-50 sm:h-14 sm:w-12"
                    style={{ borderWidth: 1 }}
                  />
                )
              })}
            </motion.div>
          </div>

          <AnimatedButton className="w-full py-4" type="submit" disabled={otpLoading || !email}>
            {otpLoading ? (
              <>
                <Icon name="progress_activity" className="animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                Verify email
                <Icon name="arrow_forward" />
              </>
            )}
          </AnimatedButton>
        </form>

        <OtpCooldownRing
          secondsLeft={secondsLeft}
          total={COOLDOWN_TOTAL}
          label={cooldownLabel}
        >
          <AnimatedButton
            type="button"
            variant={canResend ? 'secondary' : 'ghost'}
            onClick={handleResend}
            disabled={!canResend || !email}
          >
            {resendLoading ? 'Sending…' : 'Resend OTP'}
          </AnimatedButton>
        </OtpCooldownRing>
      </AuthStagger>
    </AuthCard>
  )
}
